using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Comments;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.BAL.Validation;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class CommentService : ICommentService
{
    private readonly IUnitOfWork _uow;

    public CommentService(IUnitOfWork uow)
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

    public async Task<CommentDto> CreateAsync(ClaimsPrincipal userPrincipal, CreateCommentRequest request, CancellationToken cancellationToken = default)
    {
        ValidationGuard.ThrowIfInvalid(RequestValidator.ValidateCreateComment(request));

        var userId = GetUserId(userPrincipal);

        // Validate listing exists
        var listing = await _uow.Listings.GetByIdAsync(request.ListingId);
        if (listing == null)
        {
            throw new InvalidOperationException(ErrorMessages.LISTING_NOT_FOUND);
        }

        // Validate parent comment if provided
        if (request.ParentId.HasValue)
        {
            var parentComment = await _uow.ListingComments.GetByIdAsync(request.ParentId.Value);
            if (parentComment == null)
            {
                throw new InvalidOperationException(ErrorMessages.PARENT_COMMENT_NOT_FOUND);
            }
            if (parentComment.ListingId != request.ListingId)
            {
                throw new InvalidOperationException(ErrorMessages.PARENT_COMMENT_DIFFERENT_LISTING);
            }
        }

        var comment = new ListingComment
        {
            ListingId = request.ListingId,
            UserId = userId,
            ParentId = request.ParentId,
            Content = request.Content.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _uow.ListingComments.AddAsync(comment);
        await _uow.SaveChangesAsync(cancellationToken);

        // Reload with user details
        var created = await _uow.ListingComments.GetByIdWithDetailsAsync(comment.CommentId, cancellationToken);
        return MapToDto(created!);
    }

    public async Task<CommentListResponse> GetByListingIdAsync(long listingId, int skip, int take, CancellationToken cancellationToken = default)
    {
        var (total, items) = await _uow.ListingComments.GetByListingIdAsync(listingId, skip, take, cancellationToken);
        var dtos = items.Select(MapToDto).ToList();
        return new CommentListResponse(total, dtos);
    }

    public async Task<CommentDto?> GetByIdAsync(long commentId, CancellationToken cancellationToken = default)
    {
        var comment = await _uow.ListingComments.GetByIdWithDetailsAsync(commentId, cancellationToken);
        return comment == null ? null : MapToDto(comment);
    }

    public async Task<CommentDto> UpdateAsync(ClaimsPrincipal userPrincipal, long commentId, UpdateCommentRequest request, CancellationToken cancellationToken = default)
    {
        ValidationGuard.ThrowIfInvalid(RequestValidator.ValidateUpdateComment(request));

        var userId = GetUserId(userPrincipal);

        var comment = await _uow.ListingComments.GetByIdAsync(commentId);
        if (comment == null)
        {
            throw new InvalidOperationException(ErrorMessages.COMMENT_NOT_FOUND);
        }

        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException(ErrorMessages.NOT_COMMENT_OWNER);
        }

        comment.Content = request.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        await _uow.SaveChangesAsync(cancellationToken);

        // Reload with user details
        var updated = await _uow.ListingComments.GetByIdWithDetailsAsync(comment.CommentId, cancellationToken);
        return MapToDto(updated!);
    }

    public async Task DeleteAsync(ClaimsPrincipal userPrincipal, long commentId, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);

        var comment = await _uow.ListingComments
            .Query()
            .Include(c => c.Replies)
            .FirstOrDefaultAsync(c => c.CommentId == commentId, cancellationToken);

        if (comment == null)
        {
            throw new InvalidOperationException(ErrorMessages.COMMENT_NOT_FOUND);
        }

        if (comment.UserId != userId)
        {
            throw new UnauthorizedAccessException(ErrorMessages.NOT_COMMENT_OWNER);
        }

        // Delete all replies first
        if (comment.Replies.Any())
        {
            _uow.ListingComments.RemoveRange(comment.Replies);  // ? ??I DeleteRange ? RemoveRange
        }
        _uow.ListingComments.Remove(comment);  // ? ??I Delete ? Remove
        await _uow.SaveChangesAsync(cancellationToken);
    }

    private static CommentDto MapToDto(ListingComment comment)
    {
        var profile = comment.User?.UserProfiles.FirstOrDefault();
        return new CommentDto(
            comment.CommentId,
            comment.ListingId,
            comment.UserId,
            profile?.FullName,
            profile?.AvatarUrl,
            comment.Content,
            comment.ParentId,
            comment.CreatedAt,
            comment.UpdatedAt,
            comment.Replies.Count);
    }
}   