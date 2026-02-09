using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Subscriptions;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class AdminSubscriptionPlanService : IAdminSubscriptionPlanService
{
    private readonly IUnitOfWork _uow;

    public AdminSubscriptionPlanService(IUnitOfWork uow)
    {
        _uow = uow;
    }

    public async Task<SubscriptionPlanListResponse> GetAllAsync(string? search, bool? isActive, int skip, int take, CancellationToken cancellationToken = default)
    {
        var query = _uow.SubscriptionPlans.Query().AsNoTracking();

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

        return new SubscriptionPlanListResponse(total, items);
    }

    public async Task<SubscriptionPlanItem?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _uow.SubscriptionPlans.Query()
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
    }

    public async Task<object> GetAuditsAsync(int id, int skip, int take, CancellationToken cancellationToken = default)
    {
        var query = _uow.SubscriptionPlanAudits.Query()
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

        return new { total, items };
    }

    public async Task<int> CreateAsync(CreateSubscriptionPlanRequest request, long? actorUserId, CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePlanRequest(request.Code, request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder);
        if (validationError != null)
        {
            throw new InvalidOperationException(validationError);
        }

        var code = request.Code.Trim().ToUpperInvariant();
        var exists = await _uow.SubscriptionPlans.Query().AnyAsync(x => x.Code == code, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("Plan code already exists.");
        }

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

        await _uow.SubscriptionPlans.AddAsync(plan, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(plan.PlanId, "CREATE", null, plan, actorUserId, cancellationToken);
        return plan.PlanId;
    }

    public async Task<bool> UpdateAsync(int id, UpdateSubscriptionPlanRequest request, long? actorUserId, CancellationToken cancellationToken = default)
    {
        var validationError = ValidatePlanRequest("DUMMY", request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder, validateCode: false);
        if (validationError != null)
        {
            throw new InvalidOperationException(validationError);
        }

        var plan = await _uow.SubscriptionPlans.Query().FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return false;

        var before = ClonePlan(plan);
        plan.Name = request.Name.Trim();
        plan.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        plan.Price = request.Price;
        plan.DurationDays = request.DurationDays;
        plan.MonthlyListingLimit = request.MonthlyListingLimit;
        plan.IsActive = request.IsActive;
        plan.SortOrder = request.SortOrder;
        plan.UpdatedAt = DateTime.UtcNow;
        _uow.SubscriptionPlans.Update(plan);
        await _uow.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(plan.PlanId, "UPDATE", before, plan, actorUserId, cancellationToken);
        return true;
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdateSubscriptionPlanStatusRequest request, long? actorUserId, CancellationToken cancellationToken = default)
    {
        var plan = await _uow.SubscriptionPlans.Query().FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return false;

        var before = ClonePlan(plan);
        plan.IsActive = request.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;
        _uow.SubscriptionPlans.Update(plan);
        await _uow.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(plan.PlanId, "STATUS", before, plan, actorUserId, cancellationToken);
        return true;
    }

    public async Task<bool> UpdatePriceAsync(int id, UpdateSubscriptionPlanPriceRequest request, long? actorUserId, CancellationToken cancellationToken = default)
    {
        if (request.Price < 0)
        {
            throw new InvalidOperationException("Price must be >= 0.");
        }

        var plan = await _uow.SubscriptionPlans.Query().FirstOrDefaultAsync(x => x.PlanId == id, cancellationToken);
        if (plan == null) return false;

        var before = ClonePlan(plan);
        plan.Price = request.Price;
        plan.UpdatedAt = DateTime.UtcNow;
        _uow.SubscriptionPlans.Update(plan);
        await _uow.SaveChangesAsync(cancellationToken);

        await AddAuditAsync(plan.PlanId, "PRICE", before, plan, actorUserId, cancellationToken);
        return true;
    }

    private async Task AddAuditAsync(int planId, string action, object? before, SubscriptionPlan after, long? actorUserId, CancellationToken cancellationToken)
    {
        var audit = new SubscriptionPlanAudit
        {
            PlanId = planId,
            ActorUserId = actorUserId,
            Action = action,
            BeforeJson = before == null ? null : JsonSerializer.Serialize(before),
            AfterJson = JsonSerializer.Serialize(ClonePlan(after)),
            CreatedAt = DateTime.UtcNow
        };

        await _uow.SubscriptionPlanAudits.AddAsync(audit, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
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
}
