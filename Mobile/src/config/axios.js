import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

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

// Helper for Queueing requests while refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

const forceLogout = async () => {
    try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('role');
    } catch (err) {
        console.error('Error clearing storage:', err);
    }
    // Emit global event to AuthContext to update UI state
    DeviceEventEmitter.emit('forceLogout');
};

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.status} ${response.config.url}`, response.data);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
        });

        // Chỉ xử lý 401 và chưa retry
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Không retry cho các endpoint auth
        const url = originalRequest.url || '';
        if (url.includes('/Auth/login') || url.includes('/Auth/register') || url.includes('/Auth/refresh-token')) {
            return Promise.reject(error);
        }

        // Nếu đang refresh -> xếp request vào đợi
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = await AsyncStorage.getItem("refreshToken");
            if (!refreshToken) {
                isRefreshing = false;
                await forceLogout();
                return Promise.reject(error);
            }

            // Gọi API refresh không dùng interceptor
            const { data } = await axios.post(
                `${process.env.EXPO_PUBLIC_API}/Auth/refresh-token`,
                { refreshToken }
            );

            const newAccessToken = data.accessToken;
            const newRefreshToken = data.refreshToken;

            // Lưu vào storage
            await AsyncStorage.setItem("token", newAccessToken);
            if (newRefreshToken) {
                await AsyncStorage.setItem("refreshToken", newRefreshToken);
            }

            // Đồng bộ trạng thái vào AuthContext
            DeviceEventEmitter.emit('tokenRefreshed', {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken || refreshToken,
            });

            processQueue(null, newAccessToken);

            // Gửi lại request cũ với token mới
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);

        } catch (refreshError) {
            console.error('[API Error] Refresh token failed:', refreshError);
            processQueue(refreshError, null);
            await forceLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;
