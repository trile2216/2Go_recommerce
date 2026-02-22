import axios from '../../config/axios';

const BASE_URL = '/admin/subcategories';

export const getSubCategoryById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching subcategory with id ${id}:`, error);
        throw error;
    }
};

export const updateSubCategory = async (id, data) => {
    try {
        const response = await axios.patch(`${BASE_URL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating subcategory with id ${id}:`, error);
        throw error;
    }
};

export const updateSubCategoryStatus = async (id, isActive) => {
    try {
        const response = await axios.put(`${BASE_URL}/${id}/status`, { isActive });
        return response.data;
    } catch (error) {
        console.error(`Error updating subcategory status with id ${id}:`, error);
        throw error;
    }
};

export const deleteSubCategory = async (id) => {
    try {
        const response = await axios.delete(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting subcategory with id ${id}:`, error);
        throw error;
    }
};
