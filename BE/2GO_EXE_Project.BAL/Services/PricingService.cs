using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class PricingService : IPricingService
{
    public AiPricingResult BuildSuggestedRange(AiPricingResult marketResult)
    {
        if (marketResult.MarketAvg <= 0)
        {
            return marketResult;
        }

        var (minRate, maxRate) = marketResult.ConditionAI switch
        {
            "EXCELLENT" => (0.80m, 0.90m),
            "GOOD" => (0.60m, 0.75m),
            "FAIR" => (0.40m, 0.60m),
            "POOR" => (0.20m, 0.40m),
            _ => (0.60m, 0.75m)
        };

        var suggestedMin = Math.Round(marketResult.MarketAvg * minRate, 0);
        var suggestedMax = Math.Round(marketResult.MarketAvg * maxRate, 0);

        return marketResult with
        {
            SuggestedMin = suggestedMin,
            SuggestedMax = suggestedMax
        };
    }
}
