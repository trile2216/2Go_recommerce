using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.API.Controllers;

[ApiController]
[Route("api/admin/market-prices")]
[Authorize(Roles = "Admin")]
public class AdminMarketPricesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminMarketPricesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? productKey,
        [FromQuery] int? categoryId,
        [FromQuery] string? condition,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _db.MarketPrices.AsQueryable();

        if (!string.IsNullOrWhiteSpace(productKey))
        {
            var key = productKey.Trim().ToLowerInvariant();
            query = query.Where(x => x.ProductKey == key);
        }

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(condition))
        {
            var normalized = condition.Trim().ToUpperInvariant();
            query = query.Where(x => x.Condition == normalized);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.UpdatedAt)
            .Skip(skip < 0 ? 0 : skip)
            .Take(take <= 0 ? 20 : Math.Min(take, 100))
            .Select(x => new MarketPriceItem(
                x.MarketPriceId,
                x.ProductKey,
                x.CategoryId,
                x.Condition,
                x.AvgPrice,
                x.MinPrice,
                x.MaxPrice,
                x.SampleCount,
                x.Source,
                x.Confidence,
                x.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new MarketPriceListResponse(total, items));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken = default)
    {
        var item = await _db.MarketPrices
            .Where(x => x.MarketPriceId == id)
            .Select(x => new MarketPriceItem(
                x.MarketPriceId,
                x.ProductKey,
                x.CategoryId,
                x.Condition,
                x.AvgPrice,
                x.MinPrice,
                x.MaxPrice,
                x.SampleCount,
                x.Source,
                x.Confidence,
                x.UpdatedAt))
            .FirstOrDefaultAsync(cancellationToken);

        if (item == null) return NotFound();
        return Ok(item);
    }

    [HttpPost("seed")]
    public async Task<IActionResult> Seed(CancellationToken cancellationToken = default)
    {
        if (await _db.MarketPrices.AnyAsync(cancellationToken))
        {
            return Ok(new { message = "MarketPrices already has data." });
        }

        var now = DateTime.UtcNow;
        var seeds = new List<MarketPrice>
        {
            new()
            {
                ProductKey = "panasonic máy lạnh",
                CategoryId = null,
                Condition = "GOOD",
                AvgPrice = 6500000,
                MinPrice = 6000000,
                MaxPrice = 7000000,
                SampleCount = 6,
                Source = "seed",
                Confidence = "MEDIUM",
                UpdatedAt = now
            },
            new()
            {
                ProductKey = "iphone 12",
                CategoryId = null,
                Condition = "FAIR",
                AvgPrice = 8500000,
                MinPrice = 8000000,
                MaxPrice = 9000000,
                SampleCount = 5,
                Source = "seed",
                Confidence = "MEDIUM",
                UpdatedAt = now
            },
            new()
            {
                ProductKey = "samsung tủ lạnh",
                CategoryId = null,
                Condition = "POOR",
                AvgPrice = 3000000,
                MinPrice = 2500000,
                MaxPrice = 3500000,
                SampleCount = 3,
                Source = "seed",
                Confidence = "LOW",
                UpdatedAt = now
            }
        };

        await _db.MarketPrices.AddRangeAsync(seeds, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Seeded MarketPrices", count = seeds.Count });
    }

    [HttpPost("backfill")]
    public async Task<IActionResult> Backfill(
        [FromQuery] int monthsBack = 6,
        [FromQuery] decimal minPrice = 100_000,
        [FromQuery] bool dryRun = false,
        CancellationToken cancellationToken = default)
    {
        if (monthsBack <= 0) monthsBack = 6;
        var fromDate = DateTime.UtcNow.AddMonths(-monthsBack);

        var orders = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Listing)
            .ThenInclude(l => l!.SubCategory)
            .ThenInclude(sc => sc!.Category)
            .Where(o => o.Status == "Completed")
            .Where(o => o.CreatedAt.HasValue && o.CreatedAt.Value >= fromDate)
            .Where(o => o.TotalAmount.HasValue && o.TotalAmount.Value >= minPrice)
            .Where(o => o.Listing != null)
            .ToListAsync(cancellationToken);

        var grouped = orders
            .Select(o =>
            {
                var listing = o.Listing!;
                var categoryName = listing.SubCategory?.Category?.Name;
                var model = ExtractModelFromTitle(listing.Title, listing.Brand, categoryName);
                var productKey = BuildProductKey(listing.Brand, categoryName, model);
                return new
                {
                    ProductKey = productKey,
                    CategoryId = listing.SubCategory?.CategoryId,
                    Condition = NormalizeCondition(listing.Condition),
                    Price = o.TotalAmount!.Value
                };
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.ProductKey))
            .GroupBy(x => new { x.ProductKey, x.CategoryId, x.Condition })
            .Select(g => new
            {
                g.Key.ProductKey,
                g.Key.CategoryId,
                g.Key.Condition,
                SampleCount = g.Count(),
                MinPrice = g.Min(x => x.Price),
                MaxPrice = g.Max(x => x.Price),
                AvgPrice = g.Average(x => x.Price)
            })
            .ToList();

        if (dryRun)
        {
            return Ok(new
            {
            orders = orders.Count,
            groups = grouped.Count,
            dryRun = true
        });
    }

        var now = DateTime.UtcNow;
        var updated = 0;
        var inserted = 0;

        foreach (var g in grouped)
        {
            var existing = await _db.MarketPrices.FirstOrDefaultAsync(x =>
                x.ProductKey == g.ProductKey &&
                x.CategoryId == g.CategoryId &&
                x.Condition == g.Condition, cancellationToken);

            if (existing == null)
            {
                _db.MarketPrices.Add(new MarketPrice
                {
                    ProductKey = g.ProductKey,
                    CategoryId = g.CategoryId,
                    Condition = g.Condition,
                    AvgPrice = g.AvgPrice,
                    MinPrice = g.MinPrice,
                    MaxPrice = g.MaxPrice,
                    SampleCount = g.SampleCount,
                    Source = "backfill",
                    Confidence = g.SampleCount >= 10 ? "HIGH" : g.SampleCount >= 5 ? "MEDIUM" : "LOW",
                    UpdatedAt = now
                });
                inserted++;
                continue;
            }

            var totalCount = existing.SampleCount + g.SampleCount;
            existing.MinPrice = Math.Min(existing.MinPrice, g.MinPrice);
            existing.MaxPrice = Math.Max(existing.MaxPrice, g.MaxPrice);
            existing.AvgPrice = ((existing.AvgPrice * existing.SampleCount) + (g.AvgPrice * g.SampleCount)) / totalCount;
            existing.SampleCount = totalCount;
            existing.Source = "backfill";
            existing.Confidence = totalCount >= 10 ? "HIGH" : totalCount >= 5 ? "MEDIUM" : "LOW";
            existing.UpdatedAt = now;
            updated++;
        }

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            orders = orders.Count,
            groups = grouped.Count,
            inserted,
            updated
        });
    }

    private static string BuildProductKey(string? brand, string? categoryName, string? model)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(brand)) parts.Add(brand.Trim());
        if (!string.IsNullOrWhiteSpace(categoryName)) parts.Add(categoryName.Trim());
        if (!string.IsNullOrWhiteSpace(model)) parts.Add(model.Trim());
        return NormalizeKey(string.Join(" ", parts));
    }

    private static string NormalizeKey(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return string.Join(" ", input.Split(' ', StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();
    }

    private static string NormalizeCondition(string? condition)
    {
        if (string.IsNullOrWhiteSpace(condition)) return "GOOD";
        var c = condition.Trim().ToUpperInvariant();
        if (c == "EXCELLENT") return "NEW";
        return c is "NEW" or "GOOD" or "FAIR" or "POOR" ? c : "GOOD";
    }

    private static string? ExtractModelFromTitle(string? title, string? brand, string? categoryName)
    {
        if (string.IsNullOrWhiteSpace(title)) return null;
        var text = title.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(brand))
        {
            text = text.Replace(brand.ToLowerInvariant(), " ");
        }
        if (!string.IsNullOrWhiteSpace(categoryName))
        {
            text = text.Replace(categoryName.ToLowerInvariant(), " ");
        }
        var cleaned = NormalizeKey(text);
        return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;
    }
}
