using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Payments;
using _2GO_EXE_Project.BAL.DTOs.Notifications;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;
using PayOS.Models.Webhooks;

namespace _2GO_EXE_Project.BAL.Services;

public class PaymentService : IPaymentService
{
    private readonly IUnitOfWork _uow;
    private readonly IPaymentGateway _gateway;
    private readonly IEscrowService _escrowService;
    private readonly IPayosPaymentGateway _payosGateway;
    private readonly IPayOSService _payosService;
    private readonly INotificationService _notificationService;
    private const decimal CommissionRateValue = 0.07m;
    private const int SubscriptionDaysDefault = 30;
    private const decimal SubscriptionAmountDefault = 33000m;

    public PaymentService(IUnitOfWork uow, IPaymentGateway gateway, IEscrowService escrowService, IPayosPaymentGateway payosGateway, IPayOSService payosService, INotificationService notificationService)
    {
        _uow = uow;
        _gateway = gateway;
        _escrowService = escrowService;
        _payosGateway = payosGateway;
        _payosService = payosService;
        _notificationService = notificationService;
    }

    private static long GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirst("sub")?.Value
                  ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? principal.FindFirst(ClaimTypes.Name)?.Value;
        if (!long.TryParse(sub, out var id))
        {
            throw new UnauthorizedAccessException("Invalid user id in token.");
        }
        return id;
    }

    public async Task<PaymentResponse> CreateAsync(ClaimsPrincipal userPrincipal, CreatePaymentRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var order = await _uow.Orders.GetByIdAsync(request.OrderId);
        if (order == null)
        {
            throw new InvalidOperationException("Order not found.");
        }
        if (order.BuyerId != userId)
        {
            throw new InvalidOperationException("Not allowed.");
        }
        if (!string.Equals(order.PaymentMethod, request.Method, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Payment method does not match the order.");
        }

        var existing = await _uow.Payments.Query()
            .FirstOrDefaultAsync(p => p.OrderId == order.OrderId, cancellationToken);
        if (existing != null)
        {
            string? existingPayUrl = null;
            if (string.Equals(existing.Method, "PAYOS", StringComparison.OrdinalIgnoreCase))
            {
                // Try to get from PaymentLog first
                var log = await _uow.PaymentLogs.Query()
                    .Where(l => l.PaymentId == existing.PaymentId && l.RawResponse != null)
                    .OrderByDescending(l => l.LogId)
                    .FirstOrDefaultAsync(cancellationToken);
                existingPayUrl = ExtractCheckoutUrl(log?.RawResponse);
                
                // Fallback to Payment.PayosCheckoutUrl if not found in log
                if (string.IsNullOrWhiteSpace(existingPayUrl))
                {
                    existingPayUrl = existing.PayosCheckoutUrl;
                }

                // If still no checkout URL and payment is still Pending, re-create PayOS link
                if (string.IsNullOrWhiteSpace(existingPayUrl) && 
                    string.Equals(existing.Status, PaymentStatuses.Pending, StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        var payosAmount = Convert.ToInt64(decimal.Round(existing.Amount ?? 0, 0));
                        var (checkoutUrl, orderCodeStr) = await _payosService.CreatePaymentLinkAsync(
                            existing.PaymentId,
                            existing.ReferenceCode!,
                            payosAmount,
                            $"Payment for order {existing.OrderId}",
                            null,
                            null,
                            cancellationToken);

                        if (long.TryParse(orderCodeStr, out var orderCode))
                        {
                            order.OrderCode = orderCode;
                            existing.PayosOrderCode = orderCode;
                        }
                        order.CheckoutUrl = checkoutUrl;
                        existing.PayosCheckoutUrl = checkoutUrl;

                        _uow.Orders.Update(order);
                        _uow.Payments.Update(existing);
                        await _uow.SaveChangesAsync(cancellationToken);

                        existingPayUrl = checkoutUrl;

                        await _uow.PaymentLogs.AddAsync(new PaymentLog
                        {
                            PaymentId = existing.PaymentId,
                            RawResponse = System.Text.Json.JsonSerializer.Serialize(new { checkoutUrl, orderCode = orderCodeStr }),
                            CreatedAt = DateTime.UtcNow
                        }, cancellationToken);
                        await _uow.SaveChangesAsync(cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        throw new InvalidOperationException($"PayOS payment link re-creation failed: {ex.Message}");
                    }
                }
            }
            return new PaymentResponse(existing.PaymentId, existing.Amount, existing.Method, existing.Status, existing.ReferenceCode, existing.CreatedAt, existingPayUrl);
        }

        if (!string.Equals(order.Status, OrderStatuses.Pending, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Payments can only be created when order status is Pending.");
        }

        var payment = new Payment
        {
            UserId = userId,
            OrderId = order.OrderId,
            Amount = order.TotalAmount,
            Method = order.PaymentMethod,
            Status = PaymentStatuses.Pending,
            PaymentType = PaymentTypes.Commission,
            CommissionRate = CommissionRateValue,
            CommissionBaseAmount = order.TotalAmount,
            ReferenceCode = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Payments.AddAsync(payment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        string? payUrl = null;
        if (string.Equals(payment.Method, "PAYOS", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var payosAmount = Convert.ToInt64(decimal.Round(payment.Amount ?? 0, 0));
                var (checkoutUrl, orderCodeStr) = await _payosService.CreatePaymentLinkAsync(
                    payment.PaymentId,
                    payment.ReferenceCode!,
                    payosAmount,
                    $"Payment for order {payment.OrderId}",
                    null,
                    null,
                    cancellationToken);

                // Parse orderCode back to long
                if (long.TryParse(orderCodeStr, out var orderCode))
                {
                    order.OrderCode = orderCode;
                    payment.PayosOrderCode = orderCode;
                }
                order.CheckoutUrl = checkoutUrl;
                payment.PayosCheckoutUrl = checkoutUrl;
                
                _uow.Orders.Update(order);
                _uow.Payments.Update(payment);
                await _uow.SaveChangesAsync(cancellationToken);

                payUrl = checkoutUrl;

                await _uow.PaymentLogs.AddAsync(new PaymentLog
                {
                    PaymentId = payment.PaymentId,
                    RawResponse = System.Text.Json.JsonSerializer.Serialize(new { checkoutUrl, orderCode = orderCodeStr }),
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);
                await _uow.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"PayOS payment creation failed: {ex.Message}");
            }
        }

        await LogPaymentActionAsync(userId, "PaymentCreated", new { payment.PaymentId, payment.Amount, payment.Status }, cancellationToken);

        return new PaymentResponse(payment.PaymentId, payment.Amount, payment.Method, payment.Status, payment.ReferenceCode, payment.CreatedAt, payUrl);
    }

    public async Task<PaymentResponse> CreateSubscriptionAsync(ClaimsPrincipal userPrincipal, CreateSubscriptionPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        if (string.IsNullOrWhiteSpace(request.Method))
        {
            throw new InvalidOperationException("Payment method is required.");
        }
        if (!PaymentMethods.All.Contains(request.Method, StringComparer.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid payment method.");
        }
        if (string.Equals(request.Method, PaymentMethods.COD, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("COD is not supported for subscription.");
        }

        var days = request.Days ?? SubscriptionDaysDefault;
        if (days != SubscriptionDaysDefault)
        {
            throw new InvalidOperationException("Only 30-day subscriptions are supported.");
        }

        var payment = new Payment
        {
            UserId = userId,
            Amount = SubscriptionAmountDefault,
            Method = request.Method,
            Status = PaymentStatuses.Pending,
            PaymentType = PaymentTypes.Subscription,
            SubscriptionDays = days,
            ReferenceCode = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Payments.AddAsync(payment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        string? payUrl = null;
        if (string.Equals(payment.Method, PaymentMethods.PAYOS, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var payosAmount = Convert.ToInt64(decimal.Round(payment.Amount ?? 0, 0));
                var (checkoutUrl, orderCodeStr) = await _payosService.CreatePaymentLinkAsync(
                    payment.PaymentId,
                    payment.ReferenceCode!,
                    payosAmount,
                    "Subscription package (30 days)",
                    null,
                    null,
                    cancellationToken);

                if (long.TryParse(orderCodeStr, out var orderCode))
                {
                    payment.PayosOrderCode = orderCode;
                }
                payment.PayosCheckoutUrl = checkoutUrl;
                _uow.Payments.Update(payment);
                await _uow.SaveChangesAsync(cancellationToken);

                payUrl = checkoutUrl;

                await _uow.PaymentLogs.AddAsync(new PaymentLog
                {
                    PaymentId = payment.PaymentId,
                    RawResponse = System.Text.Json.JsonSerializer.Serialize(new { checkoutUrl, orderCode = orderCodeStr }),
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);
                await _uow.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"PayOS payment creation failed: {ex.Message}");
            }
        }

        await LogPaymentActionAsync(userId, "SubscriptionPaymentCreated", new { payment.PaymentId, payment.Amount, payment.Status }, cancellationToken);
        return new PaymentResponse(payment.PaymentId, payment.Amount, payment.Method, payment.Status, payment.ReferenceCode, payment.CreatedAt, payUrl);
    }

    public async Task<BasicResponse> VerifyAsync(ClaimsPrincipal userPrincipal, long paymentId, VerifyPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var payment = await _uow.Payments.Query()
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId && p.UserId == userId, cancellationToken);
        if (payment == null) return new BasicResponse(false, "Payment not found.");

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return new BasicResponse(false, "Status is required.");
        }

        if (!PaymentStatuses.All.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            return new BasicResponse(false, "Invalid payment status.");
        }

        if (string.Equals(payment.Status, request.Status, StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(true, "Payment already in requested status.");
        }

        if (!IsPaymentTransitionAllowed(payment.Status, request.Status))
        {
            return new BasicResponse(false, $"Invalid payment status transition: {payment.Status} -> {request.Status}.");
        }

        if (string.Equals(payment.Method, "COD", StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(false, "COD payments are verified when order is completed.");
        }

        if (!_gateway.VerifySignature(request, out var verifyMessage))
        {
            return new BasicResponse(false, verifyMessage);
        }

        payment.Status = request.Status;
        _uow.Payments.Update(payment);
        await _uow.SaveChangesAsync(cancellationToken);

        var log = new PaymentLog
        {
            PaymentId = payment.PaymentId,
            Provider = payment.Method,
            Event = "Verify",
            RawResponse = request.RawResponse,
            CreatedAt = DateTime.UtcNow
        };
        await _uow.PaymentLogs.AddAsync(log, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        await LogPaymentActionAsync(userId, "PaymentVerified", new { payment.PaymentId, payment.Status }, cancellationToken);
        await UpdateOrderByPaymentAsync(payment, cancellationToken);
        await ApplySubscriptionIfPaidAsync(payment, cancellationToken);

        return new BasicResponse(true, "Payment updated.");
    }


    public async Task<BasicResponse> HandlePayosWebhookAsync(PayosWebhookRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || request.Data == null)
        {
            return new BasicResponse(false, "PayOS webhook data is required.");
        }
        if (!_payosGateway.VerifyWebhookSignature(request, out var verifyMessage))
        {
            return new BasicResponse(false, verifyMessage);
        }

        var orderCode = request.Data.OrderCode;
        var payment = await _uow.Payments.Query()
            .FirstOrDefaultAsync(p =>
                (p.PayosOrderCode.HasValue && p.PayosOrderCode.Value == orderCode) ||
                p.PaymentId == orderCode ||
                (p.ReferenceCode != null && p.ReferenceCode == orderCode.ToString()), cancellationToken);

        if (payment == null) return new BasicResponse(false, "Payment not found.");

        if (!string.Equals(payment.Method, "PAYOS", StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(false, "Payment method is not PayOS.");
        }

        if (payment.Amount.HasValue && payment.Amount.Value != request.Data.Amount)
        {
            return new BasicResponse(false, "Amount mismatch.");
        }

        var nextStatus = MapPayosStatus(request.Data.Status);
        if (string.IsNullOrWhiteSpace(nextStatus))
        {
            return new BasicResponse(false, "Unknown PayOS status.");
        }

        if (string.Equals(payment.Status, nextStatus, StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(true, "Payment already in requested status.");
        }
        if (!IsPaymentTransitionAllowed(payment.Status, nextStatus))
        {
            return new BasicResponse(false, $"Invalid payment status transition: {payment.Status} -> {nextStatus}.");
        }

        payment.Status = nextStatus;
        if (!payment.PayosOrderCode.HasValue) payment.PayosOrderCode = orderCode;
        if (string.IsNullOrWhiteSpace(payment.PayosPaymentLinkId) && !string.IsNullOrWhiteSpace(request.Data.PaymentLinkId))
        {
            payment.PayosPaymentLinkId = request.Data.PaymentLinkId;
        }
        _uow.Payments.Update(payment);
        await _uow.SaveChangesAsync(cancellationToken);

        await _uow.PaymentLogs.AddAsync(new PaymentLog
        {
            PaymentId = payment.PaymentId,
            Provider = "PAYOS",
            Event = "Webhook",
            RawResponse = JsonSerializer.Serialize(request),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        await UpdateOrderByPaymentAsync(payment, cancellationToken);
        await ApplySubscriptionIfPaidAsync(payment, cancellationToken);

        return new BasicResponse(true, "Payment updated.");
    }

    public async Task<WebhookData> VerifyWebhookSignatureAsync(Webhook webhook, CancellationToken cancellationToken = default)
    {
        var data = await _payosService.VerifyWebhookSignatureAsync(webhook, cancellationToken);
        return data ?? throw new InvalidOperationException("Webhook signature verification failed.");
    }

    public async Task<BasicResponse> HandlePayOSWebhookAsync(Webhook webhook, CancellationToken cancellationToken = default)
    {
        if (webhook == null || webhook.Data == null)
        {
            return new BasicResponse(false, "Webhook data is required.");
        }

        try
        {
            // Verify webhook signature using PayOS service
            var webhookData = await _payosService.VerifyWebhookSignatureAsync(webhook, cancellationToken);
            
            if (webhookData == null)
            {
                return new BasicResponse(false, "Webhook signature verification failed.");
            }

            // Find payment by OrderCode (stored in PaymentLog or Order)
            // First, try to find by checking PaymentLog for PayOS orderCode
            var payments = await _uow.Payments.Query()
                .Where(p => p.Method == "PAYOS" && p.Status == PaymentStatuses.Pending)
                .ToListAsync(cancellationToken);

            Payment? payment = null;
            foreach (var p in payments)
            {
                var logs = await _uow.PaymentLogs.Query()
                    .Where(l => l.PaymentId == p.PaymentId)
                    .ToListAsync(cancellationToken);
                
                foreach (var log in logs)
                {
                    if (!string.IsNullOrWhiteSpace(log.RawResponse) && log.RawResponse.Contains(webhookData.OrderCode.ToString()))
                    {
                        payment = p;
                        break;
                    }
                }
                if (payment != null) break;
            }

            if (payment == null)
            {
                return new BasicResponse(false, $"Payment not found for PayOS OrderCode: {webhookData.OrderCode}");
            }

            // Verify amount
            var expectedAmount = Convert.ToInt64(decimal.Round(payment.Amount ?? 0, 0));
            if (webhookData.Amount != expectedAmount)
            {
                return new BasicResponse(false, "Amount mismatch.");
            }

            // Determine payment status based on webhook code
            string nextStatus;
            if (string.Equals(webhookData.Code, "00", StringComparison.OrdinalIgnoreCase))
            {
                nextStatus = PaymentStatuses.Paid;
            }
            else if (string.Equals(webhookData.Code, "CANCELLED", StringComparison.OrdinalIgnoreCase))
            {
                nextStatus = PaymentStatuses.Cancelled;
            }
            else
            {
                nextStatus = PaymentStatuses.Failed;
            }

            if (string.Equals(payment.Status, nextStatus, StringComparison.OrdinalIgnoreCase))
            {
                return new BasicResponse(true, "Payment already in requested status.");
            }

            if (!IsPaymentTransitionAllowed(payment.Status, nextStatus))
            {
                return new BasicResponse(false, $"Invalid payment status transition: {payment.Status} -> {nextStatus}.");
            }

            payment.Status = nextStatus;
            _uow.Payments.Update(payment);
            await _uow.SaveChangesAsync(cancellationToken);

            // Log webhook data
            await _uow.PaymentLogs.AddAsync(new PaymentLog
            {
                PaymentId = payment.PaymentId,
                RawResponse = JsonSerializer.Serialize(webhookData),
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);

            // Update order status
            await UpdateOrderByPaymentAsync(payment, cancellationToken);
            await ApplySubscriptionIfPaidAsync(payment, cancellationToken);

            // Log activity
            await LogPaymentActionAsync(payment.UserId ?? 0, "PayOSWebhookReceived", new { payment.PaymentId, webhookData.OrderCode, Status = nextStatus }, cancellationToken);

            return new BasicResponse(true, "Payment updated successfully.");
        }
        catch (Exception ex)
        {
            return new BasicResponse(false, $"Webhook processing failed: {ex.Message}");
        }
    }

    private static bool IsPaymentTransitionAllowed(string? current, string next)
    {
        if (string.IsNullOrWhiteSpace(current))
        {
            return true;
        }
        if (string.Equals(current, PaymentStatuses.Pending, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, PaymentStatuses.Failed, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, PaymentStatuses.Cancelled, StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    private async Task UpdateOrderByPaymentAsync(Payment payment, CancellationToken cancellationToken)
    {
        if (!payment.OrderId.HasValue) return;
        var order = await _uow.Orders.GetByIdAsync(payment.OrderId.Value);
        if (order == null) return;
        if (!string.Equals(order.Status, OrderStatuses.Pending, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.Equals(payment.Status, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase))
        {
            order.Status = OrderStatuses.Confirmed;
            _uow.Orders.Update(order);
            await _uow.SaveChangesAsync(cancellationToken);
            await _escrowService.FundForOrderAsync(order.OrderId, payment.PaymentId, cancellationToken);
            if (order.BuyerId.HasValue)
            {
                await NotifyAsync(order.BuyerId.Value, "PAYMENT", "Thanh toán thành công", $"Đơn hàng #{order.OrderId} đã được thanh toán.", $"/orders/{order.OrderId}", cancellationToken);
            }
        }
        else if (string.Equals(payment.Status, PaymentStatuses.Failed, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(payment.Status, PaymentStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
        {
            order.Status = OrderStatuses.Cancelled;
            _uow.Orders.Update(order);
            await _uow.SaveChangesAsync(cancellationToken);
            await _escrowService.RefundForOrderAsync(order.OrderId, cancellationToken);

            await RestoreListingsForOrderAsync(order, cancellationToken);
            if (order.BuyerId.HasValue)
            {
                await NotifyAsync(order.BuyerId.Value, "PAYMENT", "Thanh toán thất bại", $"Thanh toán cho đơn hàng #{order.OrderId} không thành công.", $"/orders/{order.OrderId}", cancellationToken);
            }
        }
    }

    private async Task ApplySubscriptionIfPaidAsync(Payment payment, CancellationToken cancellationToken)
    {
        if (!string.Equals(payment.PaymentType, PaymentTypes.Subscription, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }
        if (!string.Equals(payment.Status, PaymentStatuses.Paid, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }
        if (!payment.SubscriptionDays.HasValue || payment.SubscriptionDays.Value <= 0)
        {
            return;
        }
        if (payment.SubscriptionValidUntil.HasValue)
        {
            return;
        }

        var userId = payment.UserId ?? 0;
        var user = await _uow.Users.GetByIdAsync(userId);
        if (user == null) return;

        var now = DateTime.UtcNow;
        var start = user.SubscriptionUntil.HasValue && user.SubscriptionUntil.Value > now
            ? user.SubscriptionUntil.Value
            : now;
        var until = start.AddDays(payment.SubscriptionDays.Value);

        payment.SubscriptionValidFrom = start;
        payment.SubscriptionValidUntil = until;
        user.SubscriptionUntil = until;

        _uow.Payments.Update(payment);
        _uow.Users.Update(user);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    private async Task RestoreListingsForOrderAsync(Order order, CancellationToken cancellationToken)
    {
        var listingIds = new List<long>();
        if (order.ListingId.HasValue) listingIds.Add(order.ListingId.Value);

        if (listingIds.Count == 0)
        {
            var items = await _uow.OrderItems.Query()
                .Where(oi => oi.OrderId == order.OrderId && oi.ListingId.HasValue)
                .ToListAsync(cancellationToken);
            listingIds.AddRange(items.Select(oi => oi.ListingId!.Value));
        }

        if (listingIds.Count == 0) return;

        var listings = await _uow.Listings.Query()
            .Where(l => listingIds.Contains(l.ListingId))
            .ToListAsync(cancellationToken);

        foreach (var listing in listings)
        {
            if (string.Equals(listing.Status, ListingStatuses.Reserved, StringComparison.OrdinalIgnoreCase))
            {
                listing.Status = ListingStatuses.Active;
                listing.AvailableQuantity = 1;
                listing.UpdatedAt = DateTime.UtcNow;
                _uow.Listings.Update(listing);
            }
        }
        await _uow.SaveChangesAsync(cancellationToken);
    }

    private async Task LogPaymentActionAsync(long userId, string action, object details, CancellationToken cancellationToken)
    {
        try
        {
            await _uow.ActivityLogs.AddAsync(new _2GO_EXE_Project.DAL.Entities.ActivityLog
            {
                UserId = userId,
                Action = action,
                Details = JsonSerializer.Serialize(details),
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // ignore logging failures
        }
    }

    private static string? ExtractCheckoutUrl(string? rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse)) return null;
        try
        {
            using var doc = JsonDocument.Parse(rawResponse);
            return doc.RootElement.TryGetProperty("checkoutUrl", out var checkoutUrlProp) ? checkoutUrlProp.GetString() : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string? MapPayosStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return null;
        if (string.Equals(status, "PAID", StringComparison.OrdinalIgnoreCase)) return PaymentStatuses.Paid;
        if (string.Equals(status, "PENDING", StringComparison.OrdinalIgnoreCase)) return PaymentStatuses.Pending;
        if (string.Equals(status, "CANCELLED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(status, "CANCELED", StringComparison.OrdinalIgnoreCase)) return PaymentStatuses.Cancelled;
        if (string.Equals(status, "FAILED", StringComparison.OrdinalIgnoreCase)) return PaymentStatuses.Failed;
        return null;
    }

    private async Task NotifyAsync(long userId, string type, string title, string message, string? link, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest(
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
