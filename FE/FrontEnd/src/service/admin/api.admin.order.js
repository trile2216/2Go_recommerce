import axios from '../../config/axios';

const BASE_URL = '/admin/orders';

/**
 * Get orders with filters.
 * @param {object} params - { status, buyerId, sellerId, orderCode, from, to, skip, take }
 * Status values: Pending | Confirmed | Delivered | Completed | Cancelled | Disputed
 * @returns {Promise<{ total: number, items: OrderListItem[] }>}
 * OrderListItem includes: orderId, listingId, buyerId, sellerId, orderCode,
 *   paymentLinkId, totalAmount, paymentMethod, status, checkoutUrl, qrCodeUrl,
 *   paymentExpiredAt, createdAt, listingTitle, listingPrice, deliveryAddress
 */
export const getOrders = async (params = {}) => {
    try {
        const response = await axios.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

/**
 * Get order by ID.
 * @param {number} orderId 
 * @returns {Promise<OrderDetailResponse>} - includes depositRequired (bool),
 *   depositPaid (bool), escrowStatus (string), depositAmount, depositDeadlineAt,
 *   buyerEmail, buyerPhone, sellerEmail, sellerPhone
 */
export const getOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${BASE_URL}/${orderId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching order ${orderId}:`, error);
        throw error;
    }
};

/**
 * Update order status.
 * @param {number} orderId 
 * @param {string} status - Pending | Confirmed | Delivered | Completed | Cancelled
 * @param {string} reason 
 */
export const updateOrderStatus = async (orderId, status, reason) => {
    try {
        const response = await axios.put(`${BASE_URL}/${orderId}/status`, { status, reason });
        return response.data;
    } catch (error) {
        console.error(`Error updating order status ${orderId}:`, error);
        throw error;
    }
};
