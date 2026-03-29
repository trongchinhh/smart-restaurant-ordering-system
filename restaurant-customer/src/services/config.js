export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL || 'http://localhost:5000/uploads';
export const WEBSITE_NAME = process.env.REACT_APP_WEBSITE_NAME || 'Nhà hàng của bạn';

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export const PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PAID: 'paid'
};