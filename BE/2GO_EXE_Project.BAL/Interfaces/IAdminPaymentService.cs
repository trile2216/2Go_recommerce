using _2GO_EXE_Project.BAL.DTOs.Admin;

namespace _2GO_EXE_Project.BAL.Interfaces;

public interface IAdminPaymentService
{
    Task<AdminPaymentListResponse> GetPaymentsAsync(
        string? paymentType,
        string? status,
        long? userId,
        long? orderId,
        DateTime? from,
        DateTime? to,
        int skip,
        int take,
        CancellationToken cancellationToken = default);
}
