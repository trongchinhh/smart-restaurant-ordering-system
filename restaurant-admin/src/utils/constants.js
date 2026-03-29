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

export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    RECEPTIONIST: 'receptionist',
    KITCHEN: 'kitchen'
};

export const ORDER_PRIORITY = {
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
};

export const PAYMENT_METHODS = {
    CASH: 'cash',
    CARD: 'card',
    TRANSFER: 'transfer'
};

export const TABLE_LOCATIONS = {
    INSIDE: 'inside',
    OUTSIDE: 'outside',
    VIP: 'vip'
};