import api from '../../config/axios';

export const fetchListings = async (params = {}) => {
    try {
        const response = await api.get('/admin/listings', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching listings:', error);
        throw error;
    }
};

export const fetchListingById = async (id) => {
    try {
        const response = await api.get(`/admin/listings/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching listing with id ${id}:`, error);
        throw error;
    }
};

export const deleteListingById = async (id) => {
    try {
        const response = await api.delete(`/admin/listings/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting listing with id ${id}:`, error);
        throw error;
    }
};

export const updateListingStatusById = async (id, status) => {
    try {
        const response = await api.put(`/admin/listings/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`Error updating status for listing with id ${id}:`, error);
        throw error;
    }
};