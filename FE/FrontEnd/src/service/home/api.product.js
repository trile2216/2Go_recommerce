import api from '../../config/axios';

export const fetchProducts = async () => {
    try {
        const response = await api.get('/listings?skip=0&take=20');
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }       
};
export const fetchProductById = async (id) => {
    try {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching product with id ${id}:`, error);
        throw error;
    }   
};