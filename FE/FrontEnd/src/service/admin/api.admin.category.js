import axios from '../../config/axios';

const BASE_URL = '/admin/categories';

export const getAllCategories = async (search = '', skip = 0, take = 20) => {
    try {
        const response = await axios.get(BASE_URL, {
            params: { search, skip, take }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
};

export const getCategoryById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching category with id ${id}:`, error);
        throw error;
    }
};

export const createCategory = async (data) => {
    try {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating category:', error);
        throw error;
    }
};

export const updateCategory = async (id, data) => {
    try {
        const response = await axios.patch(`${BASE_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating category with id ${id}:`, error);
        throw error;
    }
};

export const updateCategoryStatus = async (id, isActive) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}/status`, { isActive });
        return response.data;
    } catch (error) {
        console.error(`Error updating category status with id ${id}:`, error);
        throw error;
    }
};

export const deleteCategory = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting category with id ${id}:`, error);
        throw error;
    }
};

export const getSubCategoriesByCategoryId = async (categoryId, isActive = true, skip = 0, take = 20) => {
    try {
        const params = { skip, take };
        if (isActive !== null) params.isActive = isActive;

        const response = await axios.get(`${BASE_URL}/${categoryId}/subcategories`, { params });
        return response.data;
    } catch (error) {
        console.error(`Error fetching subcategories for category id ${categoryId}:`, error);
        throw error;
    }
};

export const createSubCategory = async (categoryId, data) => {
    try {
        const response = await axios.post(`${BASE_URL}/${categoryId}/subcategories`, data);
        return response.data;
    } catch (error) {
        console.error(`Error creating subcategory for category id ${categoryId}:`, error);
        throw error;
    }
};
