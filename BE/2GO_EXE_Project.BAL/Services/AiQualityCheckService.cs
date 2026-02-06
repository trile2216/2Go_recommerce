using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class AiQualityCheckService : IAiQualityCheckService
{
    private static readonly string[] ResolutionHints = { "720", "1080", "1440", "2160", "4k", "8k" };

    public Task<AiQualityResult> CheckAsync(IReadOnlyList<string> mediaUrls, CancellationToken cancellationToken = default)
    {
        var issues = new List<string>();
        var score = 1.0;

        if (mediaUrls == null || mediaUrls.Count == 0)
        {
            return Task.FromResult(new AiQualityResult(0, new[] { "No media provided." }, "REJECT"));
        }

        if (mediaUrls.Count < 2)
        {
            score -= 0.1;
            issues.Add("Only 1 media item provided.");
        }

        var hasResolutionHint = mediaUrls.Any(url =>
            ResolutionHints.Any(hint => url.Contains(hint, StringComparison.OrdinalIgnoreCase)));

        if (!hasResolutionHint)
        {
            // TODO: Implement real resolution check by downloading media metadata.
            score -= 0.3;
            issues.Add("Cannot verify resolution >= 720p from URL.");
        }

        if (mediaUrls.Any(url => url.Contains("blur", StringComparison.OrdinalIgnoreCase)))
        {
            // TODO: Replace with blur detection.
            score -= 0.2;
            issues.Add("Possible blurry media detected (placeholder).");
        }

        score = Math.Clamp(score, 0, 1);
        var decision = score >= 0.75 ? "PASS"
            : score >= 0.45 ? "MANUAL_REVIEW"
            : "REJECT";

        return Task.FromResult(new AiQualityResult(score, issues, decision));
    }
}
