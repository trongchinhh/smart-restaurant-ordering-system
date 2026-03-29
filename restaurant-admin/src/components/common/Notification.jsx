import React, { useEffect } from 'react';
import { notification } from 'antd';
import {
    CheckCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    BellOutlined
} from '@ant-design/icons';
import './Notification.scss';

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    INFO: 'info',
    WARNING: 'warning',
    ORDER: 'order',
    KITCHEN: 'kitchen'
};

// Configuration for different notification types
const notificationConfig = {
    [NOTIFICATION_TYPES.SUCCESS]: {
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 4.5,
        className: 'notification-success'
    },
    [NOTIFICATION_TYPES.ERROR]: {
        icon: <CloseCircleOutlined style={{ color: '#f5222d' }} />,
        duration: 6,
        className: 'notification-error'
    },
    [NOTIFICATION_TYPES.INFO]: {
        icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        duration: 4.5,
        className: 'notification-info'
    },
    [NOTIFICATION_TYPES.WARNING]: {
        icon: <WarningOutlined style={{ color: '#faad14' }} />,
        duration: 5,
        className: 'notification-warning'
    },
    [NOTIFICATION_TYPES.ORDER]: {
        icon: <BellOutlined style={{ color: '#722ed1' }} />,
        duration: 8,
        className: 'notification-order'
    },
    [NOTIFICATION_TYPES.KITCHEN]: {
        icon: <BellOutlined style={{ color: '#fa8c16' }} />,
        duration: 8,
        className: 'notification-kitchen'
    }
};

// Notification component
const Notification = ({
    type = NOTIFICATION_TYPES.INFO,
    message,
    description,
    duration,
    placement = 'topRight',
    onClose,
    onClick,
    key
}) => {
    const config = notificationConfig[type] || notificationConfig.info;

    useEffect(() => {
        notification.open({
            message,
            description,
            icon: config.icon,
            duration: duration || config.duration,
            placement,
            className: config.className,
            onClose,
            onClick,
            key
        });
    }, [type, message, description, duration, placement, onClose, onClick, key]);

    return null;
};

// Custom hook for notifications
export const useNotification = () => {
    const [api, contextHolder] = notification.useNotification();

    const showNotification = (type, message, description, options = {}) => {
        const config = notificationConfig[type] || notificationConfig.info;

        api.open({
            message,
            description,
            icon: config.icon,
            className: config.className,
            duration: options.duration || config.duration,
            placement: options.placement || 'topRight',
            onClose: options.onClose,
            onClick: options.onClick,
            key: options.key
        });
    };

    const showSuccess = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.SUCCESS, message, description, options);

    const showError = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.ERROR, message, description, options);

    const showInfo = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.INFO, message, description, options);

    const showWarning = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.WARNING, message, description, options);

    const showOrder = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.ORDER, message, description, options);

    const showKitchen = (message, description, options) =>
        showNotification(NOTIFICATION_TYPES.KITCHEN, message, description, options);

    return {
        contextHolder,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        showOrder,
        showKitchen
    };
};

// Notification container for real-time updates
export const NotificationContainer = ({ notifications, onClose }) => {
    return (
        <>
            {notifications.map((notif, index) => (
                <Notification
                    key={notif.key || index}
                    type={notif.type}
                    message={notif.message}
                    description={notif.description}
                    duration={notif.duration}
                    onClose={() => onClose?.(notif.key || index)}
                    onClick={notif.onClick}
                />
            ))}
        </>
    );
};

// Notification badge component
export const NotificationBadge = ({ count, onClick, children }) => {
    return (
        <div className="notification-badge" onClick={onClick}>
            {children}
            {count > 0 && (
                <span className="notification-count">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </div>
    );
};

// Notification styles
const styles = `
.notification-success {
  border-left: 4px solid #52c41a;
}

.notification-error {
  border-left: 4px solid #f5222d;
}

.notification-info {
  border-left: 4px solid #1890ff;
}

.notification-warning {
  border-left: 4px solid #faad14;
}

.notification-order {
  border-left: 4px solid #722ed1;
  background: linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%);
}

.notification-kitchen {
  border-left: 4px solid #fa8c16;
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
}

.notification-badge {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.notification-count {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: #f5222d;
  color: white;
  font-size: 12px;
  line-height: 20px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default Notification;