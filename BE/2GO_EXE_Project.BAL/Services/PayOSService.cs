using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Payments;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.BAL.Settings;
using Microsoft.Extensions.Configuration;

namespace _2GO_EXE_Project.BAL.Services;

public class PayOSService : IPayOSService
{
    private readonly PayOSClient _client;
    private readonly PayOSSettings _settings;

    private readonly IConfiguration configuration;

    public PayOSService([FromKeyedServices("OrderClient")] PayOSClient client, IOptions<PayOSSettings> options, IConfiguration configuration)
    {
        _client = client;
        _settings = options.Value ?? new PayOSSettings();
        this.configuration = configuration;
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
        var frontendBaseUrl = configuration.GetValue<string>("FrontendBaseUrl") ?? Environment.GetEnvironmentVariable("FRONTEND_BASE_URL") ?? "http://localhost:5173";
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
            ReturnUrl = returnUrl ?? _settings.ReturnUrl ?? $"{frontendBaseUrl}/payment/success", 
            CancelUrl = cancelUrl ?? _settings.CancelUrl ?? $"{frontendBaseUrl}/payment/cancel",
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

    public async Task<WebhookData?> VerifyWebhookSignatureAsync(Webhook webhook, CancellationToken cancellationToken = default)
    {
        if (webhook == null || webhook.Data == null)
        {
            throw new ArgumentException("Webhook or webhook data is null.");
        }

        try
        {
            // Verify signature using PayOS SDK and return verified data directly
            var verifiedData = await _client.Webhooks.VerifyAsync(webhook);
            return verifiedData;
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Webhook signature verification failed: {ex.Message}", ex);
        }
    }
}
