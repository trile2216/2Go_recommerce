using Microsoft.AspNetCore.Mvc;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/ai/listings")]
public class AiListingsController : ControllerBase
{
    private readonly IAiListingService _aiListingService;

    public AiListingsController(IAiListingService aiListingService)
    {
        _aiListingService = aiListingService;
    }

    [HttpPost("analyze")]
    public async Task<IActionResult> Analyze([FromBody] AiListingAnalyzeRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _aiListingService.AnalyzeAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpPost("precheck")]
    public async Task<IActionResult> Precheck([FromBody] AiListingPrecheckRequest request, CancellationToken cancellationToken = default)
    {
        var result = await _aiListingService.PrecheckAsync(request, deepChecks: false, cancellationToken);
        return Ok(result);
    }
}
