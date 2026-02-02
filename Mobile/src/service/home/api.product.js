import api from '../../config/axios';

export const fetchProducts = async () => {
    try {
        const response = await api.get('/listings');
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }       
};

export const fetchCategories = async () => {
    try {
        const response = await api.get('/categories');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
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