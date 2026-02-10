using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Ratings;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;
using _2GO_EXE_Project.BAL.Validation;

namespace _2GO_EXE_Project.BAL.Services;

public class RatingService : IRatingService
{
    private readonly IUnitOfWork _uow;

    public RatingService(IUnitOfWork uow)
    {
        _uow = uow;
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

    public async Task<UserRatingResponse> CreateAsync(ClaimsPrincipal userPrincipal, CreateUserRatingRequest request, CancellationToken cancellationToken = default)
    {
        ValidationGuard.ThrowIfInvalid(RequestValidator.ValidateCreateRating(request));

        var raterId = GetUserId(userPrincipal);
        var order = await _uow.Orders.Query()
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);

        if (order == null)
        {
            throw new InvalidOperationException("Order not found.");
        }
        if (order.BuyerId != raterId)
        {
            throw new InvalidOperationException("Only the buyer can rate this order.");
        }
        if (order.SellerId == null)
        {
            throw new InvalidOperationException("Seller not found for this order.");
        }
        if (!string.Equals(order.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only completed orders can be rated.");
        }

        var exists = await _uow.UserRatings.Query()
            .AnyAsync(r => r.OrderId == request.OrderId, cancellationToken);
        if (exists)
        {
            throw new InvalidOperationException("This order has already been rated.");
        }

        var rating = new UserRating
        {
            OrderId = request.OrderId,
            RaterId = raterId,
            RatedUserId = order.SellerId,
            Score = request.Score,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.UserRatings.AddAsync(rating, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        return new UserRatingResponse(
            rating.RatingId,
            rating.OrderId ?? 0,
            rating.RaterId ?? 0,
            rating.RatedUserId ?? 0,
            rating.Score ?? 0,
            rating.Comment,
            rating.CreatedAt);
    }

    public async Task<UserRatingListResponse> GetRatingsForUserAsync(long userId, int skip, int take, CancellationToken cancellationToken = default)
    {
        var query = _uow.UserRatings.Query()
            .Where(r => r.RatedUserId == userId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(r => new UserRatingResponse(
                r.RatingId,
                r.OrderId ?? 0,
                r.RaterId ?? 0,
                r.RatedUserId ?? 0,
                r.Score ?? 0,
                r.Comment,
                r.CreatedAt))
            .ToListAsync(cancellationToken);

        return new UserRatingListResponse(total, items);
    }

    public async Task<UserRatingListResponse> GetMyRatingsAsync(ClaimsPrincipal userPrincipal, int skip, int take, CancellationToken cancellationToken = default)
    {
        var raterId = GetUserId(userPrincipal);
        var query = _uow.UserRatings.Query()
            .Where(r => r.RaterId == raterId);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(r => new UserRatingResponse(
                r.RatingId,
                r.OrderId ?? 0,
                r.RaterId ?? 0,
                r.RatedUserId ?? 0,
                r.Score ?? 0,
                r.Comment,
                r.CreatedAt))
            .ToListAsync(cancellationToken);

        return new UserRatingListResponse(total, items);
    }
}
