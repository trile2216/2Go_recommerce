using _2GO_EXE_Project.BAL.DTOs.Ai;
using _2GO_EXE_Project.BAL.Interfaces;

namespace _2GO_EXE_Project.BAL.Services;

public class NoteGenerationService : INoteGenerationService
{
    public string BuildNote(AiPricingResult pricing, string conditionAi)
    {
        if (pricing.MarketAvg <= 0)
        {
            var reason = string.IsNullOrWhiteSpace(pricing.Reason)
                ? string.Empty
                : $" (Lý do: {pricing.Reason})";
            return $"Không đủ dữ liệu thị trường{reason}. Vui lòng cập nhật thêm thông tin sản phẩm.";
        }

        return $"Sản phẩm được nhận diện: {pricing.DetectedProduct}. " +
               $"Tình trạng AI đánh giá: {conditionAi}. " +
               $"Giá thị trường trung bình khoảng {pricing.MarketAvg:N0} VND. " +
               $"Gợi ý giá bán trong khoảng {pricing.SuggestedMin:N0} - {pricing.SuggestedMax:N0} VND.";
    }
}