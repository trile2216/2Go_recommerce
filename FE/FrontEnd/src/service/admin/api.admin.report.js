import axios from '../../config/axios';

const BASE_URL = '/admin/reports';

/**
 * Get reports with filters.
 * @param {object} params - { status, skip, take }
 */
export const getReports = async (params = {}) => {
    try {
        const response = await axios.get(BASE_URL, { params });
        return response.data; // Expected: ModeratorReportListResponse
    } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
    }
};

/**
 * Get report by ID.
 * @param {number} id 
 */
export const getReportById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data; // Expected: ReportDetail
    } catch (error) {
        console.error(`Error fetching report ${id}:`, error);
        throw error;
    }
};

/**
 * Resolve a report.
 * @param {number} id 
 * @param {object} data - { status, waitingForRole, decision, note }
 */
export const resolveReport = async (id, data) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}/resolve`, data);
        return response.data; // Expected: BasicResponse
    } catch (error) {
        console.error(`Error resolving report ${id}:`, error);
        throw error;
    }
};
