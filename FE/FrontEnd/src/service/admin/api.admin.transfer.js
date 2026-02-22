import axios from '../../config/axios';

const BASE_URL = '/transfers';

/**
 * Create a single transfer.
 * @param {object} data - { amount, description, toBin, toAccountNumber, category }
 */
export const createTransfer = async (data) => {
    try {
        const response = await axios.post(BASE_URL, data);
        return response.data;
    } catch (error) {
        console.error('Error creating transfer:', error);
        throw error;
    }
};

/**
 * Create a batch transfer.
 * @param {object} data - { transfers: [{ amount, description, toBin, toAccountNumber }] }
 */
export const createBatchTransfer = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/batch`, data);
        return response.data;
    } catch (error) {
        console.error('Error creating batch transfer:', error);
        throw error;
    }
};

/**
 * Get transfer by ID.
 * @param {number} transferId 
 */
export const getTransferById = async (transferId) => {
    try {
        const response = await axios.get(`${BASE_URL}/${transferId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching transfer ${transferId}:`, error);
        throw error;
    }
};

/**
 * Get transfer by Reference ID.
 * @param {string} referenceId 
 */
export const getTransferByReference = async (referenceId) => {
    try {
        const response = await axios.get(`${BASE_URL}/reference/${referenceId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching transfer by reference ${referenceId}:`, error);
        throw error;
    }
};

/**
 * Get all transfers for the current user.
 */
export const getUserTransfers = async () => {
    try {
        const response = await axios.get(BASE_URL);
        return response.data;
    } catch (error) {
        console.error('Error fetching user transfers:', error);
        throw error;
    }
};

/**
 * Get account balance.
 */
export const getAccountBalance = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/account-balance`);
        return response.data;
    } catch (error) {
        console.error('Error fetching account balance:', error);
        throw error;
    }
};

/**
 * Estimate credit for transfers.
 * @param {object} data - { transfers: [...] }
 */
export const estimateCredit = async (data) => {
    try {
        const response = await axios.post(`${BASE_URL}/estimate-credit`, data);
        return response.data;
    } catch (error) {
        console.error('Error estimating credit:', error);
        throw error;
    }
};
