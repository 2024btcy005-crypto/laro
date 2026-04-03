import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the JWT token
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

export const getDashboardStats = () => api.get('/admin/stats');
export const getAllOrders = (params) => api.get('/admin/orders', { params });
export const getAllProducts = () => api.get('/admin/products');
export const addProduct = (data) => api.post('/admin/products', data);
export const updateProduct = (id, data) => api.put(`/admin/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);
export const uploadImage = (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getAllShops = () => api.get('/admin/shops');
export const getAllUsers = () => api.get('/admin/users');
export const getRevenueChartData = () => api.get('/admin/revenue-chart');
export const getTopProducts = () => api.get('/admin/top-products');
export const getAllItemSales = () => api.get('/admin/item-sales');
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/status`);
export const updateUserRole = (id, data) => api.put(`/admin/users/${id}/role`, data);
export const getAllCoupons = () => api.get('/coupons');
export const createCoupon = (data) => api.post('/coupons', data);
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`);

export const getAllCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export const getAdvertisement = () => api.get('/admin/advertisement');
export const updateAdvertisement = (data) => api.put('/admin/advertisement', data);

export const getAllUniversities = () => api.get('/universities');
export const createUniversity = (data) => api.post('/universities', data);
export const updateUniversity = (id, data) => api.put(`/universities/${id}`, data);
export const deleteUniversity = (id) => api.delete(`/universities/${id}`);

export default api;
