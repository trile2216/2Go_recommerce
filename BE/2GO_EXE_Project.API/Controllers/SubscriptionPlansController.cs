using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Subscriptions;
using _2GO_EXE_Project.DAL.Context;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/subscription-plans")]
public class SubscriptionPlansController : ControllerBase
{
    private readonly AppDbContext _db;

    public SubscriptionPlansController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetActive(CancellationToken cancellationToken = default)
    {
        var items = await _db.SubscriptionPlans
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Price)
            .Select(x => new SubscriptionPlanItem(
                x.PlanId,
                x.Code,
                x.Name,
                x.Description,
                x.Price,
                x.DurationDays,
                x.MonthlyListingLimit,
                x.IsActive,
                x.SortOrder,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new SubscriptionPlanListResponse(items.Count, items));
    }
}
