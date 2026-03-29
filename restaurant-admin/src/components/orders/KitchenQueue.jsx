import React, { useState, useEffect } from 'react';
import {
    Row, Col, Card, Tabs, Badge, Space,
    Typography, Progress, Tag, Button, Modal,
    List, Avatar, Tooltip, Empty, Spin
} from 'antd';
import {
    ClockCircleOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    SoundOutlined,
    ReloadOutlined,
    FilterOutlined,
    SortAscendingOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiService } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { useNotification } from '../../hooks/useNotification';
import moment from 'moment';
import './KitchenQueue.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { confirm } = Modal;

const KitchenQueue = () => {
    const [activeTab, setActiveTab] = useState('pending');
    const [orders, setOrders] = useState([]);
    const [filterPriority, setFilterPriority] = useState('all');
    const [sortBy, setSortBy] = useState('time'); // time, priority
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    const queryClient = useQueryClient();
    const { showSuccess, showError, showInfo } = useNotification();
    const { on, off, emit } = useSocket();

    // Audio notification
    const playNotificationSound = () => {
        if (!audioEnabled) return;
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(e => console.log('Audio play failed:', e));
    };

    // Fetch kitchen orders
    const { data, isLoading, refetch } = useQuery(
        'kitchenOrders',
        () => apiService.getKitchenOrders().then(res => res.data),
        {
            onSuccess: (data) => {
                setOrders(data.data || []);
            },
            onError: (error) => {
                showError('Không thể tải danh sách đơn hàng');
            }
        }
    );

    // Update item status mutation
    const updateItemStatusMutation = useMutation(
        ({ orderId, itemId, status }) =>
            apiService.updateOrderItemStatus(orderId, itemId, { status }),
        {
            onSuccess: (data) => {
                queryClient.invalidateQueries('kitchenOrders');
                showSuccess('Cập nhật trạng thái món thành công');

                // Check if all items are completed
                const order = orders.find(o => o.id === data.data.order_id);
                if (order) {
                    const allCompleted = order.items.every(item =>
                        item.id === data.data.id ? data.data.status === 'ready' : ['ready', 'served'].includes(item.status)
                    );
                    if (allCompleted) {
                        showInfo('Tất cả các món đã hoàn thành!');
                        playNotificationSound();
                    }
                }
            },
            onError: (error) => {
                showError(error.response?.data?.message || 'Cập nhật thất bại');
            }
        }
    );

    // Update order status mutation
    const updateOrderStatusMutation = useMutation(
        ({ id, status }) => apiService.updateOrderStatus(id, { status }),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('kitchenOrders');
            }
        }
    );

    // Socket event listeners
    useEffect(() => {
        on('kitchen-new-order', (data) => {
            showInfo('Đơn hàng mới!', `Bàn ${data.tableNumber} - ${data.orderNumber}`);
            playNotificationSound();
            queryClient.invalidateQueries('kitchenOrders');
        });

        on('kitchen-order-updated', (data) => {
            queryClient.invalidateQueries('kitchenOrders');
        });

        on('order-item-updated', (data) => {
            queryClient.invalidateQueries('kitchenOrders');
        });

        return () => {
            off('kitchen-new-order');
            off('kitchen-order-updated');
            off('order-item-updated');
        };
    }, [on, off, queryClient, showInfo]);

    // Filter and sort orders
    const getFilteredOrders = () => {
        let filtered = [...orders];

        // Filter by priority
        if (filterPriority !== 'all') {
            filtered = filtered.filter(order => order.priority === filterPriority);
        }

        // Filter by tab
        filtered = filtered.filter(order => {
            if (activeTab === 'pending') {
                return order.items.some(item => item.status === 'pending');
            } else if (activeTab === 'preparing') {
                return order.items.some(item => item.status === 'preparing');
            } else if (activeTab === 'ready') {
                return order.items.some(item => item.status === 'ready');
            }
            return true;
        });

        // Sort orders
        filtered.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorityWeight = { urgent: 3, high: 2, normal: 1 };
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            // Sort by time (oldest first)
            return moment(a.createdAt).valueOf() - moment(b.createdAt).valueOf();
        });

        return filtered;
    };

    // Handle item status update
    const handleUpdateItemStatus = (orderId, itemId, currentStatus) => {
        let nextStatus;
        switch (currentStatus) {
            case 'pending':
                nextStatus = 'preparing';
                break;
            case 'preparing':
                nextStatus = 'ready';
                break;
            default:
                return;
        }

        confirm({
            title: 'Xác nhận cập nhật',
            icon: <ExclamationCircleOutlined />,
            content: `Chuyển trạng thái món sang ${nextStatus === 'preparing' ? 'đang chế biến' : 'đã hoàn thành'}?`,
            onOk() {
                updateItemStatusMutation.mutate({ orderId, itemId, status: nextStatus });
            }
        });
    };

    // Handle bulk update
    const handleBulkUpdate = (orderId, status) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const itemIds = order.items
            .filter(item => item.status === 'pending' || item.status === 'preparing')
            .map(item => item.id);

        if (itemIds.length === 0) return;

        confirm({
            title: 'Xác nhận cập nhật hàng loạt',
            icon: <ExclamationCircleOutlined />,
            content: `Cập nhật ${itemIds.length} món sang trạng thái ${status === 'preparing' ? 'đang chế biến' : 'đã hoàn thành'}?`,
            onOk() {
                Promise.all(
                    itemIds.map(itemId =>
                        updateItemStatusMutation.mutateAsync({ orderId, itemId, status })
                    )
                ).then(() => {
                    showSuccess('Cập nhật thành công');
                });
            }
        });
    };

    // Get statistics
    const getStatistics = () => {
        const stats = {
            total: orders.length,
            pending: 0,
            preparing: 0,
            ready: 0,
            urgent: 0,
            high: 0
        };

        orders.forEach(order => {
            if (order.priority === 'urgent') stats.urgent++;
            if (order.priority === 'high') stats.high++;

            order.items.forEach(item => {
                if (item.status === 'pending') stats.pending++;
                if (item.status === 'preparing') stats.preparing++;
                if (item.status === 'ready') stats.ready++;
            });
        });

        return stats;
    };

    const stats = getStatistics();
    const filteredOrders = getFilteredOrders();

    const getPriorityColor = (priority) => {
        const colors = {
            normal: 'blue',
            high: 'orange',
            urgent: 'red'
        };
        return colors[priority] || 'blue';
    };

    const getPriorityText = (priority) => {
        const texts = {
            normal: 'Bình thường',
            high: 'Ưu tiên',
            urgent: 'Gấp'
        };
        return texts[priority] || priority;
    };

    const getItemStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            preparing: 'processing',
            ready: 'success',
            served: 'default',
            cancelled: 'error'
        };
        return colors[status] || 'default';
    };

    const getItemStatusText = (status) => {
        const texts = {
            pending: 'Chờ',
            preparing: 'Đang làm',
            ready: 'Xong',
            served: 'Đã phục vụ',
            cancelled: 'Hủy'
        };
        return texts[status] || status;
    };

    const calculateTimeElapsed = (createdAt) => {
        const minutes = moment().diff(moment(createdAt), 'minutes');
        return minutes;
    };

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const completed = items.filter(item =>
            ['ready', 'served'].includes(item.status)
        ).length;
        return Math.round((completed / items.length) * 100);
    };

    if (isLoading) {
        return (
            <div className="kitchen-queue-loading">
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    return (
        <div className="kitchen-queue">
            {/* Header */}
            <div className="queue-header">
                <div className="header-left">
                    <Title level={2}>Khu vực bếp</Title>
                    <Space className="stats-badges">
                        <Badge count={stats.pending} showZero>
                            <Tag color="warning" className="stat-tag">Chờ chế biến</Tag>
                        </Badge>
                        <Badge count={stats.preparing} showZero color="blue">
                            <Tag color="processing" className="stat-tag">Đang chế biến</Tag>
                        </Badge>
                        <Badge count={stats.ready} showZero color="green">
                            <Tag color="success" className="stat-tag">Đã hoàn thành</Tag>
                        </Badge>
                        <Badge count={stats.urgent} showZero color="red">
                            <Tag color="error" className="stat-tag">Món gấp</Tag>
                        </Badge>
                    </Space>
                </div>

                <div className="header-right">
                    <Space>
                        <Tooltip title={audioEnabled ? "Tắt âm thanh" : "Bật âm thanh"}>
                            <Button
                                icon={<SoundOutlined />}
                                type={audioEnabled ? 'primary' : 'default'}
                                onClick={() => setAudioEnabled(!audioEnabled)}
                            />
                        </Tooltip>
                        <Tooltip title="Làm mới">
                            <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
                        </Tooltip>
                        <Tooltip title="Sắp xếp theo">
                            <Button
                                icon={<SortAscendingOutlined />}
                                onClick={() => setSortBy(sortBy === 'time' ? 'priority' : 'time')}
                            >
                                {sortBy === 'time' ? 'Thời gian' : 'Ưu tiên'}
                            </Button>
                        </Tooltip>
                        <Tooltip title="Lọc theo ưu tiên">
                            <Button
                                icon={<FilterOutlined />}
                                onClick={() => {
                                    const priorities = ['all', 'normal', 'high', 'urgent'];
                                    const currentIndex = priorities.indexOf(filterPriority);
                                    const nextIndex = (currentIndex + 1) % priorities.length;
                                    setFilterPriority(priorities[nextIndex]);
                                }}
                            >
                                {filterPriority === 'all' ? 'Tất cả' : getPriorityText(filterPriority)}
                            </Button>
                        </Tooltip>
                    </Space>
                </div>
            </div>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="queue-tabs"
            >
                <TabPane
                    tab={
                        <span>
                            Chờ chế biến
                            <Badge count={stats.pending} className="tab-badge" />
                        </span>
                    }
                    key="pending"
                />
                <TabPane
                    tab={
                        <span>
                            Đang chế biến
                            <Badge count={stats.preparing} className="tab-badge" />
                        </span>
                    }
                    key="preparing"
                />
                <TabPane
                    tab={
                        <span>
                            Đã hoàn thành
                            <Badge count={stats.ready} className="tab-badge" />
                        </span>
                    }
                    key="ready"
                />
            </Tabs>

            {/* Queue Grid */}
            {filteredOrders.length === 0 ? (
                <Empty
                    description="Không có đơn hàng nào trong danh sách"
                    className="empty-queue"
                />
            ) : (
                <Row gutter={[16, 16]} className="queue-grid">
                    {filteredOrders.map(order => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={order.id}>
                            <Card
                                className={`order-card priority-${order.priority} ${calculateTimeElapsed(order.createdAt) > (order.estimated_time || 15) ? 'overdue' : ''
                                    }`}
                                title={
                                    <div className="order-card-header">
                                        <Space>
                                            <span className="order-number">#{order.order_number}</span>
                                            <Tag color={getPriorityColor(order.priority)}>
                                                {getPriorityText(order.priority)}
                                            </Tag>
                                        </Space>
                                        <Badge
                                            count={order.items.filter(i => i.status === 'pending').length}
                                            className="pending-count"
                                        />
                                    </div>
                                }
                                extra={
                                    <Tooltip title="Xem chi tiết">
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setDetailVisible(true);
                                            }}
                                        >
                                            Chi tiết
                                        </Button>
                                    </Tooltip>
                                }
                            >
                                <div className="order-info">
                                    <div className="table-badge">
                                        <Tag color="blue">Bàn {order.table?.table_number}</Tag>
                                        <Tag>{order.customer_count} người</Tag>
                                    </div>

                                    <div className="time-info">
                                        <ClockCircleOutlined />
                                        <span>{moment(order.createdAt).format('HH:mm')}</span>
                                        <span className={`time-elapsed ${calculateTimeElapsed(order.createdAt) > (order.estimated_time || 15) ? 'overdue' : ''
                                            }`}>
                                            ({calculateTimeElapsed(order.createdAt)}/{order.estimated_time || 15} phút)
                                        </span>
                                    </div>

                                    <Progress
                                        percent={calculateProgress(order.items)}
                                        size="small"
                                        status={calculateProgress(order.items) === 100 ? 'success' : 'active'}
                                        className="order-progress"
                                    />
                                </div>

                                <List
                                    className="items-list"
                                    dataSource={order.items}
                                    renderItem={item => (
                                        <List.Item className={`item-row status-${item.status}`}>
                                            <div className="item-info">
                                                <div className="item-name">
                                                    {item.menuItem?.name}
                                                    {item.quantity > 1 && (
                                                        <span className="item-quantity"> x{item.quantity}</span>
                                                    )}
                                                </div>
                                                {item.note && (
                                                    <div className="item-note">
                                                        <WarningOutlined /> {item.note}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="item-actions">
                                                <Tag color={getItemStatusColor(item.status)}>
                                                    {getItemStatusText(item.status)}
                                                </Tag>
                                                {['pending', 'preparing'].includes(item.status) && (
                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        icon={<CheckCircleOutlined />}
                                                        onClick={() => handleUpdateItemStatus(order.id, item.id, item.status)}
                                                    >
                                                        {item.status === 'pending' ? 'Bắt đầu' : 'Hoàn thành'}
                                                    </Button>
                                                )}
                                            </div>
                                        </List.Item>
                                    )}
                                />

                                <div className="order-footer">
                                    {order.items.some(i => ['pending', 'preparing'].includes(i.status)) && (
                                        <Button
                                            type="primary"
                                            block
                                            onClick={() => handleBulkUpdate(
                                                order.id,
                                                activeTab === 'pending' ? 'preparing' : 'ready'
                                            )}
                                        >
                                            {activeTab === 'pending' ? 'Bắt đầu tất cả' : 'Hoàn thành tất cả'}
                                        </Button>
                                    )}
                                    {order.note && (
                                        <div className="order-note">
                                            <WarningOutlined /> {order.note}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            {/* Order Detail Modal */}
            <Modal
                title={`Chi tiết đơn hàng #${selectedOrder?.order_number}`}
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={600}
                className="order-detail-modal"
            >
                {selectedOrder && (
                    <div className="modal-content">
                        <div className="modal-header">
                            <Space>
                                <Tag color="blue">Bàn {selectedOrder.table?.table_number}</Tag>
                                <Tag color={getPriorityColor(selectedOrder.priority)}>
                                    {getPriorityText(selectedOrder.priority)}
                                </Tag>
                                <Tag>Thời gian: {moment(selectedOrder.createdAt).format('HH:mm DD/MM')}</Tag>
                            </Space>
                        </div>

                        <List
                            className="modal-items-list"
                            header={<div className="list-header">Danh sách món</div>}
                            dataSource={selectedOrder.items}
                            renderItem={item => (
                                <List.Item className="modal-item">
                                    <div className="modal-item-info">
                                        <div className="modal-item-name">
                                            {item.menuItem?.name}
                                            <span className="modal-item-quantity"> x{item.quantity}</span>
                                        </div>
                                        {item.note && (
                                            <div className="modal-item-note">
                                                <WarningOutlined /> {item.note}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-item-status">
                                        <Tag color={getItemStatusColor(item.status)}>
                                            {getItemStatusText(item.status)}
                                        </Tag>
                                        {item.started_at && (
                                            <div className="item-time">
                                                Bắt đầu: {moment(item.started_at).format('HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />

                        {selectedOrder.note && (
                            <div className="modal-note">
                                <strong>Ghi chú:</strong> {selectedOrder.note}
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

// KitchenQueue styles
const styles = `
.kitchen-queue {
  padding: 24px;
  
  .queue-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .stats-badges {
      margin-left: 24px;
      
      .stat-tag {
        font-size: 14px;
        padding: 4px 12px;
      }
    }
  }
  
  .queue-tabs {
    .tab-badge {
      margin-left: 8px;
    }
  }
  
  .queue-grid {
    margin-top: 24px;
  }
  
  .order-card {
    height: 100%;
    transition: all 0.3s;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    &.priority-urgent {
      border-left: 4px solid #f5222d;
    }
    
    &.priority-high {
      border-left: 4px solid #fa8c16;
    }
    
    &.overdue {
      background: #fff1f0;
    }
    
    .order-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .order-number {
        font-weight: 600;
        font-size: 16px;
      }
    }
    
    .order-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
      
      .table-badge {
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .time-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;
        
        .time-elapsed {
          &.overdue {
            color: #f5222d;
            font-weight: 600;
          }
        }
      }
    }
    
    .items-list {
      max-height: 250px;
      overflow-y: auto;
      margin-bottom: 12px;
      
      .item-row {
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;
        
        &:hover {
          background: #fafafa;
        }
        
        &.status-pending {
          background: #fff7e6;
        }
        
        &.status-preparing {
          background: #e6f7ff;
        }
        
        .item-info {
          flex: 1;
          
          .item-name {
            font-weight: 500;
            
            .item-quantity {
              color: #1890ff;
              font-weight: 600;
            }
          }
          
          .item-note {
            color: #fa8c16;
            font-size: 12px;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
        
        .item-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
    
    .order-footer {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
      
      .order-note {
        margin-top: 8px;
        padding: 8px;
        background: #fff7e6;
        border-radius: 4px;
        color: #fa8c16;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }
  
  .empty-queue {
    margin-top: 48px;
  }
}

.order-detail-modal {
  .modal-header {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .modal-items-list {
    max-height: 400px;
    overflow-y: auto;
    
    .list-header {
      font-weight: 600;
      color: #1890ff;
    }
    
    .modal-item {
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      
      .modal-item-info {
        flex: 1;
        
        .modal-item-name {
          font-weight: 500;
          
          .modal-item-quantity {
            color: #1890ff;
          }
        }
        
        .modal-item-note {
          color: #fa8c16;
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
      
      .modal-item-status {
        text-align: right;
        
        .item-time {
          font-size: 11px;
          color: #8c8c8c;
          margin-top: 4px;
        }
      }
    }
  }
  
  .modal-note {
    margin-top: 16px;
    padding: 12px;
    background: #fff7e6;
    border-radius: 4px;
    color: #fa8c16;
  }
}

.kitchen-queue-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
`;

// Inject styles
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default KitchenQueue;