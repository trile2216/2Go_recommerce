import axios from "../../config/axios";

export const fetchAllDistricts = async () => {
    try {
        const response = await axios.get('/districts');
        return response.data;
    } catch (error) {
        console.error('Error fetching districts:', error);
        throw error;
    }
};
