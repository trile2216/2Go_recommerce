using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Listings;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Notifications;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class AdminListingService : IAdminListingService
{
    private readonly IUnitOfWork _uow;
    private readonly INotificationService _notificationService;
    private static readonly HashSet<string> AllowedStatuses = new(ListingStatuses.All, StringComparer.OrdinalIgnoreCase);

    public AdminListingService(IUnitOfWork uow, INotificationService notificationService)
    {
        _uow = uow;
        _notificationService = notificationService;
    }

    private static long? GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirst("sub")?.Value
                  ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? principal.FindFirst(ClaimTypes.Name)?.Value;
        if (long.TryParse(sub, out var id)) return id;
        return null;
    }

    public async Task<ListingListResponse> GetListingsAsync(string? status, long? sellerId, int? categoryId, int? subCategoryId, int skip, int take, CancellationToken cancellationToken = default)
    {
        var query = _uow.Listings.Query()
            .Include(l => l.SubCategory)
            .ThenInclude(sc => sc!.Category)
            .Include(l => l.ListingImages)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!AllowedStatuses.Contains(status))
            {
                throw new InvalidOperationException($"Invalid listing status. Allowed: {string.Join(", ", ListingStatuses.All)}.");
            }
            query = query.Where(l => l.Status == status);
        }
        if (sellerId.HasValue)
        {
            query = query.Where(l => l.SellerId == sellerId.Value);
        }
        if (categoryId.HasValue)
        {
            query = query.Where(l => l.SubCategory != null && l.SubCategory.CategoryId == categoryId.Value);
        }
        if (subCategoryId.HasValue)
        {
            query = query.Where(l => l.SubCategoryId == subCategoryId.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(l => l.UpdatedAt ?? l.CreatedAt)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(l => new ListingListItem(
                l.ListingId,
                l.Title,
                l.Price,
                l.Status,
                l.CreatedAt,
                l.SubCategory != null ? l.SubCategory.CategoryId : null,
                l.SubCategoryId,
                l.SubCategory != null && l.SubCategory.Category != null ? l.SubCategory.Category.Name : null,
                l.SubCategory != null ? l.SubCategory.Name : null,
                l.ListingImages.OrderByDescending(i => i.IsPrimary == true).ThenBy(i => i.ImageId).Select(i => i.ImageUrl).FirstOrDefault()))
            .ToListAsync(cancellationToken);

        return new ListingListResponse(total, items);
    }

    public async Task<ListingDetail?> GetByIdAsync(long listingId, CancellationToken cancellationToken = default)
    {
        var query = _uow.Listings.Query()
            .Include(l => l.SubCategory)
            .ThenInclude(sc => sc!.Category)
            .Include(l => l.ListingImages)
            .Include(l => l.ListingAttributes)
            .Include(l => l.Seller)
            .Where(l => l.ListingId == listingId);

        var listing = await query.FirstOrDefaultAsync(cancellationToken);
        if (listing == null) return null;

        var images = listing.ListingImages
            .OrderByDescending(i => i.IsPrimary == true)
            .ThenBy(i => i.ImageId)
            .Select(i => i.ImageUrl ?? string.Empty)
            .ToList();
        var primary = images.FirstOrDefault();

        var attributes = listing.ListingAttributes
            .OrderBy(a => a.AttributeId)
            .Where(a => !string.IsNullOrWhiteSpace(a.Name))
            .Select(a => new ListingAttributeItem(a.Name ?? string.Empty, a.Value ?? string.Empty))
            .ToList();

        return new ListingDetail(
            listing.ListingId,
            listing.Title,
            listing.Description,
            listing.Price,
            listing.HasNegotiation,
            listing.ListingType,
            listing.AvailableQuantity,
            listing.Condition,
            listing.Brand,
            listing.Status,
            listing.CreatedAt,
            listing.UpdatedAt,
            listing.SubCategory?.CategoryId,
            listing.SubCategoryId,
            listing.SubCategory?.Category?.Name,
            listing.SubCategory?.Name,
            listing.Seller?.Email,
            listing.Seller?.Phone,
            primary,
            images,
            attributes);
    }

    public async Task<BasicResponse> UpdateStatusAsync(ClaimsPrincipal adminPrincipal, long listingId, UpdateListingStatusRequest request, CancellationToken cancellationToken = default)
    {
        var listing = await _uow.Listings.GetByIdAsync(listingId);
        if (listing == null) return new BasicResponse(false, "Listing not found.");

        if (string.IsNullOrWhiteSpace(request.Status) || !AllowedStatuses.Contains(request.Status))
        {
            return new BasicResponse(false, "Invalid status value.");
        }

        if (string.Equals(listing.Status, request.Status, StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(true, "Listing already in requested status.");
        }

        if (!IsStatusTransitionAllowed(listing.Status, request.Status))
        {
            return new BasicResponse(false, $"Invalid listing status transition: {listing.Status} -> {request.Status}.");
        }

        listing.Status = request.Status;
        listing.UpdatedAt = DateTime.UtcNow;
        _uow.Listings.Update(listing);
        await _uow.SaveChangesAsync(cancellationToken);

        if (listing.SellerId.HasValue)
        {
            await NotifyAsync(listing.SellerId.Value, "LISTING", "Trạng thái bài đăng thay đổi", $"Bài đăng #{listingId} đã chuyển sang trạng thái {request.Status}.", $"/listings/{listingId}", cancellationToken);
        }
        await LogAdminActionAsync(adminPrincipal, "UpdateListingStatus", new { ListingId = listingId, request.Status }, cancellationToken);
        return new BasicResponse(true, "Listing status updated.");
    }

    private static bool IsStatusTransitionAllowed(string? current, string next)
    {
        if (string.IsNullOrWhiteSpace(current)) return true;

        if (string.Equals(current, ListingStatuses.Draft, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.PendingReview, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.PendingReview, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Active, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Rejected, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Rejected, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.PendingReview, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Active, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Archived, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Flagged, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Reserved, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Sold, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Archived, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Active, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Flagged, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Active, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Reserved, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Active, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Sold, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Sold, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ListingStatuses.Deleted, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return false;
    }

    public async Task<BasicResponse> DeleteAsync(ClaimsPrincipal adminPrincipal, long listingId, CancellationToken cancellationToken = default)
    {
        var listing = await _uow.Listings.GetByIdAsync(listingId);
        if (listing == null) return new BasicResponse(false, "Listing not found.");

        listing.Status = ListingStatuses.Deleted;
        listing.UpdatedAt = DateTime.UtcNow;
        _uow.Listings.Update(listing);
        await _uow.SaveChangesAsync(cancellationToken);

        if (listing.SellerId.HasValue)
        {
            await NotifyAsync(listing.SellerId.Value, "LISTING", "Bài đăng bị xóa", $"Bài đăng #{listingId} đã bị xóa bởi quản trị viên.", $"/listings/{listingId}", cancellationToken);
        }
        await LogAdminActionAsync(adminPrincipal, "DeleteListing", new { ListingId = listingId }, cancellationToken);
        return new BasicResponse(true, "Listing deleted (soft).");
    }

    private async Task LogAdminActionAsync(ClaimsPrincipal principal, string action, object details, CancellationToken cancellationToken)
    {
        var userId = GetUserId(principal);
        try
        {
            var log = new ActivityLog
            {
                UserId = userId,
                Action = action,
                Details = JsonSerializer.Serialize(details),
                CreatedAt = DateTime.UtcNow
            };
            await _uow.ActivityLogs.AddAsync(log, cancellationToken);
            await _uow.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // ignore logging failures
        }
    }

    private async Task NotifyAsync(long userId, string type, string title, string message, string? link, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest(
                userId,
                title,
                message,
                type,
                link), cancellationToken);
        }
        catch
        {
            // ignore notification failures
        }
    }
}
