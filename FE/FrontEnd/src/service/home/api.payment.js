import api from '../../config/axios';

/**
 * Tạo thanh toán cho đơn hàng
 * @param {number} orderId - ID đơn hàng
 * @param {string} method - "COD" | "PayOS"
 * @param {string|null} paymentStage - "DEPOSIT" | "REMAINING" | null
 * @returns {Promise<PaymentResponse>} - includes payUrl for PayOS redirect
 */
export const createPayment = async (orderId, method, paymentStage = null) => {
    const response = await api.post('/payments', { orderId, method, paymentStage });
    return response.data;
};

/**
 * Tạo thanh toán subscription
 * @param {string} method
 * @param {string} planCode
 * @returns {Promise<PaymentResponse>}
 */
export const createSubscriptionPayment = async (method, planCode) => {
    const response = await api.post('/payments/subscription', { method, planCode });
    return response.data;
};

/**
 * Xác minh trạng thái thanh toán
 * @param {number} paymentId
 * @param {string} status - "PAID" | "CANCELLED" | etc.
 * @param {string|null} rawResponse
 * @param {string|null} signature
 * @returns {Promise<BasicResponse>}
 */
export const verifyPayment = async (paymentId, status, rawResponse = null, signature = null) => {
    const response = await api.put(`/payments/${paymentId}/verify`, {
        status,
        rawResponse,
        signature,
    });
    return response.data;
};
