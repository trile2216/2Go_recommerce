import axios from '../../config/axios';

export const fetchAllCategories = async () => {
    try {
        const response = await axios.get('/categories?skip=0&take=20');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export const fetchCategoryDetails = async (categoryId) => {
    try {
        const response = await axios.get(`/categories/${categoryId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching category details for id ${categoryId}:`, error);
        throw error;
    }
};

export const fetchSubCategoriesByCategoryId = async (categoryId) => {
    try {
        const response = await axios.get(`/categories/${categoryId}/subcategories`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching subcategories for category id ${categoryId}:`, error);
        throw error;
    }
};
