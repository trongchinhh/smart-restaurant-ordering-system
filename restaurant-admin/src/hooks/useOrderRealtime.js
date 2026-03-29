// hooks/useOrderRealtime.js
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';
import { useSocket } from '../contexts/SocketContext';

export const useOrderRealtime = () => {
    const queryClient = useQueryClient();
    const { on, off } = useSocket(); // Sử dụng useSocket thay vì import trực tiếp

    useEffect(() => {
        console.log('🔌 useOrderRealtime mounted - Setting up socket listeners');

        // Handler cho order list updated
        const handleOrderListUpdated = (data) => {
            console.log('📋 ORDER_LIST_UPDATED received:', data);
            // Invalidate orders list query để refresh data
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId) {
                queryClient.invalidateQueries(['order', data.orderId]);
            }
        };

        // Handler cho order item updated
        const handleOrderItemUpdated = (data) => {
            console.log('🍽️ ORDER_ITEM_UPDATED received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId) {
                queryClient.invalidateQueries(['order', data.orderId]);
            }
        };

        // Handler cho order status updated
        const handleOrderStatusUpdated = (data) => {
            console.log('📊 ORDER_STATUS_UPDATED received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId) {
                queryClient.invalidateQueries(['order', data.orderId]);
            }
        };

        // Handler cho order updated
        const handleOrderUpdated = (data) => {
            console.log('🔄 ORDER_UPDATED received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId || data?.id) {
                const orderId = data.orderId || data.id;
                queryClient.invalidateQueries(['order', orderId]);
            }
        };

        // Handler cho kitchen order updated
        const handleKitchenOrderUpdated = (data) => {
            console.log('🍳 KITCHEN_ORDER_UPDATED received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId) {
                queryClient.invalidateQueries(['order', data.orderId]);
            }
        };

        // Handler cho new order
        const handleNewOrder = (data) => {
            console.log('✨ NEW_ORDER received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
        };

        // Handler cho kitchen new order
        const handleKitchenNewOrder = (data) => {
            console.log('🍳 KITCHEN_NEW_ORDER received:', data);
            queryClient.invalidateQueries('kitchenOrders');
            queryClient.invalidateQueries('orders');
        };

        // Handler cho add items
        const handleAddItems = (data) => {
            console.log('➕ ADD_ITEMS received:', data);
            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');
            if (data?.orderId) {
                queryClient.invalidateQueries(['order', data.orderId]);
            }
        };

        // Register all event listeners using the on method from useSocket
        on('order-list-updated', handleOrderListUpdated);
        on('order-item-updated', handleOrderItemUpdated);
        on('order-status-updated', handleOrderStatusUpdated);
        on('order-updated', handleOrderUpdated);
        on('kitchen-order-updated', handleKitchenOrderUpdated);
        on('new-order', handleNewOrder);
        on('kitchen-new-order', handleKitchenNewOrder);
        on('kitchen-add-items', handleAddItems);
        on('order-add-items', handleAddItems);

        // Cleanup
        return () => {
            console.log('🔌 useOrderRealtime unmounted - Removing socket listeners');
            off('order-list-updated', handleOrderListUpdated);
            off('order-item-updated', handleOrderItemUpdated);
            off('order-status-updated', handleOrderStatusUpdated);
            off('order-updated', handleOrderUpdated);
            off('kitchen-order-updated', handleKitchenOrderUpdated);
            off('new-order', handleNewOrder);
            off('kitchen-new-order', handleKitchenNewOrder);
            off('kitchen-add-items', handleAddItems);
            off('order-add-items', handleAddItems);
        };
    }, [on, off, queryClient]); // Thêm on, off vào dependencies

    return null;
};