import React, { createContext, useContext, useEffect } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useQueryClient } from 'react-query'; // thêm import
// Export context
export const SocketContext = createContext();

// Export hook
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const { showNotification } = useNotification();
    const queryClient = useQueryClient(); // thêm
    useEffect(() => {
        if (!isAuthenticated) return;

        socketService.connect();

        const handleNotification = (data) => {
            showNotification(data);
        };

        const handleNewOrder = (data) => {
            if (user?.role === 'receptionist' || user?.role === 'admin') {
                showNotification({
                    type: 'info',
                    message: 'Đơn hàng mới',
                    description: `Bàn ${data.tableNumber || data.table?.table_number || data.order?.table?.table_number} vừa đặt món`,
                    data
                });
            }
        };

        const handleKitchenNewOrder = (data) => {
            if (user?.role === 'kitchen' || user?.role === 'admin') {
                showNotification({
                    type: 'info',
                    message: 'Món mới cần chế biến',
                    description: `Đơn hàng ${data.orderNumber} - Bàn ${data.tableNumber}`,
                    data
                });
            }
        };
        const handleTableStatusUpdated = ({ tableId, tableNumber, status }) => {
            // showNotification({
            //     type: 'info',
            //     message: 'Bàn thay đổi trạng thái',
            //     description: `Bàn ${tableNumber || tableId} đã chuyển sang ${status === 'available' ? 'Trống' : status}`
            // });

            // cập nhật trực tiếp query tables để UI TablesPage tự render
            queryClient.setQueryData(['tables'], (oldData) => {
                if (!oldData) return oldData;
                const newData = { ...oldData };
                newData.data = newData.data.map(t =>
                    t.id === tableId ? { ...t, status } : t
                );
                return newData;
            });
        };
        socketService.on('notification', handleNotification);
        socketService.on('new-order', handleNewOrder);
        socketService.on('kitchen-new-order', handleKitchenNewOrder);
        socketService.on('table-status-updated', handleTableStatusUpdated);

        return () => {
            socketService.off('notification', handleNotification);
            socketService.off('new-order', handleNewOrder);
            socketService.off('kitchen-new-order', handleKitchenNewOrder);
            socketService.off('table-status-updated', handleTableStatusUpdated);
            socketService.disconnect();
        };
    }, [isAuthenticated, user, showNotification, queryClient]);

    const value = {
        socket: socketService,
        on: (event, callback) => socketService.on(event, callback),
        off: (event, callback) => socketService.off(event, callback),
        emit: (event, data) => socketService.emit(event, data),
        joinRoom: (room) => socketService.joinRoom(room),
        leaveRoom: (room) => socketService.leaveRoom(room)
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};