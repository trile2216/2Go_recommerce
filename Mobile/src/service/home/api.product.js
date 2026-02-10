import api from '../../config/axios';

export const fetchProducts = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('skip', params.skip ?? 0);
        queryParams.append('take', params.take ?? 20);

        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.subCategoryId) queryParams.append('subCategoryId', params.subCategoryId);
        if (params.status) queryParams.append('status', params.status);
        if (params.condition) queryParams.append('condition', params.condition);
        if (params.brand) queryParams.append('brand', params.brand);
        if (params.minPrice) queryParams.append('minPrice', params.minPrice);
        if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
        if (params.wardId) queryParams.append('wardId', params.wardId);
        if (params.districtId) queryParams.append('districtId', params.districtId);
        if (params.search) queryParams.append('search', params.search);
        if (params.sort) queryParams.append('sort', params.sort);

        const response = await api.get(`/listings?${queryParams.toString()}`);
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