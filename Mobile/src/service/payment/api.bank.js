import axios from "axios";

const API_URL = "https://api.vietqr.io/v2/banks";

export const getBanks = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching banks:", error);
        throw error;
    }
};
