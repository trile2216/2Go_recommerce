import axios from '../../config/axios';

const BASE_URL = '/admin/dashboard';

/**
 * Get dashboard summary (KPIs) for a given period.
 * @param {string} from - Start date (ISO string or undefined)
 * @param {string} to - End date (ISO string or undefined)
 */
export const getDashboardSummary = async (from = '', to = '') => {
    try {
        const params = {};
        if (from) params.from = from;
        if (to) params.to = to;

        const response = await axios.get(BASE_URL, { params });
        return response.data; // Expected: AdminDashboardResponse (AdminKpiSummary summary)
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        throw error;
    }
};

/**
 * Get dashboard timeseries data for charts.
 * @param {string} from - Start date (ISO string or undefined)
 * @param {string} to - End date (ISO string or undefined)
 * @param {string} bucket - Time bucket ('day', 'week', 'month')
 */
export const getDashboardTimeseries = async (from = '', to = '', bucket = 'day') => {
    try {
        const params = { bucket };
        if (from) params.from = from;
        if (to) params.to = to;

        const response = await axios.get(`${BASE_URL}/timeseries`, { params });
        return response.data; // Expected: AdminTimeseriesResponse (Date From, To, Bucket, Points[])
    } catch (error) {
        console.error('Error fetching dashboard timeseries:', error);
        throw error;
    }
};
