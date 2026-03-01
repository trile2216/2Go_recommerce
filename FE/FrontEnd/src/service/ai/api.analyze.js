import api from '../../config/axios';

/**
 * Kiểm tra nhanh bài đăng trước khi cho user publish
 * POST /api/ai/listings/precheck
 * 
 * @param {Object} data
 * @param {string} data.title - Tiêu đề bài đăng
 * @param {string} data.description - Mô tả sản phẩm
 * @param {number} data.categoryId - ID danh mục
 * @param {string} [data.brand] - Thương hiệu (optional)
 * @param {number} data.price - Giá bán
 * @param {string[]} data.mediaUrls - URL ảnh/video đã upload
 * @param {string} data.userId - ID người dùng
 * @returns {Promise<{
 *   quality: { score: number, issues: string[], decision: string },
 *   pricing: { detectedProduct: string, marketAvg: number|null, confidence: string, conditionAI: string, suggestedMin: number|null, suggestedMax: number|null },
 *   risk: { riskScore: number, flags: string[], action: string, riskConfidence: string },
 *   note: string,
 *   canPublish: boolean
 * }>}
 */
export const listingPrecheck = async (data) => {
    try {
        const response = await api.post('/ai/listings/precheck', data);
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Gemini quota exceeded. Vui lòng thử lại sau.');
        }
        throw error;
    }
};

/**
 * Phân tích chi tiết bài đăng (Admin/Manager dùng sau khi listing đã tạo)
 * POST /api/ai/listings/analyze
 * Requires: Authorize(Roles = "Admin,Manager")
 * 
 * @param {Object} data
 * @param {string} data.title - Tiêu đề bài đăng
 * @param {string} data.description - Mô tả sản phẩm
 * @param {number} data.categoryId - ID danh mục
 * @param {string} [data.brand] - Thương hiệu (optional)
 * @param {number} [data.year] - Năm sản xuất (optional)
 * @param {number} data.price - Giá bán
 * @param {string[]} data.mediaUrls - URL ảnh/video đã upload
 * @param {string} data.userId - ID người dùng
 * @param {number} data.listingId - ID bài đăng
 * @returns {Promise<{
 *   quality: { score: number, issues: string[], decision: string },
 *   pricing: { detectedProduct: string, marketAvg: number|null, confidence: string, conditionAI: string, suggestedMin: number|null, suggestedMax: number|null },
 *   risk: { riskScore: number, flags: string[], action: string, riskConfidence: string },
 *   note: string,
 *   finalRecommendation: string  // "PUBLISHED" | "PENDING_REVIEW" | "REJECTED_DRAFT"
 * }>}
 */
export const listingAnalyze = async (data) => {
    try {
        const response = await api.post('/ai/listings/analyze', data);
        return response.data;
    } catch (error) {
        if (error.response?.status === 429) {
            throw new Error('Gemini quota exceeded. Vui lòng thử lại sau.');
        }
        throw error;
    }
};