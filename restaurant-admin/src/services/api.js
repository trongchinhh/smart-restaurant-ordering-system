import axios from 'axios';
import { API_BASE_URL } from './config';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle specific error codes
            switch (error.response.status) {
                case 401:
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    toast.error('Session expired. Please login again.');
                    break;
                case 403:
                    toast.error('You do not have permission to perform this action');
                    break;
                case 404:
                    toast.error('Resource not found');
                    break;
                case 422:
                    // Validation errors
                    break;
                case 500:
                    toast.error('Server error. Please try again later.');
                    break;
                default:
                    toast.error(error.response.data?.message || 'An error occurred');
            }
        } else if (error.request) {
            toast.error('Network error. Please check your connection.');
        }
        return Promise.reject(error);
    }
);

// API service object
export const apiService = {
    // Auth
    login: (credentials) => api.post('/auth/login', credentials),
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
    updateProfile: (data) =>
        api.put('/auth/profile', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }),
    changePassword: (data) => api.put('/auth/change-password', data),

    // Users
    getUsers: () => api.get('/auth/users'),
    createUser: (data) => api.post('/auth/register', data),
    updateUserById: (id, data) => api.put(`/auth/users/${id}`, data),
    deleteUser: (id) => api.delete(`/auth/users/${id}`),
    // Tables
    getTables: (params) => api.get('/tables', { params }),
    getTable: (id) => api.get(`/tables/${id}`),
    createTable: (data) => api.post('/tables', data),
    updateTable: (id, data) => api.put(`/tables/${id}`, data),
    deleteTable: (id) => api.delete(`/tables/${id}`),
    getTableQR: (id) => api.get(`/tables/${id}/qr`),
    updateTableStatus: (id, status) => api.patch(`/tables/${id}/status`, { status }),

    // Categories
    getCategories: (params) => api.get('/categories', { params }),
    getCategory: (id) => api.get(`/categories/${id}`),
    createCategory: (data) => api.post('/categories', data),
    updateCategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategory: (id) => api.delete(`/categories/${id}`),

    // Menu Items
    getMenuItems: (params) => api.get('/menu', { params }),
    getMenuItem: (id) => api.get(`/menu/${id}`),
    createMenuItem: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'ingredients' ||
                key === 'allergens' ||
                key === 'size_prices' ||
                key === 'options'
            ) {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });
        return api.post('/menu', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    updateMenuItem: (id, data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'ingredients' ||
                key === 'allergens' ||
                key === 'size_prices' ||
                key === 'options'
            ) {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/menu/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    deleteMenuItem: (id) => api.delete(`/menu/${id}`),
    updateMenuItemStatus: (id, status) => api.patch(`/menu/${id}/status`, { status }),

    // Orders

    // Orders
    getOrders: (params) => {
        // Tạo query params object để lọc
        const queryParams = {};

        if (params.status) queryParams.status = params.status;
        if (params.payment_status) queryParams.payment_status = params.payment_status;
        if (params.table_number) queryParams.table_number = params.table_number;
        if (params.today_only !== undefined) queryParams.today_only = params.today_only;
        if (params.page) queryParams.page = params.page;
        if (params.limit) queryParams.limit = params.limit;

        return api.get('/orders', { params: queryParams });
    },
    getOrder: (id) => api.get(`/orders/${id}`),
    createOrder: (data) => api.post('/orders', data),
    updateOrder: (id, data) => api.put(`/orders/${id}`, data),
    updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    updateOrderItemStatus: (orderId, itemId, status) =>
        api.patch(`/orders/${orderId}/items/${itemId}`, { status }),
    processPayment: (id, data) => api.post(`/orders/${id}/payment`, data),
    getKitchenOrders: () => api.get('/orders/kitchen/queue'),
    deleteOrderItem: (orderId, itemId) => api.delete(`/orders/${orderId}/items/${itemId}`),


    // Statistics
    getDashboardStats: () => api.get('/statistics/dashboard'),
    getRevenueStats: (params) => api.get('/statistics/revenue', { params }),
    getProductStats: (params) => api.get('/statistics/products', { params }),
    getOrderStats: (params) => api.get('/statistics/orders', { params }),

    // ========== TAKEAWAY APIs (THÊM MỚI) ==========
    getTakeawayQRs: () => api.get('/takeaway-qr'),
    createTakeawayQR: (data) => api.post('/takeaway-qr', data),
    toggleTakeawayQR: (id) => api.patch(`/takeaway-qr/${id}/toggle`)
};

export default api;