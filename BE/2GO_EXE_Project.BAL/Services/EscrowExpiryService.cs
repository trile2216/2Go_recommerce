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
        await ProcessSellerConfirmSlaAsync(uow, escrowService, notificationService, now, cancellationToken);

        var reminderCutoff = now.AddHours(ReminderWindowHours);
        var reminderOrders = await uow.Orders.Query()
            .Include(o => o.Escrow)
            .Where(o => o.Escrow != null &&
                        o.Escrow.DepositDeadlineAt.HasValue &&
                        o.Escrow.DepositDeadlineAt.Value > now &&
                        o.Escrow.DepositDeadlineAt.Value <= reminderCutoff &&
                        !o.Escrow.DepositReminderSentAt.HasValue &&
                        o.Escrow.Status == EscrowStatuses.Funded &&
                        o.Status == OrderStatuses.Pending)
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
                        o.Status == OrderStatuses.Pending)
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

    private static async Task ProcessSellerConfirmSlaAsync(
        IUnitOfWork uow,
        IEscrowService escrowService,
        INotificationService notificationService,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var cutoff = now.AddHours(-OrderRules.SellerConfirmHoldHours);
        var overdueOrders = await uow.Orders.Query()
            .Include(o => o.Escrow)
            .Where(o => o.Status == OrderStatuses.Pending &&
                        o.CreatedAt.HasValue &&
                        o.CreatedAt.Value <= cutoff)
            .ToListAsync(cancellationToken);

        if (overdueOrders.Count == 0) return;

        foreach (var order in overdueOrders)
        {
            order.Status = OrderStatuses.Cancelled;
            uow.Orders.Update(order);

            await CancelPendingDepositPaymentAsync(uow, order.OrderId, cancellationToken);
            await escrowService.RefundForOrderAsync(order.OrderId, cancellationToken);
            await RestoreListingIfReservedAsync(uow, order, cancellationToken);
            await LogSellerFaultAsync(uow, order, now, cancellationToken);

            if (order.BuyerId.HasValue)
            {
                await SafeNotifyAsync(notificationService, order.BuyerId.Value, "ORDER",
                    "ÄÆ¡n hÃ ng Ä‘Ã£ há»§y",
                    $"ÄÆ¡n hÃ ng #{order.OrderId} Ä‘Ã£ bá»‹ há»§y do ngÆ°á»i bÃ¡n khÃ´ng xÃ¡c nháº­n trong {OrderRules.SellerConfirmHoldHours}h. Cá»c (náº¿u cÃ³) Ä‘Ã£ hoÃ n cho báº¡n.",
                    $"/orders/{order.OrderId}",
                    cancellationToken);
            }
            if (order.SellerId.HasValue)
            {
                await SafeNotifyAsync(notificationService, order.SellerId.Value, "ORDER",
                    "Vi pháº¡m SLA xÃ¡c nháº­n",
                    $"ÄÆ¡n hÃ ng #{order.OrderId} Ä‘Ã£ bá»‹ há»§y do báº¡n khÃ´ng xÃ¡c nháº­n trong {OrderRules.SellerConfirmHoldHours}h. HÃ nh vi Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n.",
                    $"/orders/{order.OrderId}",
                    cancellationToken);
            }
        }

        await uow.SaveChangesAsync(cancellationToken);
    }

    private static async Task CancelPendingDepositPaymentAsync(IUnitOfWork uow, long orderId, CancellationToken cancellationToken)
    {
        var payment = await uow.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == orderId &&
                                      (p.PaymentStage == PaymentStages.Deposit || p.PaymentStage == null), cancellationToken);
        if (payment == null) return;
        if (!string.Equals(payment.Status, PaymentStatuses.Pending, StringComparison.OrdinalIgnoreCase)) return;
        payment.Status = PaymentStatuses.Cancelled;
        uow.Payments.Update(payment);
    }

    private static async Task LogSellerFaultAsync(IUnitOfWork uow, Order order, DateTime now, CancellationToken cancellationToken)
    {
        if (!order.SellerId.HasValue) return;
        await uow.ActivityLogs.AddAsync(new ActivityLog
        {
            UserId = order.SellerId.Value,
            Action = "SellerConfirmSlaExpired",
            Details = $"Seller confirm SLA expired for order {order.OrderId}.",
            CreatedAt = now
        }, cancellationToken);
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
