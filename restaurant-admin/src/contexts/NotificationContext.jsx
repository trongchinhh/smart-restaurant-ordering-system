import React, { createContext, useContext, useState, useCallback } from 'react';
import { notification } from 'antd';
import {
    CheckCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    BellOutlined
} from '@ant-design/icons';

// Export context
export const NotificationContext = createContext();

// Export hook
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [api, contextHolder] = notification.useNotification();
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback(({
        type = 'info',
        message,
        description,
        duration = 4.5,
        placement = 'topRight',
        key,
        onClose,
        onClick,
        icon
    }) => {
        const icons = {
            success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            error: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
            info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
            warning: <WarningOutlined style={{ color: '#faad14' }} />,
            order: <BellOutlined style={{ color: '#722ed1' }} />,
            kitchen: <BellOutlined style={{ color: '#fa8c16' }} />
        };

        const config = {
            message,
            description,
            icon: icon || icons[type] || icons.info,
            duration,
            placement,
            key,
            onClose: () => {
                onClose?.();
                if (key) {
                    setNotifications(prev => prev.filter(n => n.key !== key));
                }
            },
            onClick
        };

        api.open(config);

        if (key) {
            setNotifications(prev => [...prev, { key, type, message, description }]);
        }
    }, [api]);

    const showSuccess = useCallback((message, description, options = {}) => {
        showNotification({ type: 'success', message, description, ...options });
    }, [showNotification]);

    const showError = useCallback((message, description, options = {}) => {
        showNotification({ type: 'error', message, description, duration: 6, ...options });
    }, [showNotification]);

    const showInfo = useCallback((message, description, options = {}) => {
        showNotification({ type: 'info', message, description, ...options });
    }, [showNotification]);

    const showWarning = useCallback((message, description, options = {}) => {
        showNotification({ type: 'warning', message, description, duration: 5, ...options });
    }, [showNotification]);

    const showOrder = useCallback((message, description, options = {}) => {
        showNotification({ type: 'order', message, description, duration: 8, ...options });
    }, [showNotification]);

    const showKitchen = useCallback((message, description, options = {}) => {
        showNotification({ type: 'kitchen', message, description, duration: 8, ...options });
    }, [showNotification]);

    const removeNotification = useCallback((key) => {
        api.destroy(key);
        setNotifications(prev => prev.filter(n => n.key !== key));
    }, [api]);

    const clearAll = useCallback(() => {
        api.destroy();
        setNotifications([]);
    }, [api]);

    const value = {
        showNotification,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showOrder,
        showKitchen,
        removeNotification,
        clearAll,
        notifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {contextHolder}
            {children}
        </NotificationContext.Provider>
    );
};