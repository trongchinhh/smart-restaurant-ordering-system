import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, Badge, Space, Typography, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import KitchenOrderCard from '../components/orders/KitchenOrderCard';
import Loading from '../components/common/Loading';
import RoleGuard from '../components/common/RoleGuard';
import { SoundOutlined, ClockCircleOutlined, CheckCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import './KitchenPage.scss';

const { TabPane } = Tabs;
const { Title } = Typography;

const KitchenPage = () => {
    const [activeTab, setActiveTab] = useState('preparing');
    const [orders, setOrders] = useState([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    const queryClient = useQueryClient();
    const { on, off } = useSocket();

    const { data, isLoading } = useQuery(
        'kitchenOrders',
        () => apiService.getKitchenOrders().then(res => res.data),
        {
            onSuccess: (data) => {
                setOrders(data.data || []);
            }
        }
    );

    const updateItemStatusMutation = useMutation(
        ({ orderId, itemId, status }) =>
            apiService.updateOrderItemStatus(orderId, itemId, status),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('kitchenOrders');
                message.success('Cập nhật trạng thái thành công');
            },
            onError: () => {
                message.error('Cập nhật thất bại');
            }
        }
    );

    // Sắp xếp đơn hàng theo thứ tự ưu tiên
    const sortedOrders = useMemo(() => {
        if (!orders.length) return [];

        return [...orders].sort((a, b) => {
            // 1. Đơn có món mới lên trước
            const aHasNew = a.items?.some(i => i.is_new && i.status !== 'ready' && i.status !== 'served') || false;
            const bHasNew = b.items?.some(i => i.is_new && i.status !== 'ready' && i.status !== 'served') || false;
            if (aHasNew && !bHasNew) return -1;
            if (!aHasNew && bHasNew) return 1;

            // 2. Đơn có độ ưu tiên cao hơn
            const priorityOrder = { urgent: 1, high: 2, normal: 3 };
            const aPriority = priorityOrder[a.priority] || 3;
            const bPriority = priorityOrder[b.priority] || 3;
            if (aPriority !== bPriority) return aPriority - bPriority;

            // 3. Đơn có thời gian tạo sớm hơn lên trước
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }, [orders]);

    // Lọc các item đang chế biến (pending và preparing)
    const preparingItems = useMemo(() => {
        const items = [];
        sortedOrders.forEach(order => {
            const orderItems = order.items?.filter(item =>
                //item.status === 'pending' ||
                item.status === 'preparing'
            ) || [];

            if (orderItems.length > 0) {
                items.push({
                    ...order,
                    items: orderItems // Chỉ giữ lại các item đang chế biến
                });
            }
        });
        return items;
    }, [sortedOrders]);

    // Lọc các item đã hoàn thành (ready và served)
    const readyItems = useMemo(() => {
        const items = [];
        sortedOrders.forEach(order => {
            const orderItems = order.items?.filter(item =>
                item.status === 'ready' || item.status === 'served'
            ) || [];

            if (orderItems.length > 0) {
                items.push({
                    ...order,
                    items: orderItems // Chỉ giữ lại các item đã hoàn thành
                });
            }
        });
        return items;
    }, [sortedOrders]);

    const playNotificationSound = () => {
        if (soundEnabled) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    useEffect(() => {
        const handleKitchenNewOrder = () => {
            // Không thông báo ngay khi vừa tạo order
            queryClient.invalidateQueries('kitchenOrders');
        };

        const handleKitchenAddItems = () => {
            // Không thông báo ngay khi vừa gọi thêm món
            queryClient.invalidateQueries('kitchenOrders');
        };

        const handleOrderItemUpdated = (data) => {

            if (data?.status === 'preparing') {
                playNotificationSound();
                message.success(
                    `🔔 Món ${data.menuItemName} - Bàn ${data.tableNumber || '--'} đã được xác nhận`,
                    5
                );
            }
            // Chỉ refetch, không kêu chuông mỗi lần đổi trạng thái item
            queryClient.invalidateQueries('kitchenOrders');
        };

        const handleKitchenOrderUpdated = (data) => {
            queryClient.invalidateQueries('kitchenOrders');

            // // CHỈ thông báo khi order được xác nhận
            // if (data?.status === 'preparing') {
            //     playNotificationSound();
            //     message.success(
            //         `🔔 Đơn ${data.orderNumber} - Bàn ${data.tableNumber || '--'} đã được xác nhận`,
            //         5
            //     );
            // }
        };

        const handleOrderListUpdated = () => {
            queryClient.invalidateQueries('kitchenOrders');
        };

        on('kitchen-new-order', handleKitchenNewOrder);
        on('kitchen-add-items', handleKitchenAddItems);
        on('order-item-updated', handleOrderItemUpdated);
        on('kitchen-order-updated', handleKitchenOrderUpdated);
        on('order-list-updated', handleOrderListUpdated);

        return () => {
            off('kitchen-new-order', handleKitchenNewOrder);
            off('kitchen-add-items', handleKitchenAddItems);
            off('order-item-updated', handleOrderItemUpdated);
            off('kitchen-order-updated', handleKitchenOrderUpdated);
            off('order-list-updated', handleOrderListUpdated);
        };
    }, [on, off, queryClient, soundEnabled]);

    const handleUpdateItemStatus = (orderId, itemId, status) => {
        updateItemStatusMutation.mutate({ orderId, itemId, status });
    };

    // Thống kê chính xác theo item
    const totalPreparing = preparingItems.reduce((total, order) => {
        return total + (order.items?.filter(i => i.status === 'preparing').length || 0);
    }, 0);

    const totalPending = preparingItems.reduce((total, order) => {
        return total + (order.items?.filter(i => i.status === 'pending').length || 0);
    }, 0);

    const totalNewItems = preparingItems.reduce((total, order) => {
        return total + (order.items?.filter(item => item.is_new && item.status === 'pending').length || 0);
    }, 0);

    const totalReady = readyItems.reduce((total, order) => {
        return total + (order.items?.filter(i => i.status === 'ready' || i.status === 'served').length || 0);
    }, 0);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <RoleGuard roles={['admin', 'manager', 'kitchen']}>
            <div className="kitchen-page">
                <div className="page-header">
                    <Title level={2}>
                        <SoundOutlined /> Khu vực bếp
                    </Title>
                    <Space size="large" className="stats">
                        {/* <div className="stat-card">
                            <span className="stat-label">Chờ chế biến</span>
                            <span className="stat-number">{totalPending}</span>
                        </div> */}
                        <div className="stat-card">
                            <span className="stat-label">Đang chế biến</span>
                            <span className="stat-number" style={{ color: '#1890ff' }}>
                                {totalPreparing}
                            </span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-label">Hoàn thành</span>
                            <span className="stat-number">{totalReady}</span>
                        </div>
                        {totalNewItems > 0 && (
                            <div className="stat-card urgent">
                                <span className="stat-label">Món mới</span>
                                <span className="stat-number">+{totalNewItems}</span>
                            </div>
                        )}
                    </Space>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab} className="kitchen-tabs">
                    <TabPane
                        tab={
                            <span>
                                Đang chế biến
                                <Badge count={preparingItems.length} style={{ marginLeft: 8 }} />
                            </span>
                        }
                        key="preparing"
                    >
                        <div className="orders-grid">
                            {preparingItems.length > 0 ? (
                                preparingItems.map(order => (
                                    <KitchenOrderCard
                                        key={order.id}
                                        order={order}
                                        onUpdateStatus={handleUpdateItemStatus}
                                    />
                                ))
                            ) : (
                                <div className="empty-card">
                                    <ClockCircleOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                                    <p>Không có món nào đang chế biến</p>
                                </div>
                            )}
                        </div>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                Hoàn thành
                                <Badge count={readyItems.length} style={{ marginLeft: 8 }} />
                            </span>
                        }
                        key="ready"
                    >
                        <div className="orders-grid">
                            {readyItems.length > 0 ? (
                                readyItems.map(order => (
                                    <KitchenOrderCard
                                        key={order.id}
                                        order={order}
                                        onUpdateStatus={handleUpdateItemStatus}
                                    />
                                ))
                            ) : (
                                <div className="empty-card">
                                    <CheckCircleOutlined style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
                                    <p>Chưa có món nào hoàn thành</p>
                                </div>
                            )}
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </RoleGuard>
    );
};

export default KitchenPage;