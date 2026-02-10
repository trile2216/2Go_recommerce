import api from '../../config/axios';

/**
 * Kiểm tra nhanh bài đăng trước khi cho user publish
 * @param {Object} data
 * @param {string} data.title - Tiêu đề bài đăng
 * @param {string} data.description - Mô tả sản phẩm
 * @param {number} data.categoryId - ID danh mục
 * @param {string} [data.brand] - Thương hiệu (optional)
 * @param {number} data.price - Giá bán
 * @param {string[]} data.mediaUrls - URL ảnh/video đã upload
 * @param {string} data.userId - ID người dùng
 * @returns {Promise<{
 *   canPublish: boolean,
 *   quality: object,
 *   pricing: object,
 *   risk: object,
 *   note: string
 * }>}
 */
export const listingPrecheck = async (data) => {
    try {
        const response = await api.post('/ai/listings/precheck', data);
        return response.data;
    } catch (error) {
        console.error('Error performing listing precheck:', error);
        throw error;
    }
};

/**
 * Phân tích chi tiết bài đăng (sau khi đã tạo listing)
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
 * @returns {Promise<object>}
 */
export const listingAnalyze = async (data) => {
    try {
        const response = await api.post('/ai/analyze/listing', data);
        return response.data;
    } catch (error) {
        console.error('Error performing listing analysis:', error);
        throw error;
    }
};

/**
 * Kiểm tra rủi ro bài đăng
 * @param {Object} data
 * @param {string} data.title - Tiêu đề bài đăng
 * @param {string} data.description - Mô tả sản phẩm
 * @param {number} data.price - Giá bán
 * @param {number} data.suggestedMin - Giá đề xuất tối thiểu
 * @param {number} data.suggestedMax - Giá đề xuất tối đa
 * @param {number} data.accountAgeDays - Số ngày tài khoản đã tồn tại
 * @param {number} data.recentListingsCount - Số bài đăng gần đây
 * @param {number} data.totalListingsCount - Tổng số bài đăng
 * @param {number} data.completedSalesCount - Số giao dịch hoàn thành
 * @param {number} data.reportsCount - Số lần bị report
 * @param {number} data.deviceCount - Số thiết bị đăng nhập
 * @param {boolean} data.phoneVerified - Đã xác thực SĐT
 * @param {boolean} data.emailVerified - Đã xác thực email
 * @returns {Promise<object>}
 */
export const listingRiskCheck = async (data) => {
    try {
        const response = await api.post('/ai/listings/risk-check', data);
        return response.data;
    } catch (error) {
        console.error('Error performing listing risk check:', error);
        throw error;
    }
};