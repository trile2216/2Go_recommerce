using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Subscriptions;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/admin/subscription-plans")]
[Authorize(Roles = "Admin")]
public class AdminSubscriptionPlansController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminSubscriptionPlansController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _db.SubscriptionPlans.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var key = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Code.ToLower() == key || x.Name.ToLower().Contains(key));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Price)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 50 : Math.Min(take, 200))
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

        return Ok(new SubscriptionPlanListResponse(total, items));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var item = await _db.SubscriptionPlans
            .AsNoTracking()
            .Where(x => x.PlanId == id)
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
            .FirstOrDefaultAsync(cancellationToken);

        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpGet("{id:int}/audits")]
    public async Task<IActionResult> GetAudits(int id, [FromQuery] int skip = 0, [FromQuery] int take = 50, CancellationToken cancellationToken = default)
    {
        var query = _db.SubscriptionPlanAudits
            .AsNoTracking()
            .Where(x => x.PlanId == id)
            .OrderByDescending(x => x.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 50 : Math.Min(take, 200))
            .Select(x => new
            {
                x.AuditId,
                x.PlanId,
                x.ActorUserId,
                x.Action,
                x.BeforeJson,
                x.AfterJson,
                x.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new { total, items });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSubscriptionPlanRequest request, CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePlanRequest(request.Code, request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder);
        if (validationError != null) return BadRequest(validationError);

        var code = request.Code.Trim().ToUpperInvariant();
        var exists = await _db.SubscriptionPlans.AnyAsync(x => x.Code == code, cancellationToken);
        if (exists) return BadRequest("Plan code already exists.");

        var plan = new SubscriptionPlan
        {
            Code = code,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Price = request.Price,
            DurationDays = request.DurationDays,
            MonthlyListingLimit = request.MonthlyListingLimit,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.SubscriptionPlans.Add(plan);
        await _db.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(plan.PlanId, "CREATE", null, plan, cancellationToken);

        return Ok(new { plan.PlanId });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSubscriptionPlanRequest request, CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePlanRequest("DUMMY", request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder, validateCode: false);
        if (validationError != null) return BadRequest(validationError);

        var plan = await _db.SubscriptionPlans.FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return NotFound();

        var before = ClonePlan(plan);

        plan.Name = request.Name.Trim();
        plan.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        plan.Price = request.Price;
        plan.DurationDays = request.DurationDays;
        plan.MonthlyListingLimit = request.MonthlyListingLimit;
        plan.IsActive = request.IsActive;
        plan.SortOrder = request.SortOrder;
        plan.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(plan.PlanId, "UPDATE", before, plan, cancellationToken);

        return Ok(new { success = true });
    }

    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateSubscriptionPlanStatusRequest request, CancellationToken cancellationToken = default)
    {
        var plan = await _db.SubscriptionPlans.FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return NotFound();

        var before = ClonePlan(plan);
        plan.IsActive = request.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(plan.PlanId, "STATUS", before, plan, cancellationToken);

        return Ok(new { success = true });
    }

    [HttpPut("{id:int}/price")]
    public async Task<IActionResult> UpdatePrice(int id, [FromBody] UpdateSubscriptionPlanPriceRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Price < 0)
        {
            return BadRequest("Price must be >= 0.");
        }

        var plan = await _db.SubscriptionPlans.FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return NotFound();

        var before = ClonePlan(plan);
        plan.Price = request.Price;
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        await AddAuditAsync(plan.PlanId, "PRICE", before, plan, cancellationToken);

        return Ok(new { success = true });
    }

    private long? GetActorUserId()
    {
        var sub = User.FindFirst("sub")?.Value
                  ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? User.FindFirst(ClaimTypes.Name)?.Value;
        return long.TryParse(sub, out var id) ? id : null;
    }

    private static object ClonePlan(SubscriptionPlan plan)
    {
        return new
        {
            plan.PlanId,
            plan.Code,
            plan.Name,
            plan.Description,
            plan.Price,
            plan.DurationDays,
            plan.MonthlyListingLimit,
            plan.IsActive,
            plan.SortOrder
        };
    }

    private static string? ValidatePlanRequest(string code, string name, decimal price, int durationDays, int? monthlyLimit, int sortOrder, bool validateCode = true)
    {
        if (validateCode)
        {
            if (string.IsNullOrWhiteSpace(code)) return "Code is required.";
            var trimmed = code.Trim();
            if (trimmed.Length > 50) return "Code must be <= 50 chars.";
        }

        if (string.IsNullOrWhiteSpace(name)) return "Name is required.";
        if (name.Trim().Length > 255) return "Name must be <= 255 chars.";
        if (price < 0) return "Price must be >= 0.";
        if (durationDays <= 0) return "DurationDays must be > 0.";
        if (monthlyLimit.HasValue && monthlyLimit.Value <= 0) return "MonthlyListingLimit must be > 0 when provided.";
        if (sortOrder < 0) return "SortOrder must be >= 0.";
        return null;
    }

    private async Task AddAuditAsync(int planId, string action, object? before, SubscriptionPlan after, CancellationToken cancellationToken)
    {
        var audit = new SubscriptionPlanAudit
        {
            PlanId = planId,
            ActorUserId = GetActorUserId(),
            Action = action,
            BeforeJson = before == null ? null : JsonSerializer.Serialize(before),
            AfterJson = JsonSerializer.Serialize(ClonePlan(after)),
            CreatedAt = DateTime.UtcNow
        };

        _db.SubscriptionPlanAudits.Add(audit);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
