import api from '../../config/axios';

export const fetchCategories = async () => {
    try {
        const response = await api.get('/admin/categories?skip=0&take=20');
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};
export const fetchCategoryById = async (id) => {
    try {
        const response = await api.get(`/admin/categories/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching category with id ${id}:`, error);
        throw error;
    }
};
export const deleteCategoryById = async (id) => {
    try {
        const response = await api.delete(`/admin/categories/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting category with id ${id}:`, error);
        throw error;
    }
};
export const updateCategoryById = async (id, data) => {
    try {
        const response = await api.put(`/admin/categories/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating category with id ${id}:`, error);
        throw error;
    }
};
export const createCategory = async (data) => {
    try {
        const response = await api.post('/admin/categories', data);
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};
export const fetchSubCategoriesByCategoryId = async (categoryId) => {
    try {
        const response = await api.get(`/admin/categories/${categoryId}/subcategories`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching subcategories for category id ${categoryId}:`, error);
        throw error;
    }
};
export const createSubCategory = async (categoryId, data) => {
    try {
        const response = await api.post(`/admin/categories/${categoryId}/subcategories`, data); 
        return response.data;
    } catch (error) {
        console.error(`Error creating subcategory for category id ${categoryId}:`, error);
        throw error;
    }
};