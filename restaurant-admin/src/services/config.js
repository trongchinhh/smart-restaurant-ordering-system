export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
export const UPLOAD_URL = process.env.REACT_APP_UPLOAD_URL;

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    RECEPTIONIST: 'receptionist',
    KITCHEN: 'kitchen'
};

export const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY: 'ready',
    SERVED: 'served',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    PAID: 'paid'
};

export const PAYMENT_STATUS = {
    UNPAID: 'unpaid',
    PAID: 'paid',
    PARTIAL: 'partial'
};

export const TABLE_STATUS = {
    AVAILABLE: 'available',
    OCCUPIED: 'occupied',
    RESERVED: 'reserved',
    CLEANING: 'cleaning'
};

export const MENU_ITEM_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    SOLD_OUT: 'sold_out'
};