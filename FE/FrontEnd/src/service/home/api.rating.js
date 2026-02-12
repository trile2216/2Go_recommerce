import api from '../../config/axios';

/**
 * Tạo đánh giá người bán sau khi đơn hàng hoàn thành
 * @param {Object} data
 * @param {number} data.orderId - ID đơn hàng
 * @param {number} data.score - Điểm đánh giá (1-5)
 * @param {string} [data.comment] - Nhận xét
 * @returns {Promise<UserRatingResponse>}
 */
export const createRating = async ({ orderId, score, comment }) => {
    const response = await api.post('/ratings', { orderId, score, comment });
    return response.data;
};

/**
 * Lấy danh sách đánh giá của tôi
 * @param {number} [skip=0]
 * @param {number} [take=20]
 * @returns {Promise<{ total: number, items: UserRatingResponse[] }>}
 */
export const getMyRatings = async (skip = 0, take = 20) => {
    const response = await api.get('/ratings/me', { params: { skip, take } });
    return response.data;
};

/**
 * Lấy danh sách đánh giá của một người dùng
 * @param {number} userId - ID người dùng
 * @param {number} [skip=0]
 * @param {number} [take=20]
 * @returns {Promise<{ total: number, items: UserRatingResponse[] }>}
 */
export const getRatingsForUser = async (userId, skip = 0, take = 20) => {
    const response = await api.get(`/ratings/users/${userId}`, { params: { skip, take } });
    return response.data;
};
