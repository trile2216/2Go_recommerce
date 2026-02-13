namespace _2GO_EXE_Project.BAL.Constants;

public static class OrderNotificationText
{
    public static (string Title, string Message) ForStatus(string? status, long orderId)
    {
        var normalized = status?.Trim();
        return normalized switch
        {
            OrderStatuses.Pending => ("Order status", $"Order #{orderId} is pending."),
            OrderStatuses.Confirmed => ("Order status", $"Order #{orderId} was confirmed."),
            OrderStatuses.Completed => ("Order status", $"Order #{orderId} was completed."),
            OrderStatuses.Cancelled => ("Order status", $"Order #{orderId} was cancelled."),
            OrderStatuses.Disputed => ("Order status", $"Order #{orderId} is now in dispute."),
            _ => ("Order status", $"Order #{orderId} status was updated.")
        };
    }
}
