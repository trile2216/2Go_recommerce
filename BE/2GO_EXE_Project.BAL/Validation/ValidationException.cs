using System;
using System.Collections.Generic;

namespace _2GO_EXE_Project.BAL.Validation;

public sealed class ValidationException : Exception
{
    public IReadOnlyList<ValidationError> Errors { get; }
    public string? Code { get; }

    public ValidationException(IReadOnlyList<ValidationError> errors, string? code = null)
        : base(errors.Count > 0 ? errors[0].Message : "Validation failed.")
    {
        Errors = errors;
        Code = code;
    }

    public static ValidationException FromResult(ValidationResult result)
    {
        return new ValidationException(result.Errors);
    }
}
