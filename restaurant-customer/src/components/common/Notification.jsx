import React, { useEffect } from 'react';
import { Toast } from 'antd-mobile';
import { CheckCircleOutline, CloseCircleOutline, InfoOutline } from 'antd-mobile-icons';

const Notification = ({ type, content, duration = 2 }) => {
    useEffect(() => {
        switch (type) {
            case 'success':
                Toast.show({
                    icon: <CheckCircleOutline />,
                    content: content,
                    duration: duration * 1000
                });
                break;
            case 'error':
                Toast.show({
                    icon: <CloseCircleOutline />,
                    content: content,
                    duration: duration * 1000
                });
                break;
            case 'info':
                Toast.show({
                    icon: <InfoOutline />,
                    content: content,
                    duration: duration * 1000
                });
                break;
            default:
                Toast.show({
                    content: content,
                    duration: duration * 1000
                });
        }
    }, [type, content, duration]);

    return null;
};

// Hook for notifications
export const useNotification = () => {
    const showSuccess = (content, duration) => {
        Toast.show({
            icon: <CheckCircleOutline />,
            content,
            duration: duration ? duration * 1000 : 2000
        });
    };

    const showError = (content, duration) => {
        Toast.show({
            icon: <CloseCircleOutline />,
            content,
            duration: duration ? duration * 1000 : 2000
        });
    };

    const showInfo = (content, duration) => {
        Toast.show({
            icon: <InfoOutline />,
            content,
            duration: duration ? duration * 1000 : 2000
        });
    };

    const showLoading = (content) => {
        Toast.show({
            icon: 'loading',
            content,
            duration: 0
        });
    };

    const hideLoading = () => {
        Toast.clear();
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showLoading,
        hideLoading
    };
};

export default Notification;