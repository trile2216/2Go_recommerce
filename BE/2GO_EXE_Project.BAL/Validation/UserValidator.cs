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
            result.Add("email", "Email ho?c s? di?n tho?i là b?t bu?c.");
            result.Add("phone", "Email ho?c s? di?n tho?i là b?t bu?c.");
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            result.AddIf(email.Length > EmailMaxLength, "email", "Email không du?c vu?t quá 255 ký t?.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Email không h?p l?.");
        }

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "S? di?n tho?i không du?c vu?t quá 20 ký t?.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "S? di?n tho?i ph?i g?m dúng 10 ch? s?.");
        }

        if (!IsValidPassword(request.Password))
        {
            result.Add("password", "M?t kh?u ph?i có ít nh?t 8 ký t? và bao g?m ít nh?t 1 ch? cái và 1 ch? s?.");
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            result.AddIf(request.FullName.Trim().Length > FullNameMaxLength, "fullName", "H? tên không du?c vu?t quá 255 ký t?.");
        }

        return result;
    }

    public static ValidationResult ValidateLogin(LoginRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Identifier))
        {
            result.Add("identifier", "Tài kho?n dang nh?p là b?t bu?c.");
            return result;
        }

        var identifier = request.Identifier.Trim();
        var isEmail = ValidationRules.IsValidEmail(identifier);
        var isPhone = ValidationRules.IsValidPhone(identifier);
        result.AddIf(!isEmail && !isPhone, "identifier", "Tài kho?n dang nh?p ph?i là email ho?c s? di?n tho?i h?p l?.");

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            result.Add("password", "M?t kh?u là b?t bu?c.");
        }

        return result;
    }

    public static ValidationResult ValidateVerifyEmail(VerifyEmailRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email là b?t bu?c.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Email không h?p l?.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            result.Add("code", "Mã xác thực là bắt buộc.");
        }

        return result;
    }

    public static ValidationResult ValidateResendVerifyEmail(ResendVerifyEmailRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email là b?t bu?c.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Email không h?p l?.");
        }
        return result;
    }

    public static ValidationResult ValidateForgotPassword(ForgotPasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email là b?t bu?c.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Email không h?p l?.");
        }
        return result;
    }

    public static ValidationResult ValidateResetPassword(ResetPasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            result.Add("email", "Email là b?t bu?c.");
        }
        else
        {
            result.AddIf(!ValidationRules.IsValidEmail(request.Email), "email", "Email không h?p l?.");
        }

        if (string.IsNullOrWhiteSpace(request.Code))
        {
            result.Add("code", "Mã xác thực là bắt buộc.");
        }

        if (!IsValidPassword(request.NewPassword))
        {
            result.Add("newPassword", "M?t kh?u ph?i có ít nh?t 8 ký t? và bao g?m ít nh?t 1 ch? cái và 1 ch? s?.");
        }

        return result;
    }

    public static ValidationResult ValidateRefreshToken(RefreshTokenRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            result.Add("refreshToken", "Refresh token là b?t bu?c.");
        }
        return result;
    }

    public static ValidationResult ValidateFirebaseLogin(FirebaseLoginRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken là b?t bu?c.");
        }
        return result;
    }

    public static ValidationResult ValidateVerifyPhoneFirebase(VerifyPhoneFirebaseRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken là b?t bu?c.");
        }
        return result;
    }

    public static ValidationResult ValidateChangePhoneFirebase(ChangePhoneFirebaseRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            result.Add("idToken", "IdToken là b?t bu?c.");
        }
        return result;
    }

    public static ValidationResult ValidateAdminCreate(AdminCreateUserRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Email) && string.IsNullOrWhiteSpace(request.Phone))
        {
            result.Add("email", "Email ho?c s? di?n tho?i là b?t bu?c.");
            result.Add("phone", "Email ho?c s? di?n tho?i là b?t bu?c.");
        }
        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var email = request.Email.Trim();
            result.AddIf(email.Length > EmailMaxLength, "email", "Email không du?c vu?t quá 255 ký t?.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Email không h?p l?.");
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "S? di?n tho?i không du?c vu?t quá 20 ký t?.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "S? di?n tho?i ph?i g?m dúng 10 ch? s?.");
        }

        if (!UserRoles.All.Contains(request.Role ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("role", "Vai trò không h?p l?. Cho phép: User, Manager, Admin.");
        }

        if (!UserStatuses.All.Contains(request.Status ?? string.Empty, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("status", "Tr?ng thái không h?p l?. Cho phép: Active, Banned, Deleted.");
        }

        if (!string.IsNullOrEmpty(request.Password) && !IsValidPassword(request.Password))
        {
            result.Add("password", "M?t kh?u ph?i có ít nh?t 8 ký t? và bao g?m ít nh?t 1 ch? cái và 1 ch? s?.");
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
            result.AddIf(email.Length > EmailMaxLength, "email", "Email không du?c vu?t quá 255 ký t?.");
            result.AddIf(!ValidationRules.IsValidEmail(email), "email", "Email không h?p l?.");
        }
        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            var phone = request.Phone.Trim();
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "S? di?n tho?i không du?c vu?t quá 20 ký t?.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "S? di?n tho?i ph?i g?m dúng 10 ch? s?.");
        }
        if (!string.IsNullOrWhiteSpace(request.Status) && !UserStatuses.All.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("status", "Tr?ng thái không h?p l?. Cho phép: Active, Banned, Deleted.");
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
            result.AddIf(phone.Length > PhoneMaxLength, "phone", "S? di?n tho?i không du?c vu?t quá 20 ký t?.");
            result.AddIf(!ValidationRules.IsValidPhone(phone), "phone", "S? di?n tho?i ph?i g?m dúng 10 ch? s?.");
        }

        return result;
    }

    public static ValidationResult ValidateUpdateAvatar(UpdateAvatarRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            result.Add("avatarUrl", "AvatarUrl là b?t bu?c.");
            return result;
        }

        var trimmed = request.AvatarUrl.Trim();
        result.AddIf(trimmed.Length > AvatarUrlMaxLength, "avatarUrl", "AvatarUrl không du?c vu?t quá 500 ký t?.");
        return result;
    }

    public static ValidationResult ValidateUpdateAddress(UpdateAddressRequest request)
    {
        var result = new ValidationResult();
        if (request.Address == null && request.CityId == null && request.DistrictId == null && request.WardId == null)
        {
            result.Add("address", "C?n ít nh?t m?t thông tin d?a ch?.");
        }
        if (!string.IsNullOrWhiteSpace(request.Address))
        {
            result.AddIf(request.Address.Trim().Length > AddressMaxLength, "address", "Địa chỉ không được vượt quá 255 ký tự.");
        }
        return result;
    }

    public static ValidationResult ValidateChangePassword(ChangePasswordRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            result.Add("currentPassword", "Current M?t kh?u là b?t bu?c.");
        }
        if (!IsValidPassword(request.NewPassword))
        {
            result.Add("newPassword", "M?t kh?u ph?i có ít nh?t 8 ký t? và bao g?m ít nh?t 1 ch? cái và 1 ch? s?.");
        }
        return result;
    }

    public static ValidationResult ValidateBanUser(BanUserRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            result.Add("reason", "Lý do là b?t bu?c.");
        }
        if (request.DurationDays.HasValue && request.DurationDays.Value <= 0)
        {
            result.Add("durationDays", "DurationDays ph?i l?n hon 0.");
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
            result.AddIf(fullName.Trim().Length > FullNameMaxLength, "fullName", "H? tên không du?c vu?t quá 255 ký t?.");
        }
        if (!string.IsNullOrWhiteSpace(address))
        {
            result.AddIf(address.Trim().Length > AddressMaxLength, "address", "Địa chỉ không được vượt quá 255 ký tự.");
        }
        if (!string.IsNullOrWhiteSpace(avatarUrl))
        {
            result.AddIf(avatarUrl.Trim().Length > AvatarUrlMaxLength, "avatarUrl", "AvatarUrl không du?c vu?t quá 500 ký t?.");
        }
        if (!string.IsNullOrWhiteSpace(bankAccountNumber))
        {
            result.AddIf(bankAccountNumber.Trim().Length > BankAccountNumberMaxLength, "bankAccountNumber", "S? tài kho?n không du?c vu?t quá 50 ký t?.");
        }
        if (!string.IsNullOrWhiteSpace(bankBin))
        {
            var trimmedBin = bankBin.Trim();
            result.AddIf(trimmedBin.Length > BankBinMaxLength, "bankBin", "BankBin không du?c vu?t quá 50 ký t?.");
            result.AddIf(!trimmedBin.All(char.IsDigit), "bankBin", "BankBin ch? du?c ch?a ch? s?.");
        }
        if (!string.IsNullOrWhiteSpace(bankAccountName))
        {
            result.AddIf(bankAccountName.Trim().Length > BankAccountNameMaxLength, "bankAccountName", "Tên ch? tài kho?n không du?c vu?t quá 255 ký t?.");
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



