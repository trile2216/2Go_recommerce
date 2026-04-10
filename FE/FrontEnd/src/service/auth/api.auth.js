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

export const verifyPhoneFirebase = async (data) => {
    try {
        const response = await api.post('/Auth/verify-phone-firebase', data);
        return response.data;
    } catch (error) {
        console.error('Error during phone verification:', error);
        throw error;
    }
};

export const changePhoneFirebase = async (data) => {
    try {
        const response = await api.post('/Auth/change-phone-firebase', data);
        return response.data;
    } catch (error) {
        console.error('Error changing phone number:', error);
        throw error;
    }
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/Auth/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching current user:', error);
        throw error;
    }
};

export const forgotPassword = async (data) => {
    try {
        const response = await api.post('/Auth/forgot-password', data);
        return response.data;
    } catch (error) {
        console.error('Error during forgot password:', error);
        throw error;
    }
};

export const resetPassword = async (data) => {
    try {
        const response = await api.post('/Auth/reset-password', data);
        return response.data;
    } catch (error) {
        console.error('Error during reset password:', error);
        throw error;
    }
};
