import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PRODUCTION URL
const PRODUCTION_URL = 'https://laro.onrender.com/api';

// Replace with your local machine's IP address when testing on physical device
// Run 'ipconfig' in terminal and find 'IPv4 Address' under your Wi-Fi/Ethernet.
const LOCAL_IP = '10.217.30.250'; // UPDATE THIS TO YOUR CURRENT IP
export const API_BASE_URL = __DEV__ ? `http://${LOCAL_IP}:5000/api` : PRODUCTION_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

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

// Request interceptor for API calls
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401 Token Failures
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401) {
            console.log('[API] Unauthorized access detected, clearing session.');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            // Note: We can't easily logout from Redux here without store injection, 
            // but clearing storage ensures next reload fixes it.
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    updateProfile: (data) => api.put('/auth/profile', data),
    deleteAccount: () => api.delete('/auth/delete-account'),
};

export const orderAPI = {
    createOrder: (orderData) => api.post('/orders', orderData),
    getMyOrders: () => api.get('/orders'),
    getOrderDetails: (id) => api.get(`/orders/${id}`),
    getUserSummary: () => api.get('/orders/summary'),
    getHistory: () => api.get('/orders/history'),
    deleteOrder: (id) => api.delete(`/orders/${id}`),
    getConfig: () => api.get('/config'),
};

export const couponAPI = {
    validateCoupon: (code, cartTotal) => api.post('/coupons/validate', { code, cartTotal }),
};

export const walletAPI = {
    findUser: (phone) => api.get(`/orders/find-user?phone=${phone}`),
    transfer: (data) => api.post('/orders/transfer', data),
    getRecentRecipients: () => api.get('/orders/recent-recipients'),
};

export default api;
