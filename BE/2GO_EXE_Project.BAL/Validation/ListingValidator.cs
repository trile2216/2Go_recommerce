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
            result.Add("title", "Tiêu d? là b?t bu?c.");
        }
        else if (request.Title.Trim().Length > TitleMaxLength)
        {
            result.Add("title", "Tiêu d? không du?c vu?t quá 255 ký t?.");
        }

        if (!request.Price.HasValue || request.Price.Value < 0)
        {
            result.Add("price", "Giá ph?i l?n hon ho?c b?ng 0.");
        }

        if (!string.IsNullOrWhiteSpace(request.Condition) && request.Condition.Trim().Length > ConditionMaxLength)
        {
            result.Add("condition", "Tình tr?ng không du?c vu?t quá 50 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.ListingType) && request.ListingType.Trim().Length > ListingTypeMaxLength)
        {
            result.Add("listingType", "ListingType không du?c vu?t quá 20 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.Dimensions) && request.Dimensions.Trim().Length > DimensionsMaxLength)
        {
            result.Add("dimensions", "Kích thu?c không du?c vu?t quá 255 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.Brand) && request.Brand.Trim().Length > BrandMaxLength)
        {
            result.Add("brand", "Thuong hi?u không du?c vu?t quá 255 ký t?.");
        }

        if (request.Weight.HasValue && request.Weight.Value <= 0)
        {
            result.Add("weight", "Kh?i lu?ng ph?i l?n hon 0.");
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
            result.Add("title", "Tiêu d? không du?c vu?t quá 255 ký t?.");
        }

        if (request.Price.HasValue && request.Price.Value < 0)
        {
            result.Add("price", "Giá ph?i l?n hon ho?c b?ng 0.");
        }

        if (!string.IsNullOrWhiteSpace(request.Condition) && request.Condition.Trim().Length > ConditionMaxLength)
        {
            result.Add("condition", "Tình tr?ng không du?c vu?t quá 50 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.ListingType) && request.ListingType.Trim().Length > ListingTypeMaxLength)
        {
            result.Add("listingType", "ListingType không du?c vu?t quá 20 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.Dimensions) && request.Dimensions.Trim().Length > DimensionsMaxLength)
        {
            result.Add("dimensions", "Kích thu?c không du?c vu?t quá 255 ký t?.");
        }

        if (!string.IsNullOrWhiteSpace(request.Brand) && request.Brand.Trim().Length > BrandMaxLength)
        {
            result.Add("brand", "Thuong hi?u không du?c vu?t quá 255 ký t?.");
        }

        if (request.Weight.HasValue && request.Weight.Value <= 0)
        {
            result.Add("weight", "Kh?i lu?ng ph?i l?n hon 0.");
        }

        result.Merge(ValidateAttributes(request.Attributes));
        return result;
    }

    public static ValidationResult ValidateMedia(IReadOnlyList<ListingMediaRequest>? mediaRequests)
    {
        var result = new ValidationResult();
        if (mediaRequests == null || mediaRequests.Count == 0)
        {
            result.Add("media", "C?n ít nh?t m?t media.");
            return result;
        }

        var primaryImageCount = 0;
        for (var i = 0; i < mediaRequests.Count; i++)
        {
            var item = mediaRequests[i];
            if (string.IsNullOrWhiteSpace(item.Url))
            {
                result.Add($"media[{i}].url", "Media url là b?t bu?c.");
            }
            else if (item.Url.Trim().Length > MediaUrlMaxLength)
            {
                result.Add($"media[{i}].url", "Media url không du?c vu?t quá 500 ký t?.");
            }

            if (!string.IsNullOrWhiteSpace(item.MediaType) && item.MediaType.Trim().Length > ListingTypeMaxLength)
            {
                result.Add($"media[{i}].mediaType", "MediaType không du?c vu?t quá 20 ký t?.");
            }

            var normalizedType = string.IsNullOrWhiteSpace(item.MediaType) ? MediaTypes.Image : item.MediaType.Trim();
            if (!MediaTypes.All.Contains(normalizedType, StringComparer.OrdinalIgnoreCase))
            {
                result.Add($"media[{i}].mediaType", $"Lo?i media không h?p l?. Cho phép: {string.Join(", ", MediaTypes.All)}.");
            }

            if (string.Equals(normalizedType, MediaTypes.Video, StringComparison.OrdinalIgnoreCase) && item.IsPrimary)
            {
                result.Add($"media[{i}].isPrimary", "Media chính ph?i là ?nh.");
            }
            if (string.Equals(normalizedType, MediaTypes.Image, StringComparison.OrdinalIgnoreCase) && item.IsPrimary)
            {
                primaryImageCount++;
            }
        }

        if (primaryImageCount > 1)
        {
            result.Add("media", "Ch? du?c phép m?t ?nh chính.");
        }

        var imageCount = mediaRequests.Count(m => string.IsNullOrWhiteSpace(m.MediaType) || m.MediaType.Equals(MediaTypes.Image, StringComparison.OrdinalIgnoreCase));
        if (imageCount == 0)
        {
            result.Add("media", "C?n ít nh?t m?t ?nh.");
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
                result.Add($"attributes[{i}].name", "Tên thu?c tính là b?t bu?c.");
                continue;
            }

            if (item.Name.Trim().Length > AttributeNameMaxLength)
            {
                result.Add($"attributes[{i}].name", "Tên thu?c tính không du?c vu?t quá 255 ký t?.");
            }
            if (!string.IsNullOrWhiteSpace(item.Value) && item.Value.Trim().Length > AttributeValueMaxLength)
            {
                result.Add($"attributes[{i}].value", "Giá tr? thu?c tính không du?c vu?t quá 255 ký t?.");
            }
        }
        return result;
    }
}

