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
