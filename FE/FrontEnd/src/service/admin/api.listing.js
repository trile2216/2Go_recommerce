import api from '../../config/axios';

export const fetchListings = async () => {
    try {
        const response = await api.get('/admin/listings?skip=0&take=20');
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
export const updateListingById = async (id, data) => {
    try {
        const response = await api.patch(`/admin/listings/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating listing with id ${id}:`, error);
        throw error;
    }
};
export const updateListingStatusById = async (id, status) => {
    try {
        const response = await api.patch(`/admin/listings/${id}/status`, { status });
        return response.data;
    } catch (error) {
        console.error(`Error updating status for listing with id ${id}:`, error);
        throw error;
    }
};