using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/admin/ai/listings")]
[Authorize(Roles = "Admin")]
public class AdminAiListingsController : ControllerBase
{
    private readonly IModerationService _moderationService;

    public AdminAiListingsController(IModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpPost("risk-check")]
    public IActionResult RiskCheck([FromBody] AiRiskCheckRequest request)
    {
        var userInfo = new AiUserRiskInfo(
            request.AccountAgeDays,
            request.RecentListingsCount,
            request.TotalListingsCount,
            request.CompletedSalesCount,
            request.ReportsCount,
            request.DeviceCount,
            request.PhoneVerified,
            request.EmailVerified);
        var risk = _moderationService.AnalyzeRisk(
            request.Title,
            request.Description,
            request.Price,
            request.SuggestedMin,
            request.SuggestedMax,
            userInfo);
        return Ok(risk);
    }
}
