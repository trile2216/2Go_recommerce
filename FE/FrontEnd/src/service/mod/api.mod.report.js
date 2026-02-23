import api from '../../config/axios';

const BASE_URL = '/mod/reports';

/**
 * Get reports list (Moderator view).
 * @param {object} params - { status?, skip?, take? }
 */
export const getModReports = async (params = {}) => {
    try {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching mod reports:', error);
        throw error;
    }
};

/**
 * Get report detail by ID.
 * @param {number} id
 */
export const getModReportById = async (id) => {
    try {
        const response = await api.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching mod report ${id}:`, error);
        throw error;
    }
};

/**
 * Resolve a report (status transition: Open→InReview→WaitingOtherParty/Resolved/Rejected).
 * @param {number} id
 * @param {{ status?: string, waitingForRole?: string, decision?: string, note?: string }} data
 *   - status: target status (InReview, WaitingOtherParty, Resolved, Rejected)
 *   - waitingForRole: 'Buyer' | 'Seller' (required when status = WaitingOtherParty)
 *   - decision: 'RefundBuyer' | 'ReleaseSeller' (required when status = Resolved)
 *   - note: optional moderator note
 */
export const resolveModReport = async (id, data) => {
    try {
        const response = await api.put(`${BASE_URL}/${id}/resolve`, data);
        return response.data;
    } catch (error) {
        console.error(`Error resolving mod report ${id}:`, error);
        throw error;
    }
};
