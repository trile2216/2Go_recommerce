using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Listings;

namespace _2GO_EXE_Project.BAL.Validation;

public static class ListingValidator
{
    private const int TitleMaxLength = 255;
    private const int ConditionMaxLength = 50;
    private const int ListingTypeMaxLength = 20;
    private const int DimensionsMaxLength = 255;
    private const int BrandMaxLength = 255;
    private const int MediaUrlMaxLength = 500;
    private const int AttributeNameMaxLength = 255;
    private const int AttributeValueMaxLength = 255;

    public static ValidationResult ValidateCreate(CreateSellerListingRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            result.Add("title", "Title is required.");
        }
        else if (request.Title.Trim().Length > TitleMaxLength)
        {
            result.Add("title", "Title must be <= 255 chars.");
        }

        if (!request.Price.HasValue || request.Price.Value < 0)
        {
            result.Add("price", "Price must be >= 0.");
        }

        if (!string.IsNullOrWhiteSpace(request.Condition) && request.Condition.Trim().Length > ConditionMaxLength)
        {
            result.Add("condition", "Condition must be <= 50 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.ListingType) && request.ListingType.Trim().Length > ListingTypeMaxLength)
        {
            result.Add("listingType", "ListingType must be <= 20 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.Dimensions) && request.Dimensions.Trim().Length > DimensionsMaxLength)
        {
            result.Add("dimensions", "Dimensions must be <= 255 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.Brand) && request.Brand.Trim().Length > BrandMaxLength)
        {
            result.Add("brand", "Brand must be <= 255 chars.");
        }

        if (request.Weight.HasValue && request.Weight.Value <= 0)
        {
            result.Add("weight", "Weight must be greater than 0.");
        }

        var mediaResult = ValidateMedia(request.Media);
        result.Merge(mediaResult);

        var attributesResult = ValidateAttributes(request.Attributes);
        result.Merge(attributesResult);

        return result;
    }

    public static ValidationResult ValidateUpdate(UpdateSellerListingRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Title) && request.Title.Trim().Length > TitleMaxLength)
        {
            result.Add("title", "Title must be <= 255 chars.");
        }

        if (request.Price.HasValue && request.Price.Value < 0)
        {
            result.Add("price", "Price must be >= 0.");
        }

        if (!string.IsNullOrWhiteSpace(request.Condition) && request.Condition.Trim().Length > ConditionMaxLength)
        {
            result.Add("condition", "Condition must be <= 50 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.ListingType) && request.ListingType.Trim().Length > ListingTypeMaxLength)
        {
            result.Add("listingType", "ListingType must be <= 20 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.Dimensions) && request.Dimensions.Trim().Length > DimensionsMaxLength)
        {
            result.Add("dimensions", "Dimensions must be <= 255 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.Brand) && request.Brand.Trim().Length > BrandMaxLength)
        {
            result.Add("brand", "Brand must be <= 255 chars.");
        }

        if (request.Weight.HasValue && request.Weight.Value <= 0)
        {
            result.Add("weight", "Weight must be greater than 0.");
        }

        result.Merge(ValidateAttributes(request.Attributes));
        return result;
    }

    public static ValidationResult ValidateMedia(IReadOnlyList<ListingMediaRequest>? mediaRequests)
    {
        var result = new ValidationResult();
        if (mediaRequests == null || mediaRequests.Count == 0)
        {
            result.Add("media", "At least one media item is required.");
            return result;
        }

        var primaryImageCount = 0;
        for (var i = 0; i < mediaRequests.Count; i++)
        {
            var item = mediaRequests[i];
            if (string.IsNullOrWhiteSpace(item.Url))
            {
                result.Add($"media[{i}].url", "Media url is required.");
            }
            else if (item.Url.Trim().Length > MediaUrlMaxLength)
            {
                result.Add($"media[{i}].url", "Media url must be <= 500 chars.");
            }

            if (!string.IsNullOrWhiteSpace(item.MediaType) && item.MediaType.Trim().Length > ListingTypeMaxLength)
            {
                result.Add($"media[{i}].mediaType", "MediaType must be <= 20 chars.");
            }

            var normalizedType = string.IsNullOrWhiteSpace(item.MediaType) ? MediaTypes.Image : item.MediaType.Trim();
            if (!MediaTypes.All.Contains(normalizedType, StringComparer.OrdinalIgnoreCase))
            {
                result.Add($"media[{i}].mediaType", $"Invalid media type. Allowed: {string.Join(", ", MediaTypes.All)}.");
            }

            if (string.Equals(normalizedType, MediaTypes.Video, StringComparison.OrdinalIgnoreCase) && item.IsPrimary)
            {
                result.Add($"media[{i}].isPrimary", "Primary media must be an image.");
            }
            if (string.Equals(normalizedType, MediaTypes.Image, StringComparison.OrdinalIgnoreCase) && item.IsPrimary)
            {
                primaryImageCount++;
            }
        }

        if (primaryImageCount > 1)
        {
            result.Add("media", "Only one primary image is allowed.");
        }

        var imageCount = mediaRequests.Count(m => string.IsNullOrWhiteSpace(m.MediaType) || m.MediaType.Equals(MediaTypes.Image, StringComparison.OrdinalIgnoreCase));
        if (imageCount == 0)
        {
            result.Add("media", "At least one image is required.");
        }

        return result;
    }

    private static ValidationResult ValidateAttributes(IReadOnlyList<ListingAttributeRequest>? attributes)
    {
        var result = new ValidationResult();
        if (attributes == null) return result;

        for (var i = 0; i < attributes.Count; i++)
        {
            var item = attributes[i];
            if (string.IsNullOrWhiteSpace(item.Name))
            {
                result.Add($"attributes[{i}].name", "Attribute name is required.");
                continue;
            }

            if (item.Name.Trim().Length > AttributeNameMaxLength)
            {
                result.Add($"attributes[{i}].name", "Attribute name must be <= 255 chars.");
            }
            if (!string.IsNullOrWhiteSpace(item.Value) && item.Value.Trim().Length > AttributeValueMaxLength)
            {
                result.Add($"attributes[{i}].value", "Attribute value must be <= 255 chars.");
            }
        }
        return result;
    }
}
