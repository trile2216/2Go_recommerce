namespace _2GO_EXE_Project.BAL.DTOs.Payments;

public record CreatePaymentRequest(long OrderId, string Method);

public record VerifyPaymentRequest(string Status, string? RawResponse, string? Signature);

public record PaymentResponse(
    long PaymentId,
    decimal? Amount,
    string? Method,
    string? Status,
    string? ReferenceCode,
    DateTime? CreatedAt,
    string? PayUrl);

// PayOS Webhook DTOs
public record PayOSWebhookRequest(
    string? Code,
    string? Desc,
    bool Success,
    PayOSWebhookData? Data,
    string? Signature);

public record PayOSWebhookData(
    long OrderCode,
    long Amount,
    string? Description,
    string? AccountNumber,
    string? Reference,
    string? TransactionDateTime,
    string? PaymentLinkId,
    string? Code,
    string? Desc,
    string? CounterAccountBankId,
    string? CounterAccountBankName,
    string? CounterAccountName,
    string? CounterAccountNumber,
    string? VirtualAccountName,
    string? VirtualAccountNumber,
    string? Currency);
