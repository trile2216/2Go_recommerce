import api from '../../config/axios';

export const createRating = async ({ orderId, score, comment }) => {
    const response = await api.post('/ratings', { orderId, score, comment });
    return response.data;
};

export const getMyRatings = async (skip = 0, take = 20) => {
    const response = await api.get('/ratings/me', { params: { skip, take } });
    return response.data;
};

export const getRatingsForUser = async (userId, skip = 0, take = 20) => {
    const response = await api.get(`/ratings/users/${userId}`, { params: { skip, take } });
    return response.data;
};
