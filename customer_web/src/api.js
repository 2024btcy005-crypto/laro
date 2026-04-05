import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://laro.onrender.com/api';

export const resolveImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/150?text=Laro';
    if (url.startsWith('http')) return url;

    // Normalize slashes (especially for Windows-style paths)
    const normalizedUrl = url.replace(/\\/g, '/');

    // Remove /api from end of API_BASE_URL to get server root
    const serverRoot = API_BASE_URL.replace(/\/api$/, '');

    // Ensure no double slashes when joining
    const separator = normalizedUrl.startsWith('/') ? '' : '/';
    return `${serverRoot}${separator}${normalizedUrl}`;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
});

// Request interceptor for API calls
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log('[API] Unauthorized, logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Core API Endpoints
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    updateProfile: (data) => api.put('/auth/profile', data),
    deleteAccount: () => api.delete('/auth/delete-account'),
};

export const shopAPI = {
    getShops: (lat, lng, universityId) => {
        let url = '/shops';
        const params = [];
        if (lat && lng) {
            params.push(`lat=${lat}`);
            params.push(`lng=${lng}`);
        }
        if (universityId) {
            params.push(`universityId=${universityId}`);
        }
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        return api.get(url);
    },
    getShopDetails: (id, universityId) => {
        let url = `/shops/${id}`;
        if (universityId) {
            url += `?universityId=${universityId}`;
        }
        return api.get(url);
    },
};

export const orderAPI = {
    createOrder: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders'),
    getOrderDetails: (id) => api.get(`/orders/${id}`),
    getUserSummary: () => api.get('/orders/summary'),
};

export const walletAPI = {
    getHistory: () => api.get('/orders/history'),
    findUser: (phone) => api.get(`/orders/find-user?phone=${phone}`),
    transfer: (data) => api.post('/orders/transfer', data),
    getRecentRecipients: () => api.get('/orders/recent-recipients'),
};

export const configAPI = {
    getConfig: () => api.get('/config'),
};

export const couponAPI = {
    validateCoupon: (code, cartTotal) => api.post('/coupons/validate', { code, cartTotal }),
};

export const universityAPI = {
    getAll: () => api.get('/universities'),
};

export default api;
