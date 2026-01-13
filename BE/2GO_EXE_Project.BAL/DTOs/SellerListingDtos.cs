namespace _2GO_EXE_Project.BAL.DTOs.Listings;

public record SellerListingListItem(
    long ListingId,
    string? Title,
    decimal? Price,
    string? Status,
    DateTime? CreatedAt,
    DateTime? UpdatedAt,
    string? PrimaryImageUrl);

public record SellerListingListResponse(int Total, IReadOnlyList<SellerListingListItem> Items);

public record ListingImageRequest(string ImageUrl, bool IsPrimary);
public record ListingAttributeRequest(string Name, string Value);

public record CreateSellerListingRequest(
    string Title,
    string? Description,
    int SubCategoryId,
    int? WardId,
    decimal? Price,
    bool? HasNegotiation,
    string? Condition,
    string? Brand,
    string? Dimensions,
    double? Weight,
    IReadOnlyList<ListingImageRequest>? Images,
    IReadOnlyList<ListingAttributeRequest>? Attributes);

public record UpdateSellerListingRequest(
    string? Title,
    string? Description,
    int? SubCategoryId,
    int? WardId,
    decimal? Price,
    bool? HasNegotiation,
    string? Condition,
    string? Brand,
    string? Dimensions,
    double? Weight,
    IReadOnlyList<ListingAttributeRequest>? Attributes);

public record UpdateListingImagesRequest(IReadOnlyList<ListingImageRequest> Images);
