using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Admin;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class AdminPaymentService : IAdminPaymentService
{
    private readonly IUnitOfWork _uow;

    private static readonly HashSet<string> AllowedTypes = new(PaymentTypes.All, StringComparer.OrdinalIgnoreCase);
    private static readonly HashSet<string> AllowedStatuses = new(PaymentStatuses.All, StringComparer.OrdinalIgnoreCase);

    public AdminPaymentService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<AdminPaymentListResponse> GetPaymentsAsync(
        string? paymentType,
        string? status,
        long? userId,
        long? orderId,
        DateTime? from,
        DateTime? to,
        int skip,
        int take,
        CancellationToken cancellationToken = default)
    {
        var query = _uow.Payments.Query()
            .AsNoTracking()
            .Include(p => p.User)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Listing)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(paymentType))
        {
            var typeKey = paymentType.Trim().ToUpperInvariant();
            if (!AllowedTypes.Contains(typeKey))
            {
                throw new InvalidOperationException($"PaymentType không hợp lệ. Cho phép: {string.Join(", ", PaymentTypes.All)}.");
            }
            query = query.Where(p => p.PaymentType != null && p.PaymentType.ToUpper() == typeKey);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusKey = status.Trim().ToUpperInvariant();
            if (!AllowedStatuses.Contains(statusKey))
            {
                throw new InvalidOperationException($"Payment status không hợp lệ. Cho phép: {string.Join(", ", PaymentStatuses.All)}.");
            }
            query = query.Where(p => p.Status != null && p.Status.ToUpper() == statusKey);
        }

        if (userId.HasValue)
        {
            query = query.Where(p => p.UserId == userId.Value);
        }

        if (orderId.HasValue)
        {
            query = query.Where(p => p.OrderId == orderId.Value);
        }

        if (from.HasValue)
        {
            query = query.Where(p => p.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(p => p.CreatedAt <= to.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(p => new AdminPaymentListItem(
                p.PaymentId,
                p.PaymentType,
                p.Status,
                p.Method,
                p.PaymentStage,
                p.Amount,
                p.CommissionRate,
                p.CommissionBaseAmount,
                (p.CommissionBaseAmount ?? 0m) * (p.CommissionRate ?? 0m),
                p.SubscriptionPlanCode,
                p.SubscriptionDays,
                p.SubscriptionValidFrom,
                p.SubscriptionValidUntil,
                p.CreatedAt,
                p.UserId,
                p.User != null ? p.User.Email : null,
                p.OrderId,
                p.Order != null ? p.Order.OrderCode : null,
                p.Order != null ? p.Order.Status : null,
                p.Order != null ? p.Order.TotalAmount : null,
                p.Order != null && p.Order.Listing != null ? p.Order.Listing.Title : null))
            .ToListAsync(cancellationToken);

        return new AdminPaymentListResponse(total, items);
    }
}
