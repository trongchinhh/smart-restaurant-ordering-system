export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: 'view_dashboard',
    VIEW_STATISTICS: 'view_statistics',

    // Tables
    VIEW_TABLES: 'view_tables',
    CREATE_TABLE: 'create_table',
    UPDATE_TABLE: 'update_table',
    DELETE_TABLE: 'delete_table',
    UPDATE_TABLE_STATUS: 'update_table_status',
    GENERATE_QR: 'generate_qr',

    // Menu
    VIEW_MENU: 'view_menu',
    CREATE_CATEGORY: 'create_category',
    UPDATE_CATEGORY: 'update_category',
    DELETE_CATEGORY: 'delete_category',
    CREATE_MENU_ITEM: 'create_menu_item',
    UPDATE_MENU_ITEM: 'update_menu_item',
    DELETE_MENU_ITEM: 'delete_menu_item',
    UPDATE_MENU_ITEM_STATUS: 'update_menu_item_status',

    // Orders
    VIEW_ORDERS: 'view_orders',
    CREATE_ORDER: 'create_order',
    UPDATE_ORDER: 'update_order',
    UPDATE_ORDER_STATUS: 'update_order_status',
    PROCESS_PAYMENT: 'process_payment',

    // Kitchen
    VIEW_KITCHEN_QUEUE: 'view_kitchen_queue',
    UPDATE_ITEM_STATUS: 'update_item_status',

    // Settings
    VIEW_SETTINGS: 'view_settings',
    MANAGE_USERS: 'manage_users',

    // Reports
    VIEW_REPORTS: 'view_reports'
};

export const ROLE_PERMISSIONS = {
    admin: Object.values(PERMISSIONS),

    manager: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_STATISTICS,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.CREATE_TABLE,
        PERMISSIONS.UPDATE_TABLE,
        PERMISSIONS.UPDATE_TABLE_STATUS,
        PERMISSIONS.GENERATE_QR,
        PERMISSIONS.VIEW_MENU,
        PERMISSIONS.CREATE_CATEGORY,
        PERMISSIONS.UPDATE_CATEGORY,
        PERMISSIONS.CREATE_MENU_ITEM,
        PERMISSIONS.UPDATE_MENU_ITEM,
        PERMISSIONS.UPDATE_MENU_ITEM_STATUS,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.UPDATE_ORDER,
        PERMISSIONS.UPDATE_ORDER_STATUS,
        PERMISSIONS.PROCESS_PAYMENT,
        PERMISSIONS.VIEW_KITCHEN_QUEUE,
        PERMISSIONS.VIEW_SETTINGS,
        PERMISSIONS.VIEW_REPORTS
    ],

    receptionist: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_TABLES,
        PERMISSIONS.UPDATE_TABLE_STATUS,
        PERMISSIONS.VIEW_MENU,
        PERMISSIONS.VIEW_ORDERS,
        PERMISSIONS.CREATE_ORDER,
        PERMISSIONS.UPDATE_ORDER,
        PERMISSIONS.UPDATE_ORDER_STATUS,
        PERMISSIONS.PROCESS_PAYMENT,
        PERMISSIONS.VIEW_KITCHEN_QUEUE
    ],

    kitchen: [
        PERMISSIONS.VIEW_KITCHEN_QUEUE,
        PERMISSIONS.UPDATE_ITEM_STATUS,
        PERMISSIONS.VIEW_ORDERS
    ]
};

export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;
    if (userRole === 'admin') return true;
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

export const hasAnyPermission = (userRole, permissions) => {
    return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
    return permissions.every(permission => hasPermission(userRole, permission));
};