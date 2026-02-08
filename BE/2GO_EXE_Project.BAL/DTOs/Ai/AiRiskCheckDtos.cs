namespace _2GO_EXE_Project.BAL.DTOs.Ai;

public record AiRiskCheckRequest(
    string Title,
    string Description,
    decimal? Price,
    decimal? SuggestedMin,
    decimal? SuggestedMax,
    int AccountAgeDays,
    int RecentListingsCount,
    int TotalListingsCount,
    int CompletedSalesCount,
    int ReportsCount,
    int DeviceCount,
    bool PhoneVerified,
    bool EmailVerified);
