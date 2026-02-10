import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
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
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data);
            console.log(`[API Headers] Authorization: ${config.headers.Authorization ? 'Bearer ***' : 'NOT SET'}`);
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
