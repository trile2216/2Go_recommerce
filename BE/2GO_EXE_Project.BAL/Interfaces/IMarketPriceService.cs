using _2GO_EXE_Project.BAL.DTOs.Ai;

namespace _2GO_EXE_Project.BAL.Interfaces;

public interface IMarketPriceService
{
    Task<AiPricingResult> AnalyzeMarketAsync(string query, CancellationToken cancellationToken = default);
}
