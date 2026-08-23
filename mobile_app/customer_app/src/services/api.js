import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { signOut } from '../store/authSlice';

// PRODUCTION URL
const PRODUCTION_URL = 'https://laro.onrender.com/api';

// Current machine Wi-Fi IPv4 Address (from ipconfig)
const LOCAL_IP = '10.62.227.250';
const LOCAL_URL = `http://${LOCAL_IP}:5000/api`;

// Set to true if testing with local backend (node src/server.js), false for production on Render
const USE_LOCAL_SERVER = false;

export const API_BASE_URL = USE_LOCAL_SERVER ? LOCAL_URL : PRODUCTION_URL;
console.log('[API] Initialized with Base URL:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
});

export const resolveImageUrl = (url) => {
    const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return DEFAULT_PLACEHOLDER;
    }

    let normalizedUrl = url.trim().replace(/\\/g, '/');
    const serverRoot = API_BASE_URL.replace(/\/api$/, '');

    // Replace old localhost / 127.0.0.1 with active serverRoot
    if (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')) {
        normalizedUrl = normalizedUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, serverRoot);
    }

    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
        // Upgrade http to https for external CDNs (like unsplash) to prevent ATS/Android mixed content blocks
        if (normalizedUrl.startsWith('http://images.unsplash.com')) {
            return normalizedUrl.replace('http://', 'https://');
        }
        return normalizedUrl;
    }

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
            
            try {
                store.dispatch(signOut());
            } catch (dispatchErr) {
                console.error('[API] Failed to dispatch signOut:', dispatchErr);
            }
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
    getBalance: () => api.get('/orders/summary'),
    findUser: (phone) => api.get(`/orders/find-user?phone=${phone}`),
    transfer: (data) => api.post('/orders/transfer', data),
    getRecentRecipients: () => api.get('/orders/recent-recipients'),
};

export const referralAPI = {
    getStats: () => api.get('/referral/stats'),
};

export default api;
