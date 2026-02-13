namespace _2GO_EXE_Project.BAL.Constants;

public static class ReportNotificationText
{
    public static (string Title, string Message) ForStatus(string? status, long reportId)
    {
        var normalized = status?.Trim();
        return normalized switch
        {
            ReportStatuses.WaitingOtherParty => ("Report update", $"Report #{reportId} is waiting for your response."),
            ReportStatuses.Resolved => ("Report update", $"Report #{reportId} has been resolved."),
            ReportStatuses.Rejected => ("Report update", $"Report #{reportId} was rejected."),
            ReportStatuses.InReview => ("Report update", $"Report #{reportId} is under review."),
            ReportStatuses.Open => ("Report update", $"Report #{reportId} was opened."),
            _ => ("Report update", $"Report #{reportId} was updated.")
        };
    }
}
