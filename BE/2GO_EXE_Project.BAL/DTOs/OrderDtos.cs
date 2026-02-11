namespace _2GO_EXE_Project.BAL.DTOs.Orders;

public record CreateOrderRequest(long ListingId, string PaymentMethod, string DeliveryAddress);

public record OrderResponse(
    long OrderId,
    long ListingId,
    long BuyerId,
    long SellerId,
    long? EscrowId,
    long OrderCode,
    string PaymentLinkId,
    decimal? TotalAmount,
    string? PaymentMethod,
    string? Status,
    string? CheckoutUrl,
    string? QrCodeUrl,
    DateTime? PaymentExpiredAt,
    DateTime? CreatedAt,
    string? DeliveryAddress,
    decimal? DepositAmount,
    DateTime? DepositDeadlineAt);

public record OrderListItem(
    long OrderId,
    long ListingId,
    long BuyerId,
    long SellerId,
    long OrderCode,
    string PaymentLinkId,
    decimal? TotalAmount,
    string? PaymentMethod,
    string? Status,
    string? CheckoutUrl,
    string? QrCodeUrl,
    DateTime? PaymentExpiredAt,
    DateTime? CreatedAt,
    string? ListingTitle,
    decimal? ListingPrice,
    string? DeliveryAddress);

public record OrderListResponse(int Total, IReadOnlyList<OrderListItem> Items);

public record OrderDetailResponse(
    long OrderId,
    long ListingId,
    long BuyerId,
    long SellerId,
    long? EscrowId,
    long OrderCode,
    string PaymentLinkId,
    decimal? TotalAmount,
    string? PaymentMethod,
    string? Status,
    string? CheckoutUrl,
    string? QrCodeUrl,
    DateTime? PaymentExpiredAt,
    DateTime? CreatedAt,
    string? ListingTitle,
    decimal? ListingPrice,
    string? BuyerEmail,
    string? BuyerPhone,
    string? SellerEmail,
    string? SellerPhone,
    string? DeliveryAddress,
    decimal? DepositAmount,
    DateTime? DepositDeadlineAt);
