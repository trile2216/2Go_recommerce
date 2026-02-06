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

export const loginWithOAuth = async (oauthData) => {
    try {
        const response = await api.post('/Auth/firebase-login', oauthData);
        return response.data;
    } catch (error) {
        console.error('Error during OAuth login:', error);
        throw error;
    }   
};

export const logout = async (refreshToken) => {
    try {
        const response = await api.post('/Auth/logout', { refreshToken });
        return response.data;
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};

export const refreshToken = async (refreshToken) => {
    try {
        const response = await api.post('/Auth/refresh-token', { refreshToken });
        return response.data;
    } catch (error) {
        console.error('Error during token refresh:', error);
        throw error;
    }
};