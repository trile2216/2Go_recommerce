import api from '../../config/axios';

const BASE_URL = '/mod/listings';

/**
 * Get listings list (Moderator view — for review/moderation).
 * @param {object} params - { status?, skip?, take? }
 */
export const getModListings = async (params = {}) => {
    try {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching mod listings:', error);
        throw error;
    }
};

/**
 * Get listing detail by ID.
 * @param {number} id
 */
export const getModListingById = async (id) => {
    try {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching mod listing ${id}:`, error);
        throw error;
    }
};

/**
 * Approve a listing (PendingReview → Active).
 * @param {number} id
 */
export const approveListing = async (id) => {
    try {
        const response = await api.put(`${BASE_URL}/${id}/approve`);
        return response.data;
    } catch (error) {
        console.error(`Error approving listing ${id}:`, error);
        throw error;
    }
};

/**
 * Reject a listing (PendingReview → Rejected).
 * @param {number} id
 * @param {{ reason: string }} data
 */
export const rejectListing = async (id, data) => {
    try {
        const response = await api.put(`${BASE_URL}/${id}/reject`, data);
        return response.data;
    } catch (error) {
        console.error(`Error rejecting listing ${id}:`, error);
        throw error;
    }
};

/**
 * Flag an active listing (Active → Flagged).
 * @param {number} id
 * @param {{ reason: string }} data
 */
export const flagListing = async (id, data) => {
    try {
        const response = await api.put(`${BASE_URL}/${id}/flag`, data);
        return response.data;
    } catch (error) {
        console.error(`Error flagging listing ${id}:`, error);
        throw error;
    }
};
