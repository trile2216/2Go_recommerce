import api from '../../config/axios';

// ─── Basic Shipping ─────────────────────────────────────────

/**
 * Tạo yêu cầu vận chuyển (manual / COD)
 * POST /api/shipping
 * @param {{ orderId: number, provider: string, pickupAddress: string, deliveryAddress?: string }} data
 */
export const createShipping = async (data) => {
    const response = await api.post('/shipping', data);
    return response.data;
};

/**
 * Lấy thông tin vận chuyển theo orderId
 * GET /api/shipping/order/:orderId
 * @param {number} orderId
 */
export const getShippingByOrder = async (orderId) => {
    const response = await api.get(`/shipping/order/${orderId}`);
    return response.data;
};

/**
 * Cập nhật trạng thái vận chuyển (seller)
 * PUT /api/shipping/:shipId/status
 * @param {number} shipId
 * @param {{ status: string, trackingCode?: string }} data
 */
export const updateShippingStatus = async (shipId, data) => {
    const response = await api.put(`/shipping/${shipId}/status`, data);
    return response.data;
};

// ─── GHN Integration ────────────────────────────────────────

/**
 * Tạo đơn GHN
 * POST /api/shipping/ghn
 * @param {CreateGhnShippingRequest} data
 */
export const createGhnShipping = async (data) => {
    const response = await api.post('/shipping/ghn', data);
    return response.data;
};

/**
 * Lấy danh sách tỉnh/thành GHN
 * GET /api/shipping/ghn/provinces
 */
export const getGhnProvinces = async () => {
    const response = await api.get('/shipping/ghn/provinces');
    return response.data;
};

/**
 * Lấy danh sách quận/huyện GHN theo provinceId
 * GET /api/shipping/ghn/districts?provinceId=
 * @param {number} provinceId
 */
export const getGhnDistricts = async (provinceId) => {
    const response = await api.get('/shipping/ghn/districts', { params: { provinceId } });
    return response.data;
};

/**
 * Lấy danh sách phường/xã GHN theo districtId
 * GET /api/shipping/ghn/wards?districtId=
 * @param {number} districtId
 */
export const getGhnWards = async (districtId) => {
    const response = await api.get('/shipping/ghn/wards', { params: { districtId } });
    return response.data;
};

/**
 * Tính phí vận chuyển GHN
 * POST /api/shipping/ghn/fee
 * @param {GhnFeeRequest} data
 */
export const getGhnFee = async (data) => {
    const response = await api.post('/shipping/ghn/fee', data);
    return response.data;
};

/**
 * Hủy đơn GHN
 * POST /api/shipping/ghn/cancel
 * @param {{ orderCodes: string[] }} data
 */
export const cancelGhnShipping = async (data) => {
    const response = await api.post('/shipping/ghn/cancel', data);
    return response.data;
};

/**
 * Lấy token in nhãn GHN
 * POST /api/shipping/ghn/print-token
 * @param {{ orderCodes: string[] }} data
 */
export const getGhnPrintToken = async (data) => {
    const response = await api.post('/shipping/ghn/print-token', data);
    return response.data;
};
