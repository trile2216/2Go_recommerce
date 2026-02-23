import api from '../../config/axios';

const BASE_URL = '/mod/users';

/**
 * Get users list (Moderator/Manager view - read-only, no edit/delete).
 * @param {object} params - { search?, status?, skip?, take? }
 */
export const getModUsers = async (params = {}) => {
    try {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching mod users:', error);
        throw error;
    }
};

/**
 * Ban a user.
 * @param {number} userId
 * @param {{ reason: string, durationDays?: number }} data
 */
export const banUser = async (userId, data) => {
    try {
        const response = await api.put(`${BASE_URL}/${userId}/ban`, data);
        return response.data;
    } catch (error) {
        console.error(`Error banning user ${userId}:`, error);
        throw error;
    }
};

/**
 * Unban a user.
 * @param {number} userId
 */
export const unbanUser = async (userId) => {
    try {
        const response = await api.put(`${BASE_URL}/${userId}/unban`);
        return response.data;
    } catch (error) {
        console.error(`Error unbanning user ${userId}:`, error);
        throw error;
    }
};
