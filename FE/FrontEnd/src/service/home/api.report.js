import api from '../../config/axios';

/**
 * Tạo báo cáo mới (báo cáo người bán qua đơn hàng)
 * @param {Object} data
 * @param {number} data.orderId - ID đơn hàng liên quan
 * @param {number} [data.targetUserId] - ID người bị báo cáo (tự xác định nếu không truyền)
 * @param {string} data.reason - Lý do báo cáo
 * @returns {Promise<ReportResponse>}
 */
export const createReport = async ({ orderId, targetUserId, reason }) => {
    const response = await api.post('/reports', { orderId, targetUserId, reason });
    return response.data;
};

/**
 * Lấy danh sách báo cáo của tôi
 * @param {number} [skip=0]
 * @param {number} [take=20]
 * @returns {Promise<{ total: number, items: ReportResponse[] }>}
 */
export const getMyReports = async (skip = 0, take = 20) => {
    const response = await api.get('/reports/me', { params: { skip, take } });
    return response.data;
};

/**
 * Phản hồi báo cáo (khi báo cáo đang chờ phản hồi từ bạn)
 * @param {number} reportId - ID báo cáo
 * @param {string} message - Nội dung phản hồi
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const replyReport = async (reportId, message) => {
    const response = await api.post(`/reports/${reportId}/reply`, { message });
    return response.data;
};
