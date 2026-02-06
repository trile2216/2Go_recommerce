using Microsoft.AspNetCore.Authorization;
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
    [AllowAnonymous]
    public async Task<IActionResult> Analyze([FromBody] AiListingAnalyzeRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Title is required.");
        }
        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest("Description is required.");
        }
        if (request.CategoryId <= 0)
        {
            return BadRequest("CategoryId must be a positive integer.");
        }
        if (request.MediaUrls == null || request.MediaUrls.Count == 0)
        {
            return BadRequest("MediaUrls must contain at least 1 item.");
        }
        if (string.IsNullOrWhiteSpace(request.UserId))
        {
            return BadRequest("UserId is required.");
        }
        if (request.ListingId <= 0)
        {
            return BadRequest("ListingId must be a positive integer.");
        }

        var result = await _aiListingService.AnalyzeAsync(request, cancellationToken);
        return Ok(result);
    }
}
