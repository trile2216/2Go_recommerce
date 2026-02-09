namespace _2GO_EXE_Project.BAL.DTOs.Admin;

public record AdminKpiSummary(
    decimal GmvCompleted,
    int OrdersTotal,
    int OrdersCompleted,
    int OrdersCancelled,
    int ListingsNew,
    int ListingsActive,
    int ListingsPendingReview,
    int UsersNew,
    int PaymentsPaid,
    int PaymentsFailed,
    decimal SubscriptionRevenue,
    int ReportsNew);

public record AdminDashboardResponse(
    DateTime From,
    DateTime To,
    AdminKpiSummary Summary);
