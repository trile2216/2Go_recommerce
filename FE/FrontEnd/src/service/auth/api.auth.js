import api from '../../config/axios.js';

export const login = async (credentials) => {
    try {
        const response = await api.post('/Auth/login', credentials);
        return response.data;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }   
};

export const register = async (userInfo) => {
    try {
        const response = await api.post('/Auth/register', userInfo);
        return response.data;
    } catch (error) {
        console.error('Error during registration:', error);
        throw error;
    }   
};