using System;
using System.Collections.Generic;

namespace _2GO_EXE_Project.BAL.Validation;

public sealed class ValidationException : Exception
{
    public IReadOnlyList<ValidationError> Errors { get; }

    public ValidationException(IReadOnlyList<ValidationError> errors)
        : base(errors.Count > 0 ? errors[0].Message : "Validation failed.")
    {
        Errors = errors;
    }

    public static ValidationException FromResult(ValidationResult result)
    {
        return new ValidationException(result.Errors);
    }
}
