import axios from '../../config/axios';

const BASE_URL = '/admin/notifications';

/**
 * Send a notification to a specific user.
 * @param {object} data - { userId: number, title: string, message: string, type?: string, link?: string }
 * @returns {Promise<{ success: boolean, message: string }>}
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
