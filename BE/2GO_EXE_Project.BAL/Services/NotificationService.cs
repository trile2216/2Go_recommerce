using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Notifications;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.BAL.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;

    public NotificationService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<NotificationListResponse> GetMyNotificationsAsync(long userId, int skip, int take, CancellationToken cancellationToken = default)
    {
        var query = _db.Notifications
            .AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(n => new NotificationItem(
                n.NotificationId,
                n.Title,
                n.Message,
                n.Type,
                n.Link,
                n.IsRead,
                n.CreatedAt))
            .ToListAsync(cancellationToken);

        return new NotificationListResponse(total, items);
    }

    public async Task<BasicResponse> MarkReadAsync(long userId, long notificationId, CancellationToken cancellationToken = default)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId, cancellationToken);
        if (notification == null) return new BasicResponse(false, "Notification not found.");

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _db.SaveChangesAsync(cancellationToken);
        }

        return new BasicResponse(true, "Marked as read.");
    }

    public async Task<BasicResponse> MarkAllReadAsync(long userId, CancellationToken cancellationToken = default)
    {
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(cancellationToken);

        if (notifications.Count == 0) return new BasicResponse(true, "No unread notifications.");

        foreach (var n in notifications)
        {
            n.IsRead = true;
        }
        await _db.SaveChangesAsync(cancellationToken);

        return new BasicResponse(true, "All notifications marked as read.");
    }

    public async Task<BasicResponse> CreateAsync(CreateNotificationRequest request, CancellationToken cancellationToken = default)
    {
        if (request.UserId <= 0) return new BasicResponse(false, "Invalid user id.");
        if (string.IsNullOrWhiteSpace(request.Title)) return new BasicResponse(false, "Title is required.");
        if (string.IsNullOrWhiteSpace(request.Message)) return new BasicResponse(false, "Message is required.");

        var notification = new Notification
        {
            UserId = request.UserId,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = request.Type,
            Link = request.Link,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _db.Notifications.Add(notification);
        await _db.SaveChangesAsync(cancellationToken);

        return new BasicResponse(true, "Notification created.");
    }
}