using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Payments;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.BAL.Settings;

namespace _2GO_EXE_Project.BAL.Services;

public class PayOSService : IPayOSService
{
    private readonly PayOSClient _client;
    private readonly PayOSSettings _settings;

    public PayOSService([FromKeyedServices("OrderClient")] PayOSClient client, IOptions<PayOSSettings> options)
    {
        _client = client;
        _settings = options.Value ?? new PayOSSettings();
    }

    public async Task<(string PaymentUrl, string PayOSOrderCode)> CreatePaymentLinkAsync(
        long paymentId,
        string referenceCode,
        long amount,
        string description,
        string? returnUrl = null,
        string? cancelUrl = null,
        CancellationToken cancellationToken = default)
    {
        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than 0.", nameof(amount));
        }

        if (string.IsNullOrWhiteSpace(referenceCode))
        {
            throw new ArgumentException("Reference code is required.", nameof(referenceCode));
        }

        // Generate unique order code from timestamp
        var orderCode = DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        var paymentRequest = new CreatePaymentLinkRequest
        {
            OrderCode = orderCode,
            Amount = amount,
            Description = description ?? $"Payment {referenceCode}",
            ReturnUrl = returnUrl ?? _settings.ReturnUrl ?? "http://localhost:5173/payment/success",
            CancelUrl = cancelUrl ?? _settings.CancelUrl ?? "http://localhost:5173/payment/cancel",
            Items = new List<PaymentLinkItem>
            {
                new PaymentLinkItem
                {
                    Name = description ?? "Payment",
                    Quantity = 1,
                    Price = amount
                }
            }
        };

        try
        {
            var response = await _client.PaymentRequests.CreateAsync(paymentRequest);

            return (response.CheckoutUrl ?? string.Empty, orderCode.ToString());
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to create PayOS payment link: {ex.Message}", ex);
        }
    }

    public async Task<BasicResponse> CancelPaymentLinkAsync(long orderCode, string? reason = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var paymentLinkInfo = await _client.PaymentRequests.GetAsync(orderCode.ToString());

            if (paymentLinkInfo == null)
            {
                return new BasicResponse(false, "Payment link not found.");
            }

            // Only cancel if payment is still pending
            if (paymentLinkInfo.Status != PayOS.Models.V2.PaymentRequests.PaymentLinkStatus.Pending)
            {
                return new BasicResponse(false, $"Cannot cancel payment with status: {paymentLinkInfo.Status}");
            }

            await _client.PaymentRequests.CancelAsync(orderCode.ToString(), reason);

            return new BasicResponse(true, "Payment link cancelled successfully.");
        }
        catch (Exception ex)
        {
            return new BasicResponse(false, $"Failed to cancel payment link: {ex.Message}");
        }
    }

    public async Task<object?> GetPaymentLinkInfoAsync(long orderCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var paymentLinkInfo = await _client.PaymentRequests.GetAsync(orderCode.ToString());
            return paymentLinkInfo;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Failed to get payment link info: {ex.Message}", ex);
        }
    }

    public async Task<PayOSWebhookData?> VerifyWebhookSignatureAsync(PayOSWebhookRequest webhookRequest, CancellationToken cancellationToken = default)
    {
        if (webhookRequest == null || webhookRequest.Data == null)
        {
            throw new ArgumentException("Webhook request or data is null.");
        }

        try
        {
            // Convert our DTO to PayOS SDK webhook model
            var webhook = new Webhook
            {
                Success = webhookRequest.Success,
                Data = new WebhookData
                {
                    OrderCode = webhookRequest.Data.OrderCode,
                    Amount = webhookRequest.Data.Amount,
                    Description = webhookRequest.Data.Description,
                    AccountNumber = webhookRequest.Data.AccountNumber,
                    Reference = webhookRequest.Data.Reference,
                    TransactionDateTime = webhookRequest.Data.TransactionDateTime,
                    PaymentLinkId = webhookRequest.Data.PaymentLinkId,
                    CounterAccountBankId = webhookRequest.Data.CounterAccountBankId,
                    CounterAccountBankName = webhookRequest.Data.CounterAccountBankName,
                    CounterAccountName = webhookRequest.Data.CounterAccountName,
                    CounterAccountNumber = webhookRequest.Data.CounterAccountNumber,
                    VirtualAccountName = webhookRequest.Data.VirtualAccountName,
                    VirtualAccountNumber = webhookRequest.Data.VirtualAccountNumber,
                    Currency = webhookRequest.Data.Currency
                },
                Signature = webhookRequest.Signature
            };

            // Verify signature using PayOS SDK
            var verifiedData = await _client.Webhooks.VerifyAsync(webhook);

            // Convert back to our DTO
            return new PayOSWebhookData(
                verifiedData.OrderCode,
                verifiedData.Amount,
                verifiedData.Description,
                verifiedData.AccountNumber,
                verifiedData.Reference,
                verifiedData.TransactionDateTime,
                verifiedData.PaymentLinkId,
                verifiedData.Code,
                null, // Desc is not available in WebhookData
                verifiedData.CounterAccountBankId,
                verifiedData.CounterAccountBankName,
                verifiedData.CounterAccountName,
                verifiedData.CounterAccountNumber,
                verifiedData.VirtualAccountName,
                verifiedData.VirtualAccountNumber,
                verifiedData.Currency);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Webhook signature verification failed: {ex.Message}", ex);
        }
    }
}
