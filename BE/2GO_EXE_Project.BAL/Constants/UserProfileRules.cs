namespace _2GO_EXE_Project.BAL.Constants;

public static class UserProfileRules
{
    public const int GenderMaxLength = 50;

    public static readonly IReadOnlyList<string> AllowedGenders = new[]
    {
        "Male",
        "Female",
        "Other"
    };

    public static string? Validate(string? gender, DateOnly? birthday)
    {
        if (birthday.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (birthday.Value > today) return "Birthday cannot be in the future.";
            if (birthday.Value < today.AddYears(-120)) return "Birthday is too far in the past.";
        }

        if (!string.IsNullOrWhiteSpace(gender))
        {
            var trimmed = gender.Trim();
            if (trimmed.Length > GenderMaxLength) return "Gender must be <= 50 chars.";
            if (!AllowedGenders.Any(g => string.Equals(g, trimmed, StringComparison.OrdinalIgnoreCase)))
            {
                return $"Invalid gender. Allowed: {string.Join(", ", AllowedGenders)}.";
            }
        }

        return null;
    }
}
