namespace _2GO_EXE_Project.BAL.DTOs.Admin;

public record AdminPaymentListItem(
    long PaymentId,
    string? PaymentType,
    string? Status,
    string? Method,
    string? PaymentStage,
    decimal? Amount,
    decimal? CommissionRate,
    decimal? CommissionBaseAmount,
    decimal CommissionAmount,
    string? SubscriptionPlanCode,
    int? SubscriptionDays,
    DateTime? SubscriptionValidFrom,
    DateTime? SubscriptionValidUntil,
    DateTime? CreatedAt,
    long? UserId,
    string? UserEmail,
    long? OrderId,
    long? OrderCode,
    string? OrderStatus,
    decimal? OrderTotalAmount,
    string? ListingTitle);

public record AdminPaymentListResponse(int Total, IReadOnlyList<AdminPaymentListItem> Items);
