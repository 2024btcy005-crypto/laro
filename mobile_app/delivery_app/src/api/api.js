import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PRODUCTION URL
const PRODUCTION_URL = 'https://laro.onrender.com/api';

// Current machine Wi-Fi IPv4 Address (from ipconfig)
const LOCAL_IP = '10.62.227.250';
const LOCAL_URL = `http://${LOCAL_IP}:5000/api`;

const USE_LOCAL_SERVER = false;
export const API_BASE_URL = USE_LOCAL_SERVER ? LOCAL_URL : PRODUCTION_URL;

export const resolveImageUrl = (url) => {
    const DEFAULT_PLACEHOLDER = 'https://via.placeholder.com/150?text=Laro';
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return DEFAULT_PLACEHOLDER;
    }

    let normalizedUrl = url.trim().replace(/\\/g, '/');
    const serverRoot = API_BASE_URL.replace(/\/api$/, '');

    if (normalizedUrl.includes('/uploads/')) {
        const uploadIndex = normalizedUrl.indexOf('/uploads/');
        normalizedUrl = normalizedUrl.substring(uploadIndex);
    } else if (normalizedUrl.startsWith('uploads/')) {
        normalizedUrl = '/' + normalizedUrl;
    }

    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
        if (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')) {
            normalizedUrl = normalizedUrl.replace(/^http:\/\/(localhost|127\.0\.0\.1):\d+/, serverRoot);
        }
        if (normalizedUrl.startsWith('http://images.unsplash.com')) {
            return normalizedUrl.replace('http://', 'https://');
        }
        return normalizedUrl;
    }

    const separator = normalizedUrl.startsWith('/') ? '' : '/';
    return `${serverRoot}${separator}${normalizedUrl}`;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

// Request interceptor for API calls
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('deliveryToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
