import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// PRODUCTION URL
const PRODUCTION_URL = 'https://laro-production.up.railway.app/api';

// Replace with your local machine's IP address
export const API_BASE_URL = __DEV__ ? 'http://10.33.247.250:5000/api' : PRODUCTION_URL;

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
