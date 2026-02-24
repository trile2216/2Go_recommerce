import api from '../../config/axios';

export const fetchPlans = async (params = {}) => {
    try {
        const response = await api.get('/admin/subscription-plans', { params });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching plans:', error);
        throw error;
    }
};
export const fetchPlanById = async (id) => {
    try {
        const response = await api.get(`/admin/subscription-plans/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching plan with id ${id}:`, error);
        throw error;
    }
};
export const deletePlanById = async (id) => {
    try {
        const response = await api.delete(`/admin/subscription-plans/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting plan with id ${id}:`, error);
        throw error;
    }
};
export const updatePlanById = async (id, data) => {
    try {
        const response = await api.put(`/admin/subscription-plans/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating plan with id ${id}:`, error);
        throw error;
    }
};
export const updatePlanStatusById = async (id, status) => {
    try {
        const response = await api.put(`/admin/subscription-plans/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`Error updating plan status with id ${id}:`, error);
        throw error;
    }
};
export const updatePlanPriceById = async (id, price) => {
    try {
        const response = await api.put(`/admin/subscription-plans/${id}/price`, { price });
        return response.data;
    } catch (error) {
        console.error(`Error updating plan price with id ${id}:`, error);
        throw error;
    }
};
export const createPlan = async (data) => {
    try {
        const response = await api.post('/admin/subscription-plans', data);
        return response.data;
    } catch (error) {
        console.error('Error creating plan:', error);
        throw error;
    }
};