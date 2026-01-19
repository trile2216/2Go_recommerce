import api from '../config/axios';

export const fetchCustomers = async () => {
    try {
        const response = await api.get('/admin/users?skip=0&take=20');
        return response.data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};
export const fetchCustomerById = async (id) => {
    try {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching customer with id ${id}:`, error);
        throw error;
    }
};
export const deleteCustomerById = async (id) => {
    try {
        const response = await api.delete(`/admin/users/${id}`);  
        return response.data;
    } catch (error) {
        console.error(`Error deleting customer with id ${id}:`, error);
        throw error;
    }
};
export const updateCustomerById = async (id, data) => {
    try {
        const response = await api.put(`/admin/users/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating customer with id ${id}:`, error);
        throw error;
    }   
};
export const updateCustomerRoleById = async (id, role) => {
    try {
        const response = await api.patch(`/admin/users/${id}/role`, { role });
        return response.data;
    } catch (error) {
        console.error(`Error updating role for customer with id ${id}:`, error);
        throw error;
    }
};
