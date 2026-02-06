using System.Text.Json;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Chatbot;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.DAL.Context;
using _2GO_EXE_Project.DAL.Entities;
using Microsoft.EntityFrameworkCore;

namespace _2GO_EXE_Project.BAL.Services;

public class ChatbotService : IChatbotService
{
    private readonly AppDbContext _db;
    private readonly string _faqPath;
    private static readonly object LockObj = new();
    private static List<FaqItem>? Cache;

    public ChatbotService(AppDbContext db)
    {
        _db = db;
        _faqPath = ResolveFaqPath();
    }

    public async Task<ChatbotAskResponse> AskAsync(long? userId, ChatbotAskRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
        {
            return new ChatbotAskResponse("Vui lòng nhập câu hỏi.", "LOW", "FAQ_JSON", null);
        }

        var faq = LoadFaq();
        var normalized = Normalize(request.Question);

        var productQuery = ExtractProductQuery(normalized);
        if (!string.IsNullOrWhiteSpace(productQuery))
        {
            var suggestions = await FindListingsAsync(productQuery, cancellationToken);
            if (suggestions.Count > 0)
            {
                var answer = $"Mình tìm thấy {suggestions.Count} sản phẩm liên quan đến \"{productQuery}\".";
                await LogAsync(userId, request.Question, answer, "product_search", "MEDIUM", cancellationToken);
                return new ChatbotAskResponse(answer, "MEDIUM", "LISTINGS", "product_search", suggestions);
            }

            var noResultAnswer = $"Hiện chưa thấy sản phẩm phù hợp với \"{productQuery}\". Bạn có thể cho mình thêm thông tin (hãng, model, giá, tình trạng) không?";
            await LogAsync(userId, request.Question, noResultAnswer, "product_search", "LOW", cancellationToken);
            return new ChatbotAskResponse(noResultAnswer, "LOW", "LISTINGS", "product_search");
        }

        FaqItem? best = null;
        var bestScore = 0.0;
        foreach (var item in faq)
        {
            var score = Score(item, normalized);
            if (score > bestScore)
            {
                bestScore = score;
                best = item;
            }
        }

        string answer;
        string confidence;
        string? intent = null;

        if (best != null && bestScore > 0)
        {
            answer = best.Answer;
            intent = best.Id;
            confidence = bestScore >= 0.6 ? "HIGH" : bestScore >= 0.4 ? "MEDIUM" : "LOW";
        }
        else
        {
            answer = "Mình chưa có thông tin này. Bạn vui lòng liên hệ CSKH để được hỗ trợ thêm.";
            confidence = "LOW";
        }

        await LogAsync(userId, request.Question, answer, intent, confidence, cancellationToken);
        return new ChatbotAskResponse(answer, confidence, "FAQ_JSON", intent);
    }

    private List<FaqItem> LoadFaq()
    {
        if (Cache != null) return Cache;
        lock (LockObj)
        {
            if (Cache != null) return Cache;
            if (string.IsNullOrWhiteSpace(_faqPath) || !File.Exists(_faqPath))
            {
                Cache = new List<FaqItem>();
                return Cache;
            }

            var json = File.ReadAllText(_faqPath);
            Cache = JsonSerializer.Deserialize<List<FaqItem>>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? new List<FaqItem>();
            return Cache;
        }
    }

    private static double Score(FaqItem item, string question)
    {
        if (item.Keywords == null || item.Keywords.Count == 0) return 0;
        var hits = item.Keywords.Count(k => question.Contains(Normalize(k), StringComparison.OrdinalIgnoreCase));
        return (double)hits / item.Keywords.Count;
    }

    private static string Normalize(string input)
    {
        return string.Join(" ", input.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private static string? ExtractProductQuery(string normalized)
    {
        var triggers = new[]
        {
            "tôi cần",
            "toi can",
            "cần mua",
            "can mua",
            "muốn mua",
            "muon mua",
            "tìm",
            "tim",
            "mua",
            "cần"
        };

        foreach (var trigger in triggers)
        {
            var idx = normalized.IndexOf(trigger, StringComparison.Ordinal);
            if (idx < 0) continue;

            var after = normalized[(idx + trigger.Length)..].Trim();
            if (after.StartsWith("sản phẩm "))
            {
                after = after["sản phẩm ".Length..].Trim();
            }
            else if (after.StartsWith("san pham "))
            {
                after = after["san pham ".Length..].Trim();
            }

            if (after.Length >= 2)
            {
                return after;
            }
        }

        return null;
    }

    private async Task<List<ChatbotListingSuggestion>> FindListingsAsync(string term, CancellationToken cancellationToken)
    {
        var lowerTerm = term.ToLowerInvariant();
        var query = _db.Listings.AsNoTracking()
            .Where(l => l.Status == ListingStatuses.Active);

        query = query.Where(l =>
            (l.Title != null && l.Title.ToLower().Contains(lowerTerm)) ||
            (l.Description != null && l.Description.ToLower().Contains(lowerTerm)) ||
            (l.Brand != null && l.Brand.ToLower().Contains(lowerTerm)));

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new ChatbotListingSuggestion(
                l.ListingId,
                l.Title ?? "Sản phẩm",
                l.Price,
                l.Condition,
                l.Brand))
            .Take(5)
            .ToListAsync(cancellationToken);
    }

    private static string ResolveFaqPath()
    {
        var baseDir = AppContext.BaseDirectory;
        var current = new DirectoryInfo(baseDir);
        for (var i = 0; i < 5 && current != null; i++)
        {
            var candidate = Path.Combine(current.FullName, "Data", "chatbot_faq.json");
            if (File.Exists(candidate)) return candidate;
            current = current.Parent;
        }
        return string.Empty;
    }

    private async Task LogAsync(long? userId, string question, string answer, string? intent, string confidence, CancellationToken cancellationToken)
    {
        try
        {
            var log = new ChatbotLog
            {
                UserId = userId,
                Question = question,
                Answer = answer,
                MatchedIntent = intent,
                Confidence = confidence,
                CreatedAt = DateTime.UtcNow
            };
            _db.ChatbotLogs.Add(log);
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // ignore logging failures
        }
    }

    private sealed class FaqItem
    {
        public string Id { get; set; } = "";
        public string Question { get; set; } = "";
        public string Answer { get; set; } = "";
        public List<string> Keywords { get; set; } = new();
    }
}
