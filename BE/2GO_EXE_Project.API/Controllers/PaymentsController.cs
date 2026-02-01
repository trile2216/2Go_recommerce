using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayOS.Models.Webhooks;
using _2GO_EXE_Project.BAL.DTOs.Payments;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePaymentRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _paymentService.CreateAsync(User, request, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{paymentId:long}/verify")]
    public async Task<IActionResult> Verify(long paymentId, [FromBody] VerifyPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _paymentService.VerifyAsync(User, paymentId, request, cancellationToken);
        if (!result.Success) return BadRequest(result.Message);
        return Ok(result);
    }

    [HttpPost("momo/ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> MomoIpn([FromBody] MomoIpnRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _paymentService.HandleMomoIpnAsync(request, cancellationToken);
        if (!result.Success) return BadRequest(result.Message);
        return Ok(result);
    }

    [HttpPost("payos/webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> PayOSWebhook([FromBody] Webhook webhook, CancellationToken cancellationToken = default)
    {
        if (webhook == null)
        {
            return Ok(new { error = "Webhook data is required", message = "Invalid request" });
        }

        try
        {
            var result = await _paymentService.HandlePayOSWebhookAsync(webhook, cancellationToken);
            
            if (!result.Success)
            {
                return Ok(new { error = result.Message, message = "Webhook received but processing failed" });
            }

            return Ok(new { message = "Webhook processed successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PayOS Webhook Error] {ex.Message}");
            return Ok(new { error = ex.Message, message = "Webhook received but error occurred" });
        }
    }
}
