import axios from "../../config/axios";

// GET /api/districts?cityId=&search=
export const fetchAllDistricts = async ({ cityId, search } = {}) => {
    try {
        const params = {};
        if (cityId !== undefined && cityId !== null) params.cityId = cityId;
        if (search) params.search = search;
        const response = await axios.get('/districts', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching districts:', error);
        throw error;
    }
};
