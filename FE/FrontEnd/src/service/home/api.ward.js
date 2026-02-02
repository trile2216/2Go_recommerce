import axios from "../../config/axios";

export const fetchAllWards = async () => {
    try {
        const response = await axios.get('/wards');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching wards:', error);
        throw error;
    }
};