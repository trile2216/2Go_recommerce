using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;

namespace _2GO_EXE_Project.BAL.Services;

public class AiListingService : IAiListingService
{
    private readonly IAiQualityCheckService _qualityCheckService;
    private readonly IMarketPriceService _marketPriceService;
    private readonly IPricingService _pricingService;
    private readonly IModerationService _moderationService;
    private readonly INoteGenerationService _noteGenerationService;
    private readonly AppDbContext _db;

    public AiListingService(
        IAiQualityCheckService qualityCheckService,
        IMarketPriceService marketPriceService,
        IPricingService pricingService,
        IModerationService moderationService,
        INoteGenerationService noteGenerationService,
        AppDbContext db)
    {
        _qualityCheckService = qualityCheckService;
        _marketPriceService = marketPriceService;
        _pricingService = pricingService;
        _moderationService = moderationService;
        _noteGenerationService = noteGenerationService;
        _db = db;
    }

    public async Task<AiListingAnalyzeResponse> AnalyzeAsync(AiListingAnalyzeRequest request, CancellationToken cancellationToken = default)
    {
        var quality = await _qualityCheckService.CheckAsync(request.MediaUrls, cancellationToken);

        var detectedProduct = await BuildQueryAsync(request, cancellationToken);
        var market = await _marketPriceService.AnalyzeMarketAsync(detectedProduct, cancellationToken);

        var conditionAi = InferCondition(request.Title, request.Description);
        var pricing = market with { ConditionAI = conditionAi };
        pricing = _pricingService.BuildSuggestedRange(pricing);

        var risk = _moderationService.AnalyzeRisk(request.Title, request.Description, request.Price, pricing.SuggestedMin);
        var note = _noteGenerationService.BuildNote(pricing, conditionAi);

        var recommendation = ResolveRecommendation(quality, risk);

        var response = new AiListingAnalyzeResponse(quality, pricing, risk, note, recommendation);
        await LogAnalysisAsync(request, response, cancellationToken);
        await QueueManualReviewIfNeededAsync(request, response, cancellationToken);
        return response;
    }

    private async Task<string> BuildQueryAsync(AiListingAnalyzeRequest request, CancellationToken cancellationToken)
    {
        var brand = request.Brand?.Trim();
        var categoryName = await _db.Categories
            .Where(x => x.CategoryId == request.CategoryId)
            .Select(x => x.Name)
            .FirstOrDefaultAsync(cancellationToken);

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(brand)) parts.Add(brand);
        if (!string.IsNullOrWhiteSpace(categoryName)) parts.Add(categoryName);
        if (parts.Count == 0) parts.Add(request.Title);
        parts.Add("giá mới");
        return NormalizeQuery(string.Join(" ", parts));
    }

    private static string NormalizeQuery(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        return Regex.Replace(input, @"\s+", " ").Trim();
    }

    private static string InferCondition(string title, string description)
    {
        var text = $"{title} {description}".ToLowerInvariant();
        if (text.Contains("má»›i") || text.Contains("like new") || text.Contains("99%"))
        {
            return "EXCELLENT";
        }
        if (text.Contains("xÆ°á»›c") || text.Contains("tráº§y") || text.Contains("cÅ©"))
        {
            return "FAIR";
        }
        if (text.Contains("há»ng") || text.Contains("lá»—i"))
        {
            return "POOR";
        }
        return "GOOD";
    }

    private static string ResolveRecommendation(AiQualityResult quality, AiRiskResult risk)
    {
        if (quality.Decision == "REJECT")
        {
            return AiListingRecommendations.RejectedDraft;
        }

        if (quality.Decision == "MANUAL_REVIEW" || risk.Action is "REVIEW" or "BLOCK")
        {
            return AiListingRecommendations.PendingReview;
        }

        return AiListingRecommendations.Published;
    }

    private async Task LogAnalysisAsync(AiListingAnalyzeRequest request, AiListingAnalyzeResponse response, CancellationToken cancellationToken)
    {
        var log = new AiAnalysisLog
        {
            Type = "ListingAnalyze",
            UserId = request.UserId,
            RequestJson = JsonSerializer.Serialize(request),
            ResponseJson = JsonSerializer.Serialize(response),
            CreatedAt = DateTime.UtcNow
        };

        _db.AiAnalysisLogs.Add(log);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task QueueManualReviewIfNeededAsync(AiListingAnalyzeRequest request, AiListingAnalyzeResponse response, CancellationToken cancellationToken)
    {
        if (response.FinalRecommendation != AiListingRecommendations.PendingReview &&
            response.Risk.Action is not "REVIEW" and not "BLOCK" &&
            response.Quality.Decision != "MANUAL_REVIEW")
        {
            return;
        }

        var reasonParts = new List<string>();
        if (response.Quality.Decision != "PASS") reasonParts.Add($"Quality:{response.Quality.Decision}");
        if (response.Risk.Flags.Count > 0) reasonParts.Add(string.Join(",", response.Risk.Flags));

        var queue = new ManualReviewQueue
        {
            ListingId = request.ListingId,
            Reason = string.Join(" | ", reasonParts),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _db.ManualReviewQueues.Add(queue);
        await _db.SaveChangesAsync(cancellationToken);
    }
}