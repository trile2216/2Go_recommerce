import axios from '../../config/axios';

const BASE_URL = '/admin/notifications';

/**
 * Create a new notification.
 * @param {object} data - { title, content, type, userId, userIds, role }
 */
export const createNotification = async (data) => {
    try {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};
