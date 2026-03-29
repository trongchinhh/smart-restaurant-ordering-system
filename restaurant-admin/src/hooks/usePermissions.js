import { useAuth } from './useAuth';

export const usePermissions = () => {
    const { user, hasRole } = useAuth();

    const isAdmin = hasRole('admin');
    const isManager = hasRole('manager');
    const isReceptionist = hasRole('receptionist');
    const isKitchen = hasRole('kitchen');

    const permissions = {
        // Dashboard
        viewDashboard: isAdmin || isManager,
        viewStatistics: isAdmin || isManager,

        // Tables
        viewTables: isReceptionist || isAdmin || isManager,
        createTable: isAdmin || isManager,
        updateTable: isAdmin || isManager,
        deleteTable: isAdmin,
        updateTableStatus: isAdmin || isManager || isReceptionist,
        generateQR: isAdmin || isManager,

        // Menu
        viewMenu: isReceptionist || isAdmin || isManager,
        createCategory: isAdmin || isManager,
        updateCategory: isAdmin || isManager,
        deleteCategory: isAdmin,
        createMenuItem: isAdmin || isManager,
        updateMenuItem: isAdmin || isManager,
        deleteMenuItem: isAdmin,
        updateMenuItemStatus: isAdmin || isManager,

        // Orders
        viewOrders: isAdmin || isManager || isReceptionist,
        createOrder: isAdmin || isManager || isReceptionist,
        updateOrder: isAdmin || isManager || isReceptionist,
        updateOrderStatus: isAdmin || isManager || isReceptionist || isKitchen,
        processPayment: isAdmin || isManager || isReceptionist,

        // Kitchen
        viewKitchenQueue: isAdmin || isManager || isKitchen,
        updateItemStatus: isAdmin || isKitchen,

        // TAKEAWAY - Thêm permission mới
        viewTakeaway: isAdmin || isManager || isReceptionist,
        createTakeawayQR: isAdmin || isManager,
        cancelTakeaway: isAdmin || isManager,

        // Settings
        viewSettings: isAdmin || isManager,
        manageUsers: isAdmin,

        // Reports
        viewReports: isAdmin || isManager
    };

    // Đổi tên hàm từ can thành checkPermission để tránh trùng với biến permissions
    const checkPermission = (permission) => {
        return permissions[permission] || false;
    };

    return {
        isAdmin,
        isManager,
        isReceptionist,
        isKitchen,
        permissions,
        can: checkPermission // Export với tên can để không ảnh hưởng đến code đang dùng
    };
};