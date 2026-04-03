import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your local machine's IP address
export const API_BASE_URL = 'http://10.33.247.250:5000/api';

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
