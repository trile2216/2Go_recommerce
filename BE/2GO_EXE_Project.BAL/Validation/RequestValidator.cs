using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Carts;
using _2GO_EXE_Project.BAL.DTOs.Chat;
using _2GO_EXE_Project.BAL.DTOs.Listings;
using _2GO_EXE_Project.BAL.DTOs.Orders;
using _2GO_EXE_Project.BAL.DTOs.Payments;
using _2GO_EXE_Project.BAL.DTOs.Reports;
using _2GO_EXE_Project.BAL.DTOs.Ratings;
using _2GO_EXE_Project.BAL.DTOs.Shipping;
using _2GO_EXE_Project.BAL.DTOs.Comments;

namespace _2GO_EXE_Project.BAL.Validation;

public static partial class RequestValidator
{
    private const int ReasonMaxLength = 500;
    private const int EvidenceUrlMaxLength = 500;
    private const int EvidenceMaxCount = 5;
    private const int MessageMaxLength = 1000;
    private const int AddressMaxLength = 255;
    private const int ProviderMaxLength = 50;
    private const int TrackingCodeMaxLength = 100;
    private const int StatusMaxLength = 50;

    public static ValidationResult ValidateCreateOrder(CreateOrderRequest request)
    {
        var result = new ValidationResult();
        if (request.ListingId <= 0)
        {
            result.Add("listingId", "ListingId must be > 0.");
        }
        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            result.Add("paymentMethod", "Payment method is required.");
        }
        if (string.IsNullOrWhiteSpace(request.DeliveryAddress))
        {
            result.Add("deliveryAddress", "Delivery address is required.");
        }
        else if (request.DeliveryAddress.Trim().Length > AddressMaxLength)
        {
            result.Add("deliveryAddress", "Delivery address must be <= 255 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreatePayment(CreatePaymentRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderId <= 0)
        {
            result.Add("orderId", "OrderId must be > 0.");
        }
        if (string.IsNullOrWhiteSpace(request.Method))
        {
            result.Add("method", "Payment method is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.PaymentStage) &&
            !PaymentStages.All.Contains(request.PaymentStage, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("paymentStage", $"Invalid payment stage. Allowed: {string.Join(", ", PaymentStages.All)}.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateSubscriptionPayment(CreateSubscriptionPaymentRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Method))
        {
            result.Add("method", "Payment method is required.");
        }
        if (string.IsNullOrWhiteSpace(request.PlanCode))
        {
            result.Add("planCode", "Plan code is required.");
        }
        return result;
    }

    public static ValidationResult ValidateVerifyPayment(VerifyPaymentRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            result.Add("status", "Status is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status.Trim().Length > StatusMaxLength)
        {
            result.Add("status", "Status must be <= 50 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateShipping(CreateShippingRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderId <= 0)
        {
            result.Add("orderId", "OrderId must be > 0.");
        }
        if (string.IsNullOrWhiteSpace(request.Provider))
        {
            result.Add("provider", "Provider is required.");
        }
        else if (request.Provider.Trim().Length > ProviderMaxLength)
        {
            result.Add("provider", "Provider must be <= 50 chars.");
        }
        if (string.IsNullOrWhiteSpace(request.PickupAddress))
        {
            result.Add("pickupAddress", "Pickup address is required.");
        }
        else if (request.PickupAddress.Trim().Length > AddressMaxLength)
        {
            result.Add("pickupAddress", "Pickup address must be <= 255 chars.");
        }
        if (!string.IsNullOrWhiteSpace(request.DeliveryAddress) && request.DeliveryAddress.Trim().Length > AddressMaxLength)
        {
            result.Add("deliveryAddress", "Delivery address must be <= 255 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateGhnShipping(CreateGhnShippingRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderId <= 0) result.Add("orderId", "OrderId must be > 0.");
        if (string.IsNullOrWhiteSpace(request.ToName)) result.Add("toName", "ToName is required.");
        if (string.IsNullOrWhiteSpace(request.ToPhone))
        {
            result.Add("toPhone", "ToPhone is required.");
        }
        else if (!ValidationRules.IsValidPhone(request.ToPhone))
        {
            result.Add("toPhone", "ToPhone must be exactly 10 digits.");
        }
        if (string.IsNullOrWhiteSpace(request.ToAddress)) result.Add("toAddress", "ToAddress is required.");
        if (string.IsNullOrWhiteSpace(request.ToWardCode)) result.Add("toWardCode", "ToWardCode is required.");
        if (request.ToDistrictId <= 0) result.Add("toDistrictId", "ToDistrictId must be > 0.");
        if (request.Weight <= 0) result.Add("weight", "Weight must be > 0.");
        if (request.Length <= 0) result.Add("length", "Length must be > 0.");
        if (request.Width <= 0) result.Add("width", "Width must be > 0.");
        if (request.Height <= 0) result.Add("height", "Height must be > 0.");
        if (request.ServiceTypeId <= 0) result.Add("serviceTypeId", "ServiceTypeId must be > 0.");
        if (request.PaymentTypeId <= 0) result.Add("paymentTypeId", "PaymentTypeId must be > 0.");
        if (string.IsNullOrWhiteSpace(request.RequiredNote)) result.Add("requiredNote", "RequiredNote is required.");
        if (request.Items == null || request.Items.Count == 0)
        {
            result.Add("items", "At least one item is required.");
            return result;
        }
        for (var i = 0; i < request.Items.Count; i++)
        {
            var item = request.Items[i];
            if (string.IsNullOrWhiteSpace(item.Name))
            {
                result.Add($"items[{i}].name", "Item name is required.");
            }
            if (item.Quantity <= 0) result.Add($"items[{i}].quantity", "Quantity must be > 0.");
            if (item.Weight <= 0) result.Add($"items[{i}].weight", "Weight must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateGhnFee(GhnFeeRequest request)
    {
        var result = new ValidationResult();
        if (request.ToDistrictId <= 0) result.Add("toDistrictId", "ToDistrictId must be > 0.");
        if (string.IsNullOrWhiteSpace(request.ToWardCode)) result.Add("toWardCode", "ToWardCode is required.");
        if (request.Weight <= 0) result.Add("weight", "Weight must be > 0.");
        if (request.FromDistrictId <= 0) result.Add("fromDistrictId", "FromDistrictId must be > 0.");
        if (string.IsNullOrWhiteSpace(request.FromWardCode)) result.Add("fromWardCode", "FromWardCode is required.");
        return result;
    }

    public static ValidationResult ValidateGhnCancel(GhnCancelRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderCodes == null || request.OrderCodes.Count == 0)
        {
            result.Add("orderCodes", "At least one order code is required.");
        }
        return result;
    }

    public static ValidationResult ValidateGhnPrintToken(GhnPrintTokenRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderCodes == null || request.OrderCodes.Count == 0)
        {
            result.Add("orderCodes", "At least one order code is required.");
        }
        return result;
    }

    public static ValidationResult ValidateUpdateShippingStatus(UpdateShippingStatusRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            result.Add("status", "Status is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status.Trim().Length > StatusMaxLength)
        {
            result.Add("status", "Status must be <= 50 chars.");
        }
        if (!string.IsNullOrWhiteSpace(request.TrackingCode) && request.TrackingCode.Trim().Length > TrackingCodeMaxLength)
        {
            result.Add("trackingCode", "TrackingCode must be <= 100 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateAddCartItem(AddCartItemRequest request)
    {
        var result = new ValidationResult();
        if (request.ListingId <= 0) result.Add("listingId", "ListingId must be > 0.");
        if (request.Quantity <= 0) result.Add("quantity", "Quantity must be > 0.");
        return result;
    }

    public static ValidationResult ValidateUpdateCartItem(UpdateCartItemRequest request)
    {
        var result = new ValidationResult();
        if (request.Quantity <= 0) result.Add("quantity", "Quantity must be > 0.");
        return result;
    }

    public static ValidationResult ValidateCheckoutCart(CheckoutCartRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            result.Add("paymentMethod", "Payment method is required.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateChat(CreateChatRequest request)
    {
        var result = new ValidationResult();
        if (request.OtherUserId <= 0)
        {
            result.Add("otherUserId", "OtherUserId must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateSendMessage(SendMessageRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Content) && string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            result.Add("content", "Content or imageUrl is required.");
            result.Add("imageUrl", "Content or imageUrl is required.");
        }
        if (!string.IsNullOrWhiteSpace(request.Content) && request.Content.Trim().Length > MessageMaxLength)
        {
            result.Add("content", "Content must be <= 1000 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateSaveListing(SaveListingRequest request)
    {
        var result = new ValidationResult();
        if (request.ListingId <= 0)
        {
            result.Add("listingId", "ListingId must be > 0.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateReport(CreateReportRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderId <= 0) result.Add("orderId", "OrderId must be > 0.");
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            result.Add("reason", "Reason is required.");
        }
        else if (request.Reason.Trim().Length > ReasonMaxLength)
        {
            result.Add("reason", "Reason must be <= 500 chars.");
        }
        if (request.EvidenceUrls != null)
        {
            if (request.EvidenceUrls.Count > EvidenceMaxCount)
            {
                result.Add("evidenceUrls", $"EvidenceUrls must be <= {EvidenceMaxCount} items.");
            }
            for (var i = 0; i < request.EvidenceUrls.Count; i++)
            {
                var url = request.EvidenceUrls[i];
                if (string.IsNullOrWhiteSpace(url))
                {
                    result.Add($"evidenceUrls[{i}]", "Evidence url is required.");
                    continue;
                }
                if (url.Trim().Length > EvidenceUrlMaxLength)
                {
                    result.Add($"evidenceUrls[{i}]", "Evidence url must be <= 500 chars.");
                }
            }
        }
        return result;
    }

    public static ValidationResult ValidateReplyReport(ReplyReportRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            result.Add("message", "Message is required.");
        }
        else if (request.Message.Trim().Length > MessageMaxLength)
        {
            result.Add("message", "Message must be <= 1000 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateResolveReport(ResolveReportRequest request)
    {
        var result = new ValidationResult();
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status.Trim().Length > StatusMaxLength)
        {
            result.Add("status", "Status must be <= 50 chars.");
        }
        if (!string.IsNullOrWhiteSpace(request.Decision) && request.Decision.Trim().Length > StatusMaxLength)
        {
            result.Add("decision", "Decision must be <= 50 chars.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateRating(CreateUserRatingRequest request)
    {
        var result = new ValidationResult();
        if (request.OrderId <= 0)
        {
            result.Add("orderId", "OrderId must be > 0.");
        }
        if (request.Score < 1 || request.Score > 5)
        {
            result.Add("score", "Score must be between 1 and 5.");
        }
        return result;
    }

    public static ValidationResult ValidateUpdateListingStatus(UpdateListingStatusRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Status))
        {
            result.Add("status", "Status is required.");
        }
        else if (!ListingStatuses.All.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            result.Add("status", $"Invalid listing status. Allowed: {string.Join(", ", ListingStatuses.All)}.");
        }
        return result;
    }

    public static ValidationResult ValidateRejectListing(RejectListingRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            result.Add("reason", "Reason is required.");
        }
        return result;
    }

    public static ValidationResult ValidateFlagListing(FlagListingRequest request)
    {
        var result = new ValidationResult();
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            result.Add("reason", "Reason is required.");
        }
        return result;
    }

    public static ValidationResult ValidateCreateComment(CreateCommentRequest request)
    {
        var result = new ValidationResult();

        if (request.ListingId <= 0)
            result.Add("listingId", "ListingId must be greater than 0.");

        if (string.IsNullOrWhiteSpace(request.Content))
            result.Add("content", "Content is required.");
        else if (request.Content.Length > 2000)
            result.Add("content", "Content must not exceed 2000 characters.");

        if (request.ParentId.HasValue && request.ParentId.Value <= 0)
            result.Add("parentId", "ParentId must be greater than 0 when provided.");

        return result;
    }

    public static ValidationResult ValidateUpdateComment(UpdateCommentRequest request)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(request.Content))
            result.Add("content", "Content is required.");
        else if (request.Content.Length > 2000)
            result.Add("content", "Content must not exceed 2000 characters.");

        return result;
    }
}
