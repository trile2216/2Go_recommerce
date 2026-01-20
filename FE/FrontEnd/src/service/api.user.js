import api from "../config/axios";  

export const getUserInfo = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        throw error;
    }
};

export const updateUserProfile = async (profileData) => {
    try {
        const response = await api.put('/users/me', profileData);
        return response.data;
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

export const newPassword = async (data) => {
    try {   
        const response = await api.post(`/users/me/password`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating password `, error);
        throw error;
    }
};