// Thêm constants này vào class ErrorMessages hi?n có (ho?c t?o m?i n?u ch?a có)
namespace _2GO_EXE_Project.BAL.Constants;

public static class ErrorMessages
{
    // Comment errors
    public const string INVALID_LISTING = "INVALID_LISTING";
    public const string LISTING_NOT_FOUND = "Không tìm th?y bài dang.";
    
    public const string INVALID_COMMENT = "INVALID_COMMENT";
    public const string COMMENT_NOT_FOUND = "Không tìm th?y bình lu?n.";
    
    public const string INVALID_PARENT_COMMENT = "INVALID_PARENT_COMMENT";
    public const string PARENT_COMMENT_NOT_FOUND = "Parent Không tìm th?y bình lu?n.";
    public const string PARENT_COMMENT_DIFFERENT_LISTING = "Bình lu?n cha thu?c v? bài dang khác.";
    
    public const string FORBIDDEN = "FORBIDDEN";
    public const string NOT_COMMENT_OWNER = "B?n không ph?i là ch? bình lu?n này.";
}
