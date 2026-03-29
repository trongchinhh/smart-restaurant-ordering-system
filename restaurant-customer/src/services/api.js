import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const tableId = localStorage.getItem('tableId');
        if (tableId) {
            config.headers['X-Table-Id'] = tableId;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message = error.response?.data?.message || 'Có lỗi xảy ra';
        return Promise.reject({ message, ...error });
    }
);

// API functions
export const getCategories = () => api.get('/categories');

export const getMenuItems = (params) => api.get('/menu', { params });

export const getMenuItem = (id) => api.get(`/menu/${id}`);

export const createOrder = (data) => api.post('/orders/public', data);

export const getOrder = (id) => api.get(`/orders/${id}`);

export const getTableInfo = (id) => api.get(`/tables/public/${id}`);

export const validateTable = (id) => api.get(`/tables/public/${id}/validate`);
// TAKEAWAY APIS - THÊM CÁC HÀM NÀY
// TAKEAWAY QR APIS - SỬA LẠI CHO ĐÚNG VỚI BACKEND
export const validateTakeawayQR = (code) => api.get(`/takeaway-qr/public/${code}`);
export const createTakeawayOrder = (code, orderData) => api.post(`/takeaway-qr/public/${code}/order`, orderData);
export const addItemsToOrder = (orderId, data) =>
    api.post(`/orders/public/${orderId}/add-items`, data);
export const getActiveOrderByTable = (tableId) =>
    api.get(`/orders/table/${tableId}/active`);
export default {
    getCategories,
    getMenuItems,
    getMenuItem,
    createOrder,
    getOrder,
    getTableInfo,
    validateTable,
    validateTakeawayQR,
    createTakeawayOrder,
    addItemsToOrder,
    getActiveOrderByTable
};