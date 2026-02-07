using _2GO_EXE_Project.BAL.DTOs.Ai;

namespace _2GO_EXE_Project.BAL.Interfaces;

public interface IAiQualityCheckService
{
    Task<AiQualityResult> CheckAsync(IReadOnlyList<string> mediaUrls, CancellationToken cancellationToken = default);
}
