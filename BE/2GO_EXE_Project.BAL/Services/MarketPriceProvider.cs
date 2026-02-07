using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.BAL.Services;

public class MarketPriceProvider : IMarketPriceProvider
{
    private const int SampleThreshold = 5;
    private static readonly Regex SpaceRegex = new(@"\s+", RegexOptions.Compiled);
    private readonly AppDbContext _db;
    private readonly ILogger<MarketPriceProvider> _logger;

    public MarketPriceProvider(AppDbContext db, ILogger<MarketPriceProvider> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<MarketPriceResult> GetMarketPriceAsync(MarketPriceInput input, CancellationToken cancellationToken = default)
    {
        var productKey = NormalizeKey(input.ProductKey);
        if (string.IsNullOrWhiteSpace(productKey))
        {
            return Fail("empty_product_key");
        }

        var condition = NormalizeCondition(input.Condition);
        var query = _db.MarketPrices.AsQueryable();
        query = query.Where(x => x.ProductKey == productKey && x.Condition == condition);
        if (input.CategoryId.HasValue)
        {
            var categoryId = input.CategoryId.Value;
            query = query.Where(x => x.CategoryId == categoryId);
        }

        var record = await query.FirstOrDefaultAsync(cancellationToken);
        if (record != null && record.SampleCount >= SampleThreshold && record.AvgPrice > 0)
        {
            var confidence = record.SampleCount >= 10 ? "HIGH" : "MEDIUM";
            return new MarketPriceResult(record.AvgPrice, record.MinPrice, record.MaxPrice, record.SampleCount, "internal_market", confidence, null);
        }

        if (record != null && record.SampleCount > 0)
        {
            return RuleBased(input.ReferencePrice, condition, "insufficient_samples");
        }

        return RuleBased(input.ReferencePrice, condition, "no_data");
    }

    public async Task TrackListingAsync(Listing listing, string source, CancellationToken cancellationToken = default)
    {
        if (listing.Price is null || listing.Price <= 0)
        {
            return;
        }

        var category = await _db.SubCategories
            .Include(sc => sc.Category)
            .Where(sc => sc.SubCategoryId == listing.SubCategoryId)
            .Select(sc => new { sc.CategoryId, CategoryName = sc.Category != null ? sc.Category.Name : null })
            .FirstOrDefaultAsync(cancellationToken);

        var categoryId = category?.CategoryId;
        var productKey = BuildProductKey(listing.Brand, category?.CategoryName, listing.Title);
        if (string.IsNullOrWhiteSpace(productKey))
        {
            return;
        }

        var condition = NormalizeCondition(listing.Condition);
        var record = await _db.MarketPrices.FirstOrDefaultAsync(x =>
                x.ProductKey == productKey &&
                x.CategoryId == categoryId &&
                x.Condition == condition,
            cancellationToken);

        var price = listing.Price.Value;
        if (record == null)
        {
            record = new MarketPrice
            {
                ProductKey = productKey,
                CategoryId = categoryId,
                Condition = condition,
                MinPrice = price,
                MaxPrice = price,
                AvgPrice = price,
                SampleCount = 1,
                Source = source,
                Confidence = "LOW",
                UpdatedAt = DateTime.UtcNow
            };
            _db.MarketPrices.Add(record);
            await _db.SaveChangesAsync(cancellationToken);
            return;
        }

        var newCount = record.SampleCount + 1;
        record.MinPrice = Math.Min(record.MinPrice, price);
        record.MaxPrice = Math.Max(record.MaxPrice, price);
        record.AvgPrice = ((record.AvgPrice * record.SampleCount) + price) / newCount;
        record.SampleCount = newCount;
        record.Source = source;
        record.Confidence = newCount >= 10 ? "HIGH" : newCount >= SampleThreshold ? "MEDIUM" : "LOW";
        record.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    private static MarketPriceResult RuleBased(decimal? referencePrice, string condition, string reason)
    {
        if (!referencePrice.HasValue || referencePrice.Value <= 0)
        {
            return Fail("no_reference_price");
        }

        var (minRate, maxRate) = condition switch
        {
            "NEW" => (0.80m, 0.90m),
            "GOOD" => (0.65m, 0.75m),
            "FAIR" => (0.45m, 0.60m),
            "POOR" => (0.25m, 0.40m),
            _ => (0.65m, 0.75m)
        };

        var min = Math.Round(referencePrice.Value * minRate, 0);
        var max = Math.Round(referencePrice.Value * maxRate, 0);
        var avg = Math.Round((min + max) / 2m, 0);
        return new MarketPriceResult(avg, min, max, 0, "rule_estimation", "LOW", reason);
    }

    private static MarketPriceResult Fail(string reason)
        => new(0, 0, 0, 0, "insufficient_data", "LOW", reason);

    private static string NormalizeCondition(string? condition)
    {
        if (string.IsNullOrWhiteSpace(condition)) return "GOOD";
        var c = condition.Trim().ToUpperInvariant();
        if (c == "EXCELLENT") return "NEW";
        return c is "NEW" or "GOOD" or "FAIR" or "POOR" ? c : "GOOD";
    }

    private static string BuildProductKey(string? brand, string? categoryName, string? title)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(brand)) parts.Add(brand);
        if (!string.IsNullOrWhiteSpace(categoryName)) parts.Add(categoryName);
        if (parts.Count == 0 && !string.IsNullOrWhiteSpace(title)) parts.Add(title);
        return NormalizeKey(string.Join(" ", parts));
    }

    private static string NormalizeKey(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var trimmed = SpaceRegex.Replace(input, " ").Trim();
        return trimmed.ToLowerInvariant();
    }
}
