import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API,
    withCredentials: true,
});

// Request interceptor to add token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            console.log(`[API Auth] Token exists: ${!!token}, length: ${token?.length || 0}`);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            
            // Check if data is FormData (React Native FormData has _parts property)
            const isFormData = config.data && config.data._parts !== undefined;
            
            if (isFormData) {
                // For FormData, DON'T set Content-Type - let React Native handle it
                // This ensures proper boundary is set automatically
                delete config.headers['Content-Type'];
            } else {
                // For JSON data, set Content-Type
                config.headers['Content-Type'] = 'application/json';
            }
            
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, 
                isFormData ? '[FormData]' : config.data);
            console.log(`[API Headers] Authorization: ${config.headers.Authorization ? 'Bearer ***' : 'NOT SET'}, Content-Type: ${config.headers['Content-Type'] || 'auto'}`);
        } catch (error) {
            console.error('Error retrieving token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    async (error) => {
        console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });

        if (error.response && error.response.status === 401) {
            // Token expired or unauthorized
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
                await AsyncStorage.removeItem('refreshToken');
                await AsyncStorage.removeItem('role');
            } catch (err) {
                console.error('Error clearing storage:', err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
