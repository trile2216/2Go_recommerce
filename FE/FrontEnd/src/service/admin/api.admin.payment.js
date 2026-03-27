import api from '../../config/axios';

const BASE_URL = '/admin/payments';

export const getAdminPayments = async (params = {}) => {
    try {
        const response = await api.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching admin payments:', error);
        throw error;
    }
};
