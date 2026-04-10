using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Auth;

namespace _2GO_EXE_Project.BAL.Validation;

public static class UserValidator
{
    private const int EmailMaxLength = 255;
    private const int PhoneMaxLength = 20;
    private const int FullNameMaxLength = 255;
    private const int AvatarUrlMaxLength = 500;
    private const int AddressMaxLength = 255;
    private const int BankAccountNumberMaxLength = 50;
    private const int BankBinMaxLength = 50;
    private const int BankAccountNameMaxLength = 255;

    public static ValidationResult ValidateRegister(RegisterRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Phone))
        {
            result.Add("email", "Email or phone number is required.");
            result.Add("phone", "Email or phone number is required.");
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            result.AddIf(email.Length > EmailMaxLength, "email", "Email must not exceed 255 characters.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Invalid email address.");
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "Phone number must not exceed 20 characters.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "Phone number must be exactly 10 digits.");
        }

        if (!IsValidPassword(request.Password))
        {
            result.Add("password", "Password must be at least 8 characters and include at least 1 letter and 1 number.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            result.AddIf(request.FullName.Trim().Length > FullNameMaxLength, "fullName", "Full name must not exceed 255 characters.");
        }

        return result;
    }

    public static ValidationResult ValidateLogin(LoginRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Identifier))
        {
            result.Add("identifier", "Login identifier is required.");
            return result;
        }

        var identifier = request.Identifier.Trim();
        var isEmail = ValidationRules.IsValidEmail(identifier);
        var isPhone = ValidationRules.IsValidPhone(identifier);
        result.AddIf(!isEmail && !isPhone, "identifier", "Login identifier must be a valid email or phone number.");

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            result.Add("password", "Password is required.");
        }

        return result;
    }

    public static ValidationResult ValidateVerifyEmail(VerifyEmailRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email is required.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Invalid email address.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            result.Add("code", "Verification code is required.");
        }

        return result;
    }

    public static ValidationResult ValidateResendVerifyEmail(ResendVerifyEmailRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email is required.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Invalid email address.");
        }
        return result;
    }

    public static ValidationResult ValidateForgotPassword(ForgotPasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email is required.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Invalid email address.");
        }
        return result;
    }

    public static ValidationResult ValidateResetPassword(ResetPasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email is required.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Invalid email address.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            result.Add("code", "Verification code is required.");
        }

        if (!IsValidPassword(request.NewPassword))
        {
            result.Add("newPassword", "Password must be at least 8 characters and include at least 1 letter and 1 number.");
        }

        return result;
    }

    public static ValidationResult ValidateRefreshToken(RefreshTokenRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            result.Add("refreshToken", "Refresh token is required.");
        }
        return result;
    }

    public static ValidationResult ValidateFirebaseLogin(FirebaseLoginRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken is required.");
        }
        return result;
    }

    public static ValidationResult ValidateVerifyPhoneFirebase(VerifyPhoneFirebaseRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken is required.");
        }
        return result;
    }

    public static ValidationResult ValidateChangePhoneFirebase(ChangePhoneFirebaseRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken is required.");
        }
        return result;
    }

    public static ValidationResult ValidateAdminCreate(AdminCreateUserRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Phone))
        {
            result.Add("email", "Email or phone number is required.");
            result.Add("phone", "Email or phone number is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            result.AddIf(email.Length > EmailMaxLength, "email", "Email must not exceed 255 characters.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Invalid email address.");
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "Phone number must not exceed 20 characters.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "Phone number must be exactly 10 digits.");
        }

        if (!UserRoles.All.Contains(request.Role ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("role", "Invalid role. Allowed: User, Manager, Admin.");
        }

        if (!UserStatuses.All.Contains(request.Status ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("status", "Invalid status. Allowed: Active, Banned, Deleted.");
        }

        if (!string.IsNullOrEmpty(request.Password) && !IsValidPassword(request.Password))
        {
            result.Add("password", "Password must be at least 8 characters and include at least 1 letter and 1 number.");
        }

        result.Merge(ValidateProfileFields(request.FullName, request.Birthday, request.Gender, request.Address, request.Bio, request.AvatarUrl, null, null, null));
        return result;
    }

    public static ValidationResult ValidateAdminUpdate(UpdateUserRequest request)
    {
        var result = new ValidationResult();

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            result.AddIf(email.Length > EmailMaxLength, "email", "Email must not exceed 255 characters.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Invalid email address.");
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "Phone number must not exceed 20 characters.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "Phone number must be exactly 10 digits.");
        }
        if (!string.IsNullOrWhiteSpace(request.Status) && !UserStatuses.All.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("status", "Invalid status. Allowed: Active, Banned, Deleted.");
        }

        result.Merge(ValidateProfileFields(request.FullName, request.Birthday, request.Gender, request.Address, request.Bio, request.AvatarUrl, null, null, null));
        return result;
    }

    public static ValidationResult ValidateUpdateProfile(UpdateProfileRequest request)
    {
        var result = ValidateProfileFields(request.FullName, request.Birthday, request.Gender, request.Address, request.Bio, request.AvatarUrl, request.BankAccountNumber, request.BankBin, request.BankAccountName);

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "Phone number must not exceed 20 characters.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "Phone number must be exactly 10 digits.");
        }

        return result;
    }

    public static ValidationResult ValidateUpdateAvatar(UpdateAvatarRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            result.Add("avatarUrl", "Avatar URL is required.");
            return result;
        }

        var trimmed = request.AvatarUrl.Trim();
        result.AddIf(trimmed.Length > AvatarUrlMaxLength, "avatarUrl", "Avatar URL must not exceed 500 characters.");
        return result;
    }

    public static ValidationResult ValidateUpdateAddress(UpdateAddressRequest request)
    {
        var result = new ValidationResult();
        if (request.Address == null && request.CityId == null && request.DistrictId == null && request.WardId == null)
        {
            result.Add("address", "At least one address field is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            result.AddIf(request.Address.Trim().Length > AddressMaxLength, "address", "Address must not exceed 255 characters.");
        }
        return result;
    }

    public static ValidationResult ValidateChangePassword(ChangePasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            result.Add("currentPassword", "Current password is required.");
        }
        if (!IsValidPassword(request.NewPassword))
        {
            result.Add("newPassword", "Password must be at least 8 characters and include at least 1 letter and 1 number.");
        }
        return result;
    }

    public static ValidationResult ValidateBanUser(BanUserRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            result.Add("reason", "Reason is required.");
        }
        if (request.DurationDays.HasValue && request.DurationDays.Value <= 0)
        {
            result.Add("durationDays", "DurationDays must be greater than 0.");
        }
        return result;
    }

    private static ValidationResult ValidateProfileFields(
        string? fullName,
        DateOnly? birthday,
        string? gender,
        string? address,
        string? bio,
        string? avatarUrl,
        string? bankAccountNumber,
        string? bankBin,
        string? bankAccountName)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            result.AddIf(fullName.Trim().Length > FullNameMaxLength, "fullName", "Full name must not exceed 255 characters.");
        }
        if (!string.IsNullOrWhiteSpace(address))
        {
            result.AddIf(address.Trim().Length > AddressMaxLength, "address", "Address must not exceed 255 characters.");
        }
        if (!string.IsNullOrWhiteSpace(avatarUrl))
        {
            result.AddIf(avatarUrl.Trim().Length > AvatarUrlMaxLength, "avatarUrl", "Avatar URL must not exceed 500 characters.");
        }
        if (!string.IsNullOrWhiteSpace(bankAccountNumber))
        {
            result.AddIf(bankAccountNumber.Trim().Length > BankAccountNumberMaxLength, "bankAccountNumber", "Bank account number must not exceed 50 characters.");
        }
        if (!string.IsNullOrWhiteSpace(bankBin))
        {
            var trimmedBin = bankBin.Trim();
            result.AddIf(trimmedBin.Length > BankBinMaxLength, "bankBin", "Bank BIN must not exceed 50 characters.");
            result.AddIf(!trimmedBin.All(char.IsDigit), "bankBin", "Bank BIN must contain only digits.");
        }
        if (!string.IsNullOrWhiteSpace(bankAccountName))
        {
            result.AddIf(bankAccountName.Trim().Length > BankAccountNameMaxLength, "bankAccountName", "Bank account name must not exceed 255 characters.");
        }

        var normalizedGender = NormalizeGender(gender);
        var profileRulesError = UserProfileRules.Validate(normalizedGender, birthday);
        if (profileRulesError != null)
        {
            result.Add("profile", profileRulesError);
        }

        return result;
    }

    private static bool IsValidPassword(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length < 8) return false;
        var hasLetter = value.Any(char.IsLetter);
        var hasDigit = value.Any(char.IsDigit);
        return hasLetter && hasDigit;
    }

    private static string? NormalizeGender(string? gender)
    {
        if (gender == null) return null;
        var trimmed = gender.Trim();
        return trimmed.Length == 0 ? null : trimmed;
    }
}








