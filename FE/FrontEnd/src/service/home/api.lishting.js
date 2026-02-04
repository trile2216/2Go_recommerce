import api from '../../config/axios.js';

export const getListing = async () => {
    try {
        const response = await api.get('/seller/listings');
        return response.data;
    } catch (error) {
        console.error('Error fetching listings:', error);
        throw error;
    }
};

export const createListing = async (listingData) => {
    try {
        const response = await api.post('/seller/listings', listingData);
        return response.data;
    } catch (error) {
        console.error('Error creating listing:', error);
        throw error;
    }
};

export const updateListing = async (listingId, updatedData) => {
    try {
        const response = await api.patch(`/seller/listings/${listingId}`, updatedData);
        return response.data;
    }
    catch (error) {
        console.error('Error updating listing:', error);
        throw error;
    }
};