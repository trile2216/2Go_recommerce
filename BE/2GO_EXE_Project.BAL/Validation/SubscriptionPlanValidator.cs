using _2GO_EXE_Project.BAL.DTOs.Subscriptions;

namespace _2GO_EXE_Project.BAL.Validation;

public static class SubscriptionPlanValidator
{
    public static ValidationResult ValidateCreate(CreateSubscriptionPlanRequest request)
    {
        return ValidatePlan(request.Code, request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder, validateCode: true);
    }

    public static ValidationResult ValidateUpdate(UpdateSubscriptionPlanRequest request)
    {
        return ValidatePlan("DUMMY", request.Name, request.Price, request.DurationDays, request.MonthlyListingLimit, request.SortOrder, validateCode: false);
    }

    public static ValidationResult ValidatePrice(UpdateSubscriptionPlanPriceRequest request)
    {
        var result = new ValidationResult();
        if (request.Price < 0)
        {
            result.Add("price", "Price must be >= 0.");
        }
        return result;
    }

    private static ValidationResult ValidatePlan(string code, string name, decimal price, int durationDays, int? monthlyLimit, int sortOrder, bool validateCode)
    {
        var result = new ValidationResult();
        if (validateCode)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                result.Add("code", "Code is required.");
            }
            else if (code.Trim().Length > 50)
            {
                result.Add("code", "Code must be <= 50 chars.");
            }
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            result.Add("name", "Name is required.");
        }
        else if (name.Trim().Length > 255)
        {
            result.Add("name", "Name must be <= 255 chars.");
        }

        if (price < 0)
        {
            result.Add("price", "Price must be >= 0.");
        }

        if (durationDays <= 0)
        {
            result.Add("durationDays", "DurationDays must be > 0.");
        }

        if (monthlyLimit.HasValue && monthlyLimit.Value <= 0)
        {
            result.Add("monthlyListingLimit", "MonthlyListingLimit must be > 0 when provided.");
        }

        if (sortOrder < 0)
        {
            result.Add("sortOrder", "SortOrder must be >= 0.");
        }

        return result;
    }
}
