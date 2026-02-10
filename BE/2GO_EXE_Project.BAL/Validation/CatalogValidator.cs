using _2GO_EXE_Project.BAL.DTOs.Categories;
using _2GO_EXE_Project.BAL.DTOs.SubCategories;
using _2GO_EXE_Project.BAL.DTOs.Districts;
using _2GO_EXE_Project.BAL.DTOs.Wards;

namespace _2GO_EXE_Project.BAL.Validation;

public static class CatalogValidator
{
    private const int NameMaxLength = 255;
    private const int IconUrlMaxLength = 255;

    public static ValidationResult ValidateCreateCategory(CreateCategoryRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            result.Add("name", "Name is required.");
        }
        else if (request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }

        if (!string.IsNullOrWhiteSpace(request.IconUrl) && request.IconUrl.Trim().Length > IconUrlMaxLength)
        {
            result.Add("iconUrl", "IconUrl must be <= 255 chars.");
        }

        return result;
    }

    public static ValidationResult ValidateUpdateCategory(UpdateCategoryRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        if (!string.IsNullOrWhiteSpace(request.IconUrl) && request.IconUrl.Trim().Length > IconUrlMaxLength)
        {
            result.Add("iconUrl", "IconUrl must be <= 255 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateSubCategory(CreateSubCategoryRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            result.Add("name", "Name is required.");
        }
        else if (request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateUpdateSubCategory(UpdateSubCategoryRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateDistrict(CreateDistrictRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            result.Add("name", "Name is required.");
        }
        else if (request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        if (request.CityId <= 0)
        {
            result.Add("cityId", "CityId must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateUpdateDistrict(UpdateDistrictRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        if (request.CityId.HasValue && request.CityId.Value <= 0)
        {
            result.Add("cityId", "CityId must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateWard(CreateWardRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            result.Add("name", "Name is required.");
        }
        else if (request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        if (request.DistrictId <= 0)
        {
            result.Add("districtId", "DistrictId must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateUpdateWard(UpdateWardRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Name) && request.Name.Trim().Length > NameMaxLength)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }
        if (request.DistrictId.HasValue && request.DistrictId.Value <= 0)
        {
            result.Add("districtId", "DistrictId must be > 0.");
        }
        return result;
    }
}
