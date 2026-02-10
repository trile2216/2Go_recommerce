import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_PUBLIC_API?.trim(),
    withCredentials: true,
});

// ── Request interceptor ─────────────────────────────────────────────
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

// ── Response interceptor — auto refresh token on 401 ────────────────
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

const forceLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    // Redirect to login — dùng window.location vì không nằm trong React tree
    window.location.href = "/auth/login";
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Chỉ xử lý 401 và chưa retry
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Không retry cho các endpoint auth (login, register, refresh-token)
        const url = originalRequest.url || '';
        if (url.includes('/Auth/login') || url.includes('/Auth/register') || url.includes('/Auth/refresh-token')) {
            return Promise.reject(error);
        }

        // Nếu đang refresh → xếp request vào hàng đợi
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

        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            isRefreshing = false;
            forceLogout();
            return Promise.reject(error);
        }

        try {
            const { data } = await axios.post(
                `${import.meta.env.VITE_PUBLIC_API?.trim()}/Auth/refresh-token`,
                { refreshToken }
            );

            const newAccessToken = data.accessToken;
            const newRefreshToken = data.refreshToken;

            // Cập nhật localStorage
            localStorage.setItem("token", newAccessToken);
            if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
            }

            // Cập nhật Redux store (nếu có)      
            try {
                const { store } = await import('../context/store');
                const { loginSuccess } = await import('../context/UserSlice');
                const currentUser = JSON.parse(localStorage.getItem("user") || "null");
                store.dispatch(loginSuccess({
                    token: newAccessToken,
                    refreshToken: newRefreshToken || refreshToken,
                    user: currentUser,
                    role: currentUser?.role,
                }));
            } catch {
                // Store chưa sẵn sàng — không sao, localStorage đã được cập nhật
            }

            processQueue(null, newAccessToken);

            // Retry request gốc với token mới
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError, null);
            forceLogout();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api;