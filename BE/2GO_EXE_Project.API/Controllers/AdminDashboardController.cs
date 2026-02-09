using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Admin;
using _2GO_EXE_Project.DAL.Context;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminDashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? from, [FromQuery] DateTime? to, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var toDate = to ?? now;
        var fromDate = from ?? now.AddDays(-30);
        if (fromDate > toDate)
        {
            return BadRequest("Invalid date range.");
        }

        var ordersQuery = _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt.HasValue && o.CreatedAt.Value >= fromDate && o.CreatedAt.Value <= toDate);

        var paymentsQuery = _db.Payments.AsNoTracking()
            .Where(p => p.CreatedAt.HasValue && p.CreatedAt.Value >= fromDate && p.CreatedAt.Value <= toDate);

        var listingsQuery = _db.Listings.AsNoTracking()
            .Where(l => l.CreatedAt.HasValue && l.CreatedAt.Value >= fromDate && l.CreatedAt.Value <= toDate);

        var usersQuery = _db.Users.AsNoTracking()
            .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value >= fromDate && u.CreatedAt.Value <= toDate);

        var reportsQuery = _db.Reports.AsNoTracking()
            .Where(r => r.CreatedAt.HasValue && r.CreatedAt.Value >= fromDate && r.CreatedAt.Value <= toDate);

        var ordersTotal = await ordersQuery.CountAsync(cancellationToken);
        var ordersCompleted = await ordersQuery.CountAsync(o => o.Status == OrderStatuses.Completed, cancellationToken);
        var ordersCancelled = await ordersQuery.CountAsync(o => o.Status == OrderStatuses.Cancelled, cancellationToken);
        var gmvCompleted = await ordersQuery
            .Where(o => o.Status == OrderStatuses.Completed)
            .SumAsync(o => o.TotalAmount ?? 0m, cancellationToken);

        var paymentsPaid = await paymentsQuery.CountAsync(p => p.Status == PaymentStatuses.Paid, cancellationToken);
        var paymentsFailed = await paymentsQuery.CountAsync(p => p.Status == PaymentStatuses.Failed || p.Status == PaymentStatuses.Cancelled, cancellationToken);
        var subscriptionRevenue = await paymentsQuery
            .Where(p => p.PaymentType == PaymentTypes.Subscription && p.Status == PaymentStatuses.Paid)
            .SumAsync(p => p.Amount ?? 0m, cancellationToken);

        var listingsNew = await listingsQuery.CountAsync(cancellationToken);
        var listingsActive = await _db.Listings.AsNoTracking().CountAsync(l => l.Status == ListingStatuses.Active, cancellationToken);
        var listingsPending = await _db.Listings.AsNoTracking().CountAsync(l => l.Status == ListingStatuses.PendingReview, cancellationToken);

        var usersNew = await usersQuery.CountAsync(cancellationToken);
        var reportsNew = await reportsQuery.CountAsync(cancellationToken);

        var summary = new AdminKpiSummary(
            gmvCompleted,
            ordersTotal,
            ordersCompleted,
            ordersCancelled,
            listingsNew,
            listingsActive,
            listingsPending,
            usersNew,
            paymentsPaid,
            paymentsFailed,
            subscriptionRevenue,
            reportsNew);

        return Ok(new AdminDashboardResponse(fromDate, toDate, summary));
    }

    [HttpGet("timeseries")]
    public async Task<IActionResult> GetTimeseries(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string bucket = "day",
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var toDate = to ?? now;
        var fromDate = from ?? now.AddDays(-30);
        if (fromDate > toDate)
        {
            return BadRequest("Invalid date range.");
        }

        var bucketKey = NormalizeBucket(bucket);
        if (bucketKey == null)
        {
            return BadRequest("Invalid bucket. Use day|week|month|year.");
        }

        var points = BuildBuckets(fromDate, toDate, bucketKey.Value);
        if (points.Count == 0)
        {
            return Ok(new AdminTimeseriesResponse(fromDate, toDate, bucketKey.Value.ToString().ToLowerInvariant(), points));
        }

        var trunc = BucketToTrunc(bucketKey.Value);

        var orderGroups = await _db.Orders.AsNoTracking()
            .Where(o => o.CreatedAt.HasValue && o.CreatedAt.Value >= fromDate && o.CreatedAt.Value <= toDate)
            .GroupBy(o => NpgsqlDbFunctionsExtensions.DateTrunc(EF.Functions, trunc, o.CreatedAt!.Value))
            .Select(g => new
            {
                Period = g.Key!.Value,
                OrdersTotal = g.Count(),
                OrdersCompleted = g.Count(o => o.Status == OrderStatuses.Completed),
                OrdersCancelled = g.Count(o => o.Status == OrderStatuses.Cancelled),
                GmvCompleted = g.Where(o => o.Status == OrderStatuses.Completed).Sum(o => o.TotalAmount ?? 0m)
            })
            .ToListAsync(cancellationToken);

        var paymentGroups = await _db.Payments.AsNoTracking()
            .Where(p => p.CreatedAt.HasValue && p.CreatedAt.Value >= fromDate && p.CreatedAt.Value <= toDate)
            .GroupBy(p => NpgsqlDbFunctionsExtensions.DateTrunc(EF.Functions, trunc, p.CreatedAt!.Value))
            .Select(g => new
            {
                Period = g.Key!.Value,
                PaymentsPaid = g.Count(p => p.Status == PaymentStatuses.Paid),
                PaymentsFailed = g.Count(p => p.Status == PaymentStatuses.Failed || p.Status == PaymentStatuses.Cancelled),
                SubscriptionRevenue = g.Where(p => p.PaymentType == PaymentTypes.Subscription && p.Status == PaymentStatuses.Paid)
                    .Sum(p => p.Amount ?? 0m)
            })
            .ToListAsync(cancellationToken);

        var listingGroups = await _db.Listings.AsNoTracking()
            .Where(l => l.CreatedAt.HasValue && l.CreatedAt.Value >= fromDate && l.CreatedAt.Value <= toDate)
            .GroupBy(l => NpgsqlDbFunctionsExtensions.DateTrunc(EF.Functions, trunc, l.CreatedAt!.Value))
            .Select(g => new
            {
                Period = g.Key!.Value,
                ListingsNew = g.Count()
            })
            .ToListAsync(cancellationToken);

        var userGroups = await _db.Users.AsNoTracking()
            .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value >= fromDate && u.CreatedAt.Value <= toDate)
            .GroupBy(u => NpgsqlDbFunctionsExtensions.DateTrunc(EF.Functions, trunc, u.CreatedAt!.Value))
            .Select(g => new
            {
                Period = g.Key!.Value,
                UsersNew = g.Count()
            })
            .ToListAsync(cancellationToken);

        var reportGroups = await _db.Reports.AsNoTracking()
            .Where(r => r.CreatedAt.HasValue && r.CreatedAt.Value >= fromDate && r.CreatedAt.Value <= toDate)
            .GroupBy(r => NpgsqlDbFunctionsExtensions.DateTrunc(EF.Functions, trunc, r.CreatedAt!.Value))
            .Select(g => new
            {
                Period = g.Key!.Value,
                ReportsNew = g.Count()
            })
            .ToListAsync(cancellationToken);

        var orderByPeriod = orderGroups.ToDictionary(x => x.Period);
        var paymentByPeriod = paymentGroups.ToDictionary(x => x.Period);
        var listingByPeriod = listingGroups.ToDictionary(x => x.Period);
        var userByPeriod = userGroups.ToDictionary(x => x.Period);
        var reportByPeriod = reportGroups.ToDictionary(x => x.Period);

        var resultPoints = new List<AdminTimeseriesPoint>(points.Count);
        foreach (var periodStart in points)
        {
            orderByPeriod.TryGetValue(periodStart, out var og);
            paymentByPeriod.TryGetValue(periodStart, out var pg);
            listingByPeriod.TryGetValue(periodStart, out var lg);
            userByPeriod.TryGetValue(periodStart, out var ug);
            reportByPeriod.TryGetValue(periodStart, out var rg);

            resultPoints.Add(new AdminTimeseriesPoint(
                periodStart,
                og?.GmvCompleted ?? 0m,
                og?.OrdersTotal ?? 0,
                og?.OrdersCompleted ?? 0,
                og?.OrdersCancelled ?? 0,
                lg?.ListingsNew ?? 0,
                ug?.UsersNew ?? 0,
                pg?.PaymentsPaid ?? 0,
                pg?.PaymentsFailed ?? 0,
                pg?.SubscriptionRevenue ?? 0m,
                rg?.ReportsNew ?? 0));
        }

        return Ok(new AdminTimeseriesResponse(fromDate, toDate, bucketKey.Value.ToString().ToLowerInvariant(), resultPoints));
    }

    private enum Bucket
    {
        Day,
        Week,
        Month,
        Year
    }

    private static Bucket? NormalizeBucket(string bucket)
    {
        if (string.IsNullOrWhiteSpace(bucket)) return Bucket.Day;
        var key = bucket.Trim().ToLowerInvariant();
        return key switch
        {
            "day" => Bucket.Day,
            "week" => Bucket.Week,
            "month" => Bucket.Month,
            "year" => Bucket.Year,
            _ => null
        };
    }

    private static List<DateTime> BuildBuckets(DateTime fromDate, DateTime toDate, Bucket bucket)
    {
        var points = new List<DateTime>();
        var cursor = AlignStart(fromDate, bucket);
        var end = toDate;
        while (cursor <= end)
        {
            points.Add(cursor);
            cursor = AddBucket(cursor, bucket);
        }
        return points;
    }

    private static DateTime AlignStart(DateTime date, Bucket bucket)
    {
        var utc = DateTime.SpecifyKind(date, DateTimeKind.Utc);
        return bucket switch
        {
            Bucket.Day => new DateTime(utc.Year, utc.Month, utc.Day, 0, 0, 0, DateTimeKind.Utc),
            Bucket.Week => StartOfWeek(utc),
            Bucket.Month => new DateTime(utc.Year, utc.Month, 1, 0, 0, 0, DateTimeKind.Utc),
            Bucket.Year => new DateTime(utc.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            _ => utc
        };
    }

    private static DateTime StartOfWeek(DateTime dateUtc)
    {
        var day = (int)dateUtc.DayOfWeek;
        var diff = (day == 0 ? 6 : day - 1); // Monday as start
        var start = dateUtc.AddDays(-diff);
        return new DateTime(start.Year, start.Month, start.Day, 0, 0, 0, DateTimeKind.Utc);
    }

    private static DateTime AddBucket(DateTime date, Bucket bucket)
    {
        return bucket switch
        {
            Bucket.Day => date.AddDays(1),
            Bucket.Week => date.AddDays(7),
            Bucket.Month => date.AddMonths(1),
            Bucket.Year => date.AddYears(1),
            _ => date.AddDays(1)
        };
    }

    private static DateTime GetPeriodEnd(DateTime start, Bucket bucket)
    {
        return AddBucket(start, bucket);
    }

    private static string BucketToTrunc(Bucket bucket)
    {
        return bucket switch
        {
            Bucket.Day => "day",
            Bucket.Week => "week",
            Bucket.Month => "month",
            Bucket.Year => "year",
            _ => "day"
        };
    }
}
