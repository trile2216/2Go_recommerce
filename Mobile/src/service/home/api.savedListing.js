import api from '../../config/axios';

/**
 * Lấy danh sách bài đăng đã lưu của người dùng hiện tại
 * @param {number} [skip=0]
 * @param {number} [take=20]
 * @returns {Promise<{ total: number, items: SavedListingItem[] }>}
 */
export const getMySavedListings = async (skip = 0, take = 20) => {
    const response = await api.get('/saved-listings', { params: { skip, take } });
    return response.data;
};

/**
 * Kiểm tra trạng thái lưu của một bài đăng
 * @param {number} listingId - Listing ID
 * @returns {Promise<{ listingId: number, isSaved: boolean }>}
 */
export const getSavedStatus = async (listingId) => {
    const response = await api.get(`/saved-listings/${listingId}`);
    return response.data;
};

/**
 * Lưu bài đăng
 * @param {number} listingId - ID bài đăng cần lưu
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const saveListing = async (listingId) => {
    const response = await api.post('/saved-listings', { listingId });
    return response.data;
};

/**
 * Bỏ lưu bài đăng
 * @param {number} listingId - ID bài đăng cần bỏ lưu
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const removeSavedListing = async (listingId) => {
    const response = await api.delete(`/saved-listings/${listingId}`);
    return response.data;
};
