using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.BAL.Settings;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.BAL.Services;

public class MarketPriceService : IMarketPriceService
{
    private static readonly ConcurrentDictionary<string, (DateTime UpdatedAt, AiPricingResult Result)> Cache = new();
    private static readonly Regex PriceRegex = new(
        @"(?<!\d)(\d{1,3}(?:[.,]\d{3})+|\d{6,})(?:\s?)(₫|đ|vnd|VND)?",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private readonly HttpClient _httpClient;
    private readonly GoogleSearchSettings _settings;
    private readonly AppDbContext _db;
    private readonly ILogger<MarketPriceService> _logger;

    public MarketPriceService(HttpClient httpClient, IOptions<GoogleSearchSettings> options, AppDbContext db, ILogger<MarketPriceService> logger)
    {
        _httpClient = httpClient;
        _settings = options.Value ?? new GoogleSearchSettings();
        _db = db;
        _logger = logger;
    }

    public async Task<AiPricingResult> AnalyzeMarketAsync(string query, CancellationToken cancellationToken = default)
    {
        var normalizedQuery = NormalizeQuery(query);
        if (string.IsNullOrWhiteSpace(normalizedQuery))
        {
            return CreateFailure(query, "query_empty");
        }

        _logger.LogInformation("MarketPrice search query: {Query}", normalizedQuery);

        var dbCached = _db.MarketPriceCaches.FirstOrDefault(x => x.ProductKey == normalizedQuery);
        if (dbCached != null && dbCached.AvgPrice > 0 && DateTime.UtcNow - dbCached.LastUpdated < TimeSpan.FromHours(24))
        {
            return new AiPricingResult(normalizedQuery, dbCached.AvgPrice, "GOOD", dbCached.MinPrice, dbCached.MaxPrice, null);
        }

        if (Cache.TryGetValue(normalizedQuery, out var cached) &&
            cached.Result.MarketAvg > 0 &&
            DateTime.UtcNow - cached.UpdatedAt < TimeSpan.FromHours(24))
        {
            return cached.Result;
        }

        if (string.IsNullOrWhiteSpace(_settings.ApiKey) || string.IsNullOrWhiteSpace(_settings.CxId))
        {
            return CreateFailure(normalizedQuery, "missing_google_search_config");
        }

        var url =
            $"https://www.googleapis.com/customsearch/v1?q={Uri.EscapeDataString(normalizedQuery)}&cx={_settings.CxId}&key={_settings.ApiKey}";

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.GetAsync(url, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google CSE request failed for query {Query}", normalizedQuery);
            return CreateFailure(normalizedQuery, "google_api_exception");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        _logger.LogInformation("Google CSE raw response: {Raw}", json);

        if (!response.IsSuccessStatusCode)
        {
            return CreateFailure(normalizedQuery, $"google_api_http_{(int)response.StatusCode}");
        }

        if (!HasItems(json))
        {
            return CreateFailure(normalizedQuery, "no_items");
        }

        var prices = ExtractPricesFromResponse(json);
        _logger.LogInformation("Parsed prices: {Prices}", prices.Count == 0 ? "<none>" : string.Join(", ", prices));

        if (prices.Count == 0)
        {
            return CreateFailure(normalizedQuery, "parse_failed");
        }

        var filtered = FilterOutliers(prices);
        _logger.LogInformation("Filtered prices: {Prices}", filtered.Count == 0 ? "<none>" : string.Join(", ", filtered));

        if (filtered.Count == 0)
        {
            return CreateFailure(normalizedQuery, "filtered_empty");
        }

        var min = filtered.Min();
        var max = filtered.Max();
        var avg = filtered.Average();

        var result = new AiPricingResult(normalizedQuery, avg, "GOOD", min, max, null);
        Cache[normalizedQuery] = (DateTime.UtcNow, result);

        if (dbCached == null)
        {
            dbCached = new MarketPriceCache
            {
                ProductKey = normalizedQuery
            };
            _db.MarketPriceCaches.Add(dbCached);
        }

        dbCached.MinPrice = min;
        dbCached.AvgPrice = avg;
        dbCached.MaxPrice = max;
        dbCached.SourcesJson = null;
        dbCached.LastUpdated = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return result;
    }

    private static string NormalizeQuery(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return Regex.Replace(input, @"\s+", " ").Trim();
    }

    private AiPricingResult CreateFailure(string query, string reason)
        => new(query, 0, "GOOD", 0, 0, reason);

    private static bool HasItems(string json)
    {
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.TryGetProperty("items", out var items) && items.GetArrayLength() > 0;
    }

    private List<decimal> ExtractPricesFromResponse(string json)
    {
        var prices = new List<decimal>();
        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("items", out var items)) return prices;

        foreach (var item in items.EnumerateArray())
        {
            var snippet = item.TryGetProperty("snippet", out var snippetEl) ? snippetEl.GetString() : null;
            var title = item.TryGetProperty("title", out var titleEl) ? titleEl.GetString() : null;
            var text = $"{title} {snippet}";

            if (text.Contains("$", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            foreach (Match match in PriceRegex.Matches(text))
            {
                var raw = match.Groups[1].Value;
                var normalized = raw.Replace(".", string.Empty).Replace(",", string.Empty);
                if (decimal.TryParse(normalized, NumberStyles.Number, CultureInfo.InvariantCulture, out var value))
                {
                    if (value < 100_000)
                    {
                        continue;
                    }

                    prices.Add(value);
                    _logger.LogInformation("Parsed price: {Raw} -> {Value}", raw, value);
                }
            }
        }

        return prices;
    }

    private static List<decimal> FilterOutliers(List<decimal> prices)
    {
        if (prices.Count <= 2) return prices;

        var ordered = prices.OrderBy(x => x).ToList();
        var median = ordered[ordered.Count / 2];
        var lower = median * 0.5m;
        var upper = median * 1.5m;
        return ordered.Where(x => x >= lower && x <= upper).ToList();
    }
}