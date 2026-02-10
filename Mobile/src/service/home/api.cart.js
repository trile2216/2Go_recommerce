import api from '../../config/axios';

/**
 * Lấy giỏ hàng của user hiện tại
 * @returns {Promise<{ cartId: number, status: string, createdAt: string, updatedAt: string, groups: Array<{ sellerId: number, items: Array }> }>}
 */
export const fetchCart = async () => {
    try {
        const response = await api.get('/cart');
        return response.data;
    } catch (error) {
        console.error('Error fetching cart:', error);
        throw error;
    }
};

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {number} listingId
 * @param {number} quantity
 * @returns {Promise<CartItemResponse>}
 */
export const addCartItem = async (listingId, quantity = 1) => {
    try {
        const response = await api.post('/cart/items', { listingId, quantity });
        return response.data;
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
};

/**
 * Cập nhật item trong giỏ hàng
 * @param {number} cartItemId
 * @param {{ quantity?: number, note?: string, isSelected?: boolean }} data
 */
export const updateCartItem = async (cartItemId, data) => {
    try {
        const response = await api.put(`/cart/items/${cartItemId}`, data);
        return response.data;
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
};

/**
 * Xóa item khỏi giỏ hàng
 * @param {number} cartItemId
 */
export const removeCartItem = async (cartItemId) => {
    try {
        const response = await api.delete(`/cart/items/${cartItemId}`);
        return response.data;
    } catch (error) {
        console.error('Error removing cart item:', error);
        throw error;
    }
};

/**
 * Xóa toàn bộ giỏ hàng
 */
export const clearCart = async () => {
    try {
        const response = await api.delete('/cart');
        return response.data;
    } catch (error) {
        console.error('Error clearing cart:', error);
        throw error;
    }
};

/**
 * Checkout giỏ hàng
 * @param {string} paymentMethod
 */
export const checkoutCart = async (paymentMethod) => {
    try {
        const response = await api.post('/cart/checkout', { paymentMethod });
        return response.data;
    } catch (error) {
        console.error('Error checking out:', error);
        throw error;
    }
};
