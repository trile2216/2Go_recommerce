using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Notifications;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class EscrowExpiryService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private const int ReminderWindowHours = 12;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EscrowExpiryService> _logger;

    public EscrowExpiryService(IServiceScopeFactory scopeFactory, ILogger<EscrowExpiryService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessExpiredEscrowsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Escrow expiry job failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessExpiredEscrowsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
        var escrowService = scope.ServiceProvider.GetRequiredService<IEscrowService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;
        var reminderCutoff = now.AddHours(ReminderWindowHours);
        var reminderOrders = await uow.Orders.Query()
            .Include(o => o.Escrow)
            .Where(o => o.Escrow != null &&
                        o.Escrow.DepositDeadlineAt.HasValue &&
                        o.Escrow.DepositDeadlineAt.Value > now &&
                        o.Escrow.DepositDeadlineAt.Value <= reminderCutoff &&
                        !o.Escrow.DepositReminderSentAt.HasValue &&
                        o.Escrow.Status == EscrowStatuses.Funded &&
                        (o.Status == OrderStatuses.Pending || o.Status == OrderStatuses.Confirmed))
            .ToListAsync(cancellationToken);

        foreach (var order in reminderOrders)
        {
            if (order.BuyerId.HasValue)
            {
                await SafeNotifyAsync(notificationService, order.BuyerId.Value, "ORDER",
                    "Sáº¯p háº¿t háº¡n cá»c",
                    $"ÄÆ¡n hÃ ng #{order.OrderId} sáº¯p quáº£ háº¡n cá»c. Vui lÃ²ng hoÃ n táº¥t giao dá»‹ch Ä‘á»ƒ trÃ¡nh máº¥t cá»c.",
                    $"/orders/{order.OrderId}",
                    cancellationToken);
            }
            if (order.Escrow != null)
            {
                order.Escrow.DepositReminderSentAt = now;
                uow.EscrowContracts.Update(order.Escrow);
            }
        }

        var expiredOrders = await uow.Orders.Query()
            .Include(o => o.Escrow)
            .Where(o => o.Escrow != null &&
                        o.Escrow.DepositDeadlineAt.HasValue &&
                        o.Escrow.DepositDeadlineAt.Value < now &&
                        o.Escrow.Status == EscrowStatuses.Funded &&
                        (o.Status == OrderStatuses.Pending || o.Status == OrderStatuses.Confirmed))
            .ToListAsync(cancellationToken);

        if (expiredOrders.Count == 0)
        {
            return;
        }

        foreach (var order in expiredOrders)
        {
            order.Status = OrderStatuses.Cancelled;
            uow.Orders.Update(order);
            await escrowService.ForfeitDepositForOrderAsync(order.OrderId, "Deposit deadline expired", cancellationToken);
            await RestoreListingIfReservedAsync(uow, order, cancellationToken);

            if (order.BuyerId.HasValue)
            {
                await SafeNotifyAsync(notificationService, order.BuyerId.Value, "ORDER",
                    "ÄÆ¡n hÃ ng Ä‘Ã£ há»§y",
                    $"ÄÆ¡n hÃ ng #{order.OrderId} Ä‘Ã£ quáº£ háº¡n cá»c vÃ  bá»‹ há»§y.",
                    $"/orders/{order.OrderId}",
                    cancellationToken);
            }
            if (order.SellerId.HasValue)
            {
                await SafeNotifyAsync(notificationService, order.SellerId.Value, "ORDER",
                    "Cá»c Ä‘Æ°á»£c chuyá»ƒn",
                    $"ÄÆ¡n hÃ ng #{order.OrderId} quáº£ háº¡n cá»c. Cá»c Ä‘Æ°á»£c chuyá»ƒn cho báº¡n.",
                    $"/orders/{order.OrderId}",
                    cancellationToken);
            }
        }

        await uow.SaveChangesAsync(cancellationToken);
    }

    private static async Task RestoreListingIfReservedAsync(IUnitOfWork uow, Order order, CancellationToken cancellationToken)
    {
        var listingIds = new List<long>();
        if (order.ListingId.HasValue) listingIds.Add(order.ListingId.Value);

        if (listingIds.Count == 0)
        {
            var items = await uow.OrderItems.Query()
                .Where(oi => oi.OrderId == order.OrderId && oi.ListingId.HasValue)
                .ToListAsync(cancellationToken);
            listingIds.AddRange(items.Select(oi => oi.ListingId!.Value));
        }

        if (listingIds.Count == 0) return;

        var listings = await uow.Listings.Query()
            .Where(l => listingIds.Contains(l.ListingId))
            .ToListAsync(cancellationToken);

        foreach (var listing in listings)
        {
            if (string.Equals(listing.Status, ListingStatuses.Reserved, StringComparison.OrdinalIgnoreCase))
            {
                listing.Status = ListingStatuses.Active;
                listing.AvailableQuantity = 1;
                listing.UpdatedAt = DateTime.UtcNow;
                uow.Listings.Update(listing);
            }
        }
    }

    private static async Task SafeNotifyAsync(INotificationService notificationService, long userId, string type, string title, string message, string? link, CancellationToken cancellationToken)
    {
        try
        {
            await notificationService.CreateAsync(new CreateNotificationRequest(
                userId,
                title,
                message,
                type,
                link), cancellationToken);
        }
        catch
        {
            // ignore notification failures
        }
    }
}
