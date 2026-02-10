import api from '../../config/axios';

/**
 * Lấy danh sách bài đăng bán của người dùng hiện tại
 * @param {Object} params
 * @param {string} [params.status] - Lọc theo trạng thái (Draft, Active, Archived, Rejected, Deleted...)
 * @param {number} [params.skip=0]
 * @param {number} [params.take=20]
 * @returns {Promise<{ total: number, items: SellerListingListItem[] }>}
 */
export const getMyListings = async ({ status, skip = 0, take = 20 } = {}) => {
    const params = { skip, take };
    if (status) params.status = status;
    const response = await api.get('/seller/listings', { params });
    return response.data;
};

/**
 * Lấy chi tiết bài đăng bán theo ID
 * @param {number} id - Listing ID
 * @returns {Promise<ListingDetail>}
 */
export const getMyListingById = async (id) => {
    const response = await api.get(`/seller/listings/${id}`);
    return response.data;
};

/**
 * Lấy thống kê bài đăng (lượt xem, lượt lưu, lượt liên hệ)
 * @param {number} id - Listing ID
 * @returns {Promise<{ listingId, views, saves, inquiries }>}
 */
export const getMyListingStats = async (id) => {
    const response = await api.get(`/seller/listings/${id}/stats`);
    return response.data;
};

/**
 * Tạo bài đăng bán mới
 * @param {Object} data
 * @param {string} data.title - Tiêu đề bài đăng (bắt buộc)
 * @param {string} [data.description] - Mô tả
 * @param {number} data.subCategoryId - ID danh mục con (bắt buộc)
 * @param {number} [data.wardId] - ID phường
 * @param {number} [data.price] - Giá (> 0)
 * @param {string} [data.listingType] - "Single"
 * @param {number} [data.availableQuantity] - Số lượng
 * @param {boolean} [data.hasNegotiation] - Cho phép thương lượng
 * @param {string} [data.condition] - Tình trạng
 * @param {string} [data.brand] - Thương hiệu
 * @param {string} [data.dimensions] - Kích thước
 * @param {number} [data.weight] - Cân nặng
 * @param {Array<{ url, mediaType, isPrimary, sortOrder }>} [data.media] - Hình ảnh/video
 * @param {Array<{ name, value }>} [data.attributes] - Thuộc tính bổ sung
 * @param {string} [data.status] - "Draft" hoặc "PendingReview"
 * @returns {Promise<ListingDetail>}
 */
export const createListing = async (data) => {
    const response = await api.post('/seller/listings', data);
    return response.data;
};

/**
 * Cập nhật bài đăng bán (chỉ khi trạng thái Draft hoặc Rejected)
 * @param {number} id - Listing ID
 * @param {Object} data - Các trường cần cập nhật (PATCH)
 * @returns {Promise<ListingDetail>}
 */
export const updateListing = async (id, data) => {
    const response = await api.patch(`/seller/listings/${id}`, data);
    return response.data;
};

/**
 * Đăng bài (chuyển từ Draft/Rejected sang chờ duyệt)
 * @param {number} id - Listing ID
 * @returns {Promise<{ success, message }>}
 */
export const publishListing = async (id) => {
    const response = await api.put(`/seller/listings/${id}/publish`);
    return response.data;
};

/**
 * Lưu trữ bài đăng (chuyển từ Active sang Archived)
 * @param {number} id - Listing ID
 * @returns {Promise<{ success, message }>}
 */
export const archiveListing = async (id) => {
    const response = await api.put(`/seller/listings/${id}/archive`);
    return response.data;
};

/**
 * Xóa bài đăng
 * @param {number} id - Listing ID
 * @returns {Promise<{ success, message }>}
 */
export const deleteListing = async (id) => {
    const response = await api.delete(`/seller/listings/${id}`);
    return response.data;
};

/**
 * Cập nhật media (hình ảnh/video) cho bài đăng
 * @param {number} id - Listing ID
 * @param {Array<{ url, mediaType, isPrimary, sortOrder }>} media - Danh sách media mới
 * @returns {Promise<{ success, message }>}
 */
export const updateListingMedia = async (id, media) => {
    const response = await api.put(`/seller/listings/${id}/media`, { media });
    return response.data;
};
