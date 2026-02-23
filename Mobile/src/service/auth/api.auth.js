import api from '../../config/axios.js';

export const login = async (credentials) => {
    try {
        console.log('[Auth] Attempting login with:', { email: credentials.email });
        const response = await api.post('/Auth/login', credentials);
        console.log('[Auth] Login successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth] Login failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,
            data: error.response?.data,
        });
        throw error;
    }
};

export const register = async (userInfo) => {
    try {
        console.log('[Auth] Attempting register');
        const response = await api.post('/Auth/register', userInfo);
        console.log('[Auth] Register successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth] Register failed:', {
            status: error.response?.status,
            message: error.response?.data?.message,
            errors: error.response?.data?.errors,
        });
        throw error;
    }
};

export const loginWithOAuth = async (oauthData) => {
    try {
        console.log('[Auth] Attempting OAuth login');
        const response = await api.post('/Auth/firebase-login', oauthData);
        console.log('[Auth] OAuth login successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('[Auth] OAuth login failed:', error.response?.data);
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

export const verifyEmail = async (data) => {
    try {
        const response = await api.post('/Auth/verify-email', data);
        return response.data;
    } catch (error) {
        console.error('Error during email verification:', error);
        throw error;
    }
};

export const resendVerifyEmail = async (data) => {
    try {
        const response = await api.post('/Auth/resend-verify-email', data);
        return response.data;
    } catch (error) {
        console.error('Error resending email verification:', error);
        throw error;
    }
};