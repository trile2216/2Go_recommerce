import api from '../../config/axios';

const BASE_URL = '/admin/payouts';

/**
 * Get forfeit payouts with optional filters.
 * @param {object} params - { status?, sellerId?, orderId?, skip?, take? }
 * @returns {{ total: number, items: AdminPayoutItem[] }}
 */
export const getForfeitPayouts = async (params = {}) => {
    try {
        const response = await api.get(`${BASE_URL}/forfeit`, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching forfeit payouts:', error);
        throw error;
    }
};

/**
 * Retry a failed forfeit payout.
 * @param {number} escrowId - The escrow ID to retry
 * @returns {{ success: boolean }}
 */
export const retryForfeitPayout = async (escrowId) => {
    try {
        const response = await api.post(`${BASE_URL}/forfeit/retry`, { escrowId });
        return response.data;
    } catch (error) {
        console.error('Error retrying forfeit payout:', error);
        throw error;
    }
};
