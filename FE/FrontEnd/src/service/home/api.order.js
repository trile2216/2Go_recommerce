import api from '../../config/axios';

/**
 * Tạo đơn hàng mới
 * @param {number} listingId - ID của listing
 * @param {string} paymentMethod - "COD" | "PayOS"
 * @param {string} deliveryAddress - Địa chỉ giao hàng (bắt buộc)
 * @returns {Promise<OrderResponse>} - includes checkoutUrl, qrCodeUrl for PayOS,
 *   depositRequired, depositPaid, escrowStatus, depositAmount, depositDeadlineAt
 */
export const createOrder = async (listingId, paymentMethod, deliveryAddress) => {
    const response = await api.post('/orders', { listingId, paymentMethod, deliveryAddress });
    return response.data;
};

/**
 * Lấy danh sách đơn hàng của user hiện tại
 * @param {number} skip
 * @param {number} take
 * @returns {Promise<{ total: number, items: OrderListItem[] }>}
 * OrderListItem includes: orderId, listingId, buyerId, sellerId, orderCode,
 *   paymentLinkId, totalAmount, paymentMethod, status (Pending|Confirmed|Shipping|Delivered|Completed|Cancelled),
 *   checkoutUrl, qrCodeUrl, paymentExpiredAt, createdAt, listingTitle, listingPrice, deliveryAddress
 */
export const getMyOrders = async (skip = 0, take = 20) => {
    const response = await api.get('/orders', { params: { skip, take } });
    return response.data;
};

/**
 * Lấy chi tiết đơn hàng
 * @param {number} orderId
 * @returns {Promise<OrderDetailResponse>} - includes depositRequired (bool),
 *   depositPaid (bool), escrowStatus (string), depositAmount, depositDeadlineAt,
 *   buyerEmail, buyerPhone, sellerEmail, sellerPhone
 */
export const getOrderById = async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
};

/**
 * Hủy đơn hàng
 * @param {number} orderId
 * @returns {Promise<BasicResponse>}
 */
export const cancelOrder = async (orderId) => {
    const response = await api.put(`/orders/${orderId}/cancel`);
    return response.data;
};

/**
 * Xác nhận đơn hàng (seller)
 * @param {number} orderId
 * @returns {Promise<BasicResponse>}
 */
export const confirmOrder = async (orderId) => {
    const response = await api.put(`/orders/${orderId}/confirm`);
    return response.data;
};

/**
 * Hoàn thành đơn hàng
 * @param {number} orderId
 * @returns {Promise<BasicResponse>}
 */
export const completeOrder = async (orderId) => {
    const response = await api.put(`/orders/${orderId}/complete`);
    return response.data;
};
