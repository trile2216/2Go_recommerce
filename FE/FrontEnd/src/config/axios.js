import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API,
    withCredentials: true ,
    
});
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Không set Content-Type nếu là FormData để browser tự đặt boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;