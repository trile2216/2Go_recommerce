namespace _2GO_EXE_Project.BAL.Validation;

public static class ValidationGuard
{
    public static void ThrowIfInvalid(ValidationResult result)
    {
        if (result == null || result.IsValid) return;
        throw ValidationException.FromResult(result);
    }
}
