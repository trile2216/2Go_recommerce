using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Payments;
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
    private readonly IMomoPaymentGateway _momoGateway;
    private readonly IPayOSService _payosService;

    public PaymentService(IUnitOfWork uow, IPaymentGateway gateway, IEscrowService escrowService, IMomoPaymentGateway momoGateway, IPayOSService payosService)
    {
        _uow = uow;
        _gateway = gateway;
        _escrowService = escrowService;
        _momoGateway = momoGateway;
        _payosService = payosService;
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
            if (string.Equals(existing.Method, "MOMO", StringComparison.OrdinalIgnoreCase))
            {
                var log = await _uow.PaymentLogs.Query()
                    .Where(l => l.PaymentId == existing.PaymentId && l.RawResponse != null)
                    .OrderByDescending(l => l.LogId)
                    .FirstOrDefaultAsync(cancellationToken);
                existingPayUrl = ExtractPayUrl(log?.RawResponse);
            }
            else if (string.Equals(existing.Method, "PAYOS", StringComparison.OrdinalIgnoreCase))
            {
                var log = await _uow.PaymentLogs.Query()
                    .Where(l => l.PaymentId == existing.PaymentId && l.RawResponse != null)
                    .OrderByDescending(l => l.LogId)
                    .FirstOrDefaultAsync(cancellationToken);
                existingPayUrl = ExtractCheckoutUrl(log?.RawResponse);
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
            ReferenceCode = Guid.NewGuid().ToString("N"),
            CreatedAt = DateTime.UtcNow
        };

        await _uow.Payments.AddAsync(payment, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        string? payUrl = null;
        if (string.Equals(payment.Method, "MOMO", StringComparison.OrdinalIgnoreCase))
        {
            var momoAmount = Convert.ToInt64(decimal.Round(payment.Amount ?? 0, 0));
            var momoResponse = await _momoGateway.CreatePaymentAsync(
                new MomoCreatePaymentRequest(payment.ReferenceCode!, momoAmount, $"Payment for order {payment.OrderId}"),
                cancellationToken);

            if (momoResponse.ResultCode != 0 || string.IsNullOrWhiteSpace(momoResponse.PayUrl))
            {
                throw new InvalidOperationException($"MoMo payment creation failed: {momoResponse.Message ?? "Unknown error"}");
            }

            payUrl = momoResponse.PayUrl;
            await _uow.PaymentLogs.AddAsync(new PaymentLog
            {
                PaymentId = payment.PaymentId,
                RawResponse = momoResponse.RawResponse,
                CreatedAt = DateTime.UtcNow
            }, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);
        }
        else if (string.Equals(payment.Method, "PAYOS", StringComparison.OrdinalIgnoreCase))
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
                }
                order.CheckoutUrl = checkoutUrl;
                
                _uow.Orders.Update(order);
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
            RawResponse = request.RawResponse,
            CreatedAt = DateTime.UtcNow
        };
        await _uow.PaymentLogs.AddAsync(log, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        await LogPaymentActionAsync(userId, "PaymentVerified", new { payment.PaymentId, payment.Status }, cancellationToken);
        await UpdateOrderByPaymentAsync(payment, cancellationToken);

        return new BasicResponse(true, "Payment updated.");
    }

    public async Task<BasicResponse> HandleMomoIpnAsync(MomoIpnRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.OrderId))
        {
            return new BasicResponse(false, "OrderId is required.");
        }
        if (!_momoGateway.VerifyIpnSignature(request, out var verifyMessage))
        {
            return new BasicResponse(false, verifyMessage);
        }

        var payment = await _uow.Payments.Query()
            .FirstOrDefaultAsync(p => p.ReferenceCode == request.OrderId, cancellationToken);
        if (payment == null) return new BasicResponse(false, "Payment not found.");

        if (payment.Amount.HasValue && payment.Amount.Value != request.Amount)
        {
            return new BasicResponse(false, "Amount mismatch.");
        }

        var nextStatus = request.ResultCode == 0
            ? PaymentStatuses.Paid
            : request.ResultCode == 1006
                ? PaymentStatuses.Cancelled
                : PaymentStatuses.Failed;

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

        await _uow.PaymentLogs.AddAsync(new PaymentLog
        {
            PaymentId = payment.PaymentId,
            RawResponse = JsonSerializer.Serialize(request),
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        await UpdateOrderByPaymentAsync(payment, cancellationToken);

        return new BasicResponse(true, "Payment updated.");
    }

    public async Task<WebhookData> VerifyWebhookSignatureAsync(Webhook webhook, CancellationToken cancellationToken = default)
    {
        return await _payosService.VerifyWebhookSignatureAsync(webhook, cancellationToken);
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
        }
        else if (string.Equals(payment.Status, PaymentStatuses.Failed, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(payment.Status, PaymentStatuses.Cancelled, StringComparison.OrdinalIgnoreCase))
        {
            order.Status = OrderStatuses.Cancelled;
            _uow.Orders.Update(order);
            await _uow.SaveChangesAsync(cancellationToken);
            await _escrowService.RefundForOrderAsync(order.OrderId, cancellationToken);

            if (order.ListingId.HasValue)
            {
                var listing = await _uow.Listings.GetByIdAsync(order.ListingId.Value);
                if (listing != null && string.Equals(listing.Status, ListingStatuses.Reserved, StringComparison.OrdinalIgnoreCase))
                {
                    listing.Status = ListingStatuses.Active;
                    listing.UpdatedAt = DateTime.UtcNow;
                    _uow.Listings.Update(listing);
                    await _uow.SaveChangesAsync(cancellationToken);
                }
            }
        }
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

    private static string? ExtractPayUrl(string? rawResponse)
    {
        if (string.IsNullOrWhiteSpace(rawResponse)) return null;
        try
        {
            using var doc = JsonDocument.Parse(rawResponse);
            return doc.RootElement.TryGetProperty("payUrl", out var payUrlProp) ? payUrlProp.GetString() : null;
        }
        catch (JsonException)
        {
            return null;
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
}
