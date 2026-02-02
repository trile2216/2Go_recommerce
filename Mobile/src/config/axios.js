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
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
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
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or unauthorized
            try {
                await AsyncStorage.removeItem('token');
                await AsyncStorage.removeItem('user');
            } catch (err) {
                console.error('Error clearing storage:', err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
