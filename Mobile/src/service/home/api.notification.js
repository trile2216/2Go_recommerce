import api from '../../config/axios';

/**
 * Lấy danh sách thông báo của user hiện tại
 * @param {number} skip - Số bản ghi bỏ qua (default 0)
 * @param {number} take - Số bản ghi lấy (default 20)
 * @returns {{ total: number, items: Array<{ notificationId: number, title: string, message: string, type: string, link: string, isRead: boolean, createdAt: string }> }}
 */
export const fetchNotifications = async (skip = 0, take = 20) => {
    try {
        const response = await api.get(`/notifications?skip=${skip}&take=${take}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Đánh dấu 1 thông báo đã đọc
 * @param {number} notificationId
 */
export const markNotificationRead = async (notificationId) => {
    try {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Đánh dấu tất cả thông báo đã đọc
 */
export const markAllNotificationsRead = async () => {
    try {
        const response = await api.put('/notifications/read-all');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};
