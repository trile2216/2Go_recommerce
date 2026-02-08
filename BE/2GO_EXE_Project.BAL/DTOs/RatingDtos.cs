namespace _2GO_EXE_Project.BAL.DTOs.Ratings;

public record CreateUserRatingRequest(long OrderId, int Score, string? Comment);

public record UserRatingResponse(
    long RatingId,
    long OrderId,
    long RaterId,
    long RatedUserId,
    int Score,
    string? Comment,
    DateTime? CreatedAt);

public record UserRatingListResponse(int Total, IReadOnlyList<UserRatingResponse> Items);
