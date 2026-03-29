const socketEvents = {
    // Order events
    NEW_ORDER: 'new-order',
    ORDER_UPDATED: 'order-updated',
    ORDER_STATUS_UPDATED: 'order-status-updated',
    ORDER_ITEM_UPDATED: 'order-item-updated',
    ORDER_PAID: 'order-paid',
    ORDER_ADD_ITEMS: 'order-add-items',
    ORDER_LIST_UPDATED: 'order-list-updated', // ✅ THÊM EVENT NÀY
    // Kitchen events
    KITCHEN_NEW_ORDER: 'kitchen-new-order',
    KITCHEN_ORDER_UPDATED: 'kitchen-order-updated',
    KITCHEN_ORDER_STATUS_UPDATED: 'kitchen-order-status-updated',
    ADD_ITEMS_TO_ORDER: 'kitchen-add-items',
    // TAKEAWAY EVENTS - THÊM MỚI
    NEW_TAKEAWAY_ORDER: 'new-takeaway-order',
    TAKEAWAY_QR_CREATED: 'takeaway-qr-created',
    TAKEAWAY_QR_TOGGLED: 'takeaway-qr-toggled',
    // Table events
    TABLE_CREATED: 'table-created',
    TABLE_UPDATED: 'table-updated',
    TABLE_DELETED: 'table-deleted',
    TABLE_STATUS_UPDATED: 'table-status-updated',

    // Menu events
    MENU_ITEM_CREATED: 'menu-item-created',
    MENU_ITEM_UPDATED: 'menu-item-updated',
    MENU_ITEM_DELETED: 'menu-item-deleted',
    MENU_ITEM_STATUS_UPDATED: 'menu-item-status-updated',
    MENU_ITEMS_BULK_UPDATED: 'menu-items-bulk-updated',

    // Category events
    CATEGORY_CREATED: 'category-created',
    CATEGORY_UPDATED: 'category-updated',
    CATEGORY_DELETED: 'category-deleted',

    // User events
    USER_LOGIN: 'user-login',
    USER_LOGOUT: 'user-logout',

    // Notification events
    NOTIFICATION: 'notification',

    // Room events
    JOIN_ROOM: 'join-room',
    LEAVE_ROOM: 'leave-room'
};

module.exports = socketEvents;