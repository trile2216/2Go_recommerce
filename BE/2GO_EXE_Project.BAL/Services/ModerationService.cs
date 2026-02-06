using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class ModerationService : IModerationService
{
    private static readonly string[] FraudKeywords =
    {
        "ck trước",
        "không cod",
        "ib riêng",
        "giá rẻ bất ngờ"
    };

    public AiRiskResult AnalyzeRisk(string title, string description, decimal? listingPrice, decimal suggestedMin)
    {
        var flags = new List<string>();
        var risk = 0.0;
        var content = $"{title} {description}".ToLowerInvariant();

        foreach (var keyword in FraudKeywords)
        {
            if (content.Contains(keyword))
            {
                flags.Add($"Keyword:{keyword}");
                risk += 0.25;
            }
        }

        if (listingPrice.HasValue && suggestedMin > 0 && listingPrice.Value < suggestedMin)
        {
            flags.Add("PriceTooLow");
            risk += 0.35;
        }

        // TODO: Duplicate content detection
        // TODO: New user listing frequency

        risk = Math.Clamp(risk, 0, 1);
        var action = risk switch
        {
            > 0.9 => "BLOCK",
            > 0.7 => "REVIEW",
            >= 0.4 => "WARN",
            _ => "ALLOW"
        };

        return new AiRiskResult(risk, flags, action);
    }
}
