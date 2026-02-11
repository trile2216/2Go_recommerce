using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class EscrowService : IEscrowService
{
    private readonly IUnitOfWork _uow;

    public EscrowService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    private static bool RequiresDeposit(decimal totalAmount)
    {
        return totalAmount >= EscrowRules.DepositThresholdAmount;
    }

    private static decimal CalculateDepositAmount(decimal totalAmount)
    {
        if (!RequiresDeposit(totalAmount))
        {
            return 0m;
        }
        var amount = totalAmount * EscrowRules.DepositRate;
        return Math.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    public async Task<EscrowContract> EnsureForOrderAsync(Order order, long? paymentId, CancellationToken cancellationToken = default)
    {
        var existing = await _uow.EscrowContracts.Query()
            .FirstOrDefaultAsync(e => e.OrderId == order.OrderId, cancellationToken);
        if (existing != null)
        {
            if (paymentId.HasValue && existing.PaymentId != paymentId)
            {
                existing.PaymentId = paymentId;
                existing.UpdatedAt = DateTime.UtcNow;
                _uow.EscrowContracts.Update(existing);
                await _uow.SaveChangesAsync(cancellationToken);
            }
            if (!existing.DepositRate.HasValue || existing.DepositRate.Value <= 0 || (existing.DepositAmount ?? 0m) <= 0m)
            {
                var existingTotal = existing.TotalAmount ?? order.TotalAmount ?? 0m;
                var requiresDepositExisting = RequiresDeposit(existingTotal);
                existing.DepositRate = requiresDepositExisting ? EscrowRules.DepositRate : 0m;
                existing.DepositAmount = CalculateDepositAmount(existingTotal);
                existing.UpdatedAt = DateTime.UtcNow;
                _uow.EscrowContracts.Update(existing);
                await _uow.SaveChangesAsync(cancellationToken);
            }
            return existing;
        }

        var totalAmount = order.TotalAmount ?? 0m;
        var depositAmount = CalculateDepositAmount(totalAmount);
        var requiresDeposit = RequiresDeposit(totalAmount);
        var escrow = new EscrowContract
        {
            BuyerId = order.BuyerId,
            SellerId = order.SellerId,
            ListingId = order.ListingId,
            OrderId = order.OrderId,
            PaymentId = paymentId,
            DepositAmount = depositAmount,
            TotalAmount = order.TotalAmount,
            DepositRate = requiresDeposit ? EscrowRules.DepositRate : 0m,
            Status = EscrowStatuses.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _uow.EscrowContracts.AddAsync(escrow, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return escrow;
    }

    public async Task<EscrowContract?> FundForOrderAsync(long orderId, long? paymentId, CancellationToken cancellationToken = default)
    {
        var escrow = await _uow.EscrowContracts.Query()
            .FirstOrDefaultAsync(e => e.OrderId == orderId, cancellationToken);
        if (escrow == null)
        {
            var order = await _uow.Orders.GetByIdAsync(orderId);
            if (order == null) return null;
            escrow = await EnsureForOrderAsync(order, paymentId, cancellationToken);
        }

        if (paymentId.HasValue && escrow.PaymentId != paymentId)
        {
            escrow.PaymentId = paymentId;
        }

        if (string.Equals(escrow.Status, EscrowStatuses.Funded, StringComparison.OrdinalIgnoreCase))
        {
            return escrow;
        }

        escrow.Status = EscrowStatuses.Funded;
        if (!escrow.DepositDeadlineAt.HasValue && (escrow.DepositAmount ?? 0m) > 0m)
        {
            escrow.DepositDeadlineAt = DateTime.UtcNow.AddHours(EscrowRules.DepositHoldHours);
        }
        escrow.UpdatedAt = DateTime.UtcNow;
        _uow.EscrowContracts.Update(escrow);
        await _uow.SaveChangesAsync(cancellationToken);
        return escrow;
    }

    public async Task<EscrowContract?> ReleaseForOrderAsync(long orderId, CancellationToken cancellationToken = default)
    {
        var escrow = await _uow.EscrowContracts.Query()
            .FirstOrDefaultAsync(e => e.OrderId == orderId, cancellationToken);
        if (escrow == null) return null;
        if (string.Equals(escrow.Status, EscrowStatuses.Released, StringComparison.OrdinalIgnoreCase))
        {
            return escrow;
        }
        if (!string.Equals(escrow.Status, EscrowStatuses.Funded, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(escrow.Status, EscrowStatuses.Holding, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        escrow.Status = EscrowStatuses.Released;
        escrow.UpdatedAt = DateTime.UtcNow;
        _uow.EscrowContracts.Update(escrow);
        await _uow.SaveChangesAsync(cancellationToken);
        return escrow;
    }

    public async Task<EscrowContract?> RefundForOrderAsync(long orderId, CancellationToken cancellationToken = default)
    {
        var escrow = await _uow.EscrowContracts.Query()
            .FirstOrDefaultAsync(e => e.OrderId == orderId, cancellationToken);
        if (escrow == null) return null;
        if (string.Equals(escrow.Status, EscrowStatuses.Refunded, StringComparison.OrdinalIgnoreCase))
        {
            return escrow;
        }
        if (string.Equals(escrow.Status, EscrowStatuses.Released, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        escrow.Status = EscrowStatuses.Refunded;
        if (!escrow.DepositRefundedAt.HasValue)
        {
            escrow.DepositRefundedAt = DateTime.UtcNow;
        }
        escrow.UpdatedAt = DateTime.UtcNow;
        _uow.EscrowContracts.Update(escrow);
        await _uow.SaveChangesAsync(cancellationToken);
        return escrow;
    }

    public async Task<EscrowContract?> ForfeitDepositForOrderAsync(long orderId, string? reason = null, CancellationToken cancellationToken = default)
    {
        var escrow = await _uow.EscrowContracts.Query()
            .FirstOrDefaultAsync(e => e.OrderId == orderId, cancellationToken);
        if (escrow == null) return null;
        if (string.Equals(escrow.Status, EscrowStatuses.Released, StringComparison.OrdinalIgnoreCase))
        {
            return escrow;
        }
        if (string.Equals(escrow.Status, EscrowStatuses.Refunded, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        escrow.Status = EscrowStatuses.Released;
        if (!escrow.DepositForfeitedAt.HasValue)
        {
            escrow.DepositForfeitedAt = DateTime.UtcNow;
        }
        escrow.UpdatedAt = DateTime.UtcNow;
        _uow.EscrowContracts.Update(escrow);
        await _uow.SaveChangesAsync(cancellationToken);
        return escrow;
    }
}
