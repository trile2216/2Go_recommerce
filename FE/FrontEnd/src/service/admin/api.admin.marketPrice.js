import axios from '../../config/axios';

const BASE_URL = '/admin/market-prices';

export const getAllMarketPrices = async (productKey = '', categoryId = null, condition = '', skip = 0, take = 20) => {
    try {
        const params = { skip, take };
        if (productKey) params.productKey = productKey;
        if (categoryId) params.categoryId = categoryId;
        if (condition) params.condition = condition;

        const response = await axios.get(BASE_URL, { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching market prices:', error);
        throw error;
    }
};

export const getMarketPriceById = async (id) => {
    try {
        const response = await axios.get(`${BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching market price with id ${id}:`, error);
        throw error;
    }
};

export const seedMarketPrices = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/seed`);
        return response.data;
    } catch (error) {
        console.error('Error seeding market prices:', error);
        throw error;
    }
};

export const backfillMarketPrices = async (monthsBack = 6, minPrice = 100000, dryRun = false) => {
    try {
        const params = { monthsBack, minPrice, dryRun };
        const response = await axios.post(`${BASE_URL}/backfill`, null, { params });
        return response.data;
    } catch (error) {
        console.error('Error backfilling market prices:', error);
        throw error;
    }
};
