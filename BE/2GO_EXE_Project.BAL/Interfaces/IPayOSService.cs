using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Payments;

namespace _2GO_EXE_Project.BAL.Interfaces;

public interface IPayOSService
{
    /// <summary>
    /// Create a PayOS payment link
    /// </summary>
    Task<(string PaymentUrl, string PayOSOrderCode)> CreatePaymentLinkAsync(
        long paymentId,
        string referenceCode,
        long amount,
        string description,
        string? returnUrl = null,
        string? cancelUrl = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Cancel a payment link
    /// </summary>
    Task<BasicResponse> CancelPaymentLinkAsync(long orderCode, string? reason = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get payment link information
    /// </summary>
    Task<object?> GetPaymentLinkInfoAsync(long orderCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verify webhook signature from PayOS
    /// </summary>
    Task<PayOSWebhookData?> VerifyWebhookSignatureAsync(PayOSWebhookRequest webhookRequest, CancellationToken cancellationToken = default);
}
