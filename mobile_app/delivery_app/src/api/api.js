import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PRODUCTION URL
const PRODUCTION_URL = 'https://laro.onrender.com/api';

// Replace with your local machine's IP address
const LOCAL_IP = '10.217.30.250'; // <--- UPDATE THIS
export const API_BASE_URL = __DEV__ ? `http://${LOCAL_IP}:5000/api` : PRODUCTION_URL;

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
