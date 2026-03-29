import React, { useState, useEffect } from 'react';
import { Button, Modal, notification, Input, Select, Space, Tag, Card, Row, Col, message } from 'antd';
import {
    PlusOutlined,
    SearchOutlined,
    FilterOutlined,
    ReloadOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useQuery, useQueryClient } from 'react-query';
import { apiService } from '../services/api';
import OrderList from '../components/orders/OrderList';
import OrderDetail from '../components/orders/OrderDetail';
import OrderForm from '../components/orders/OrderForm';
import Loading from '../components/common/Loading';
import RoleGuard from '../components/common/RoleGuard';
import { usePermissions } from '../hooks/usePermissions';
import './OrdersPage.scss';
import socket from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import moment from 'moment';

const { Search } = Input;
const { Option } = Select;

const OrdersPage = () => {
    // State cho filters
    const [filters, setFilters] = useState({
        status: '',
        payment_status: 'unpaid',    // Mặc định lọc đơn chưa thanh toán
        table_number: '',             // Số bàn cần tìm
        today_only: true,             // Mặc định chỉ lấy đơn hôm nay
        page: 1,
        limit: 20
    });

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { can } = usePermissions();

    const selectedOrderId = selectedOrder?.id;
    const playNotificationSound = () => {
        if (soundEnabled) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(e => console.log('Audio play failed:', e));
        }
    };
    // Socket event handlers (giữ nguyên như cũ)
    useEffect(() => {
        // ... giữ nguyên các socket handlers của bạn ...
        const handleNewOrder = (data) => {
            playNotificationSound();
            notification.info({
                message: 'Đơn hàng mới',
                description: `Bàn ${data.tableNumber || data.order?.table?.table_number} vừa đặt món`,
                placement: 'topRight',
                duration: 4.5
            });
            queryClient.invalidateQueries('orders');
        };

        const handleNewTakeawayOrder = (data) => {
            playNotificationSound();
            notification.success({
                message: 'Đơn takeaway mới',
                description: `Mã QR: ${data.takeawayCode} - ${data.order?.items?.length || 0} món`,
                placement: 'topRight',
                duration: 5
            });
            queryClient.invalidateQueries('orders');

            if (user?.role === 'kitchen') {
                queryClient.invalidateQueries('kitchenOrders');
            }
        };

        const handleKitchenNewOrder = (data) => {
            playNotificationSound();
            if (user?.role === 'kitchen' || user?.role === 'admin') {

                const orderType = data.orderType === 'takeaway' ? '🥡 Takeaway' : '🍽️ Bàn ăn';
                notification.info({
                    message: `${orderType} - Món mới cần chế biến`,
                    description: `${data.items?.length} món - ${data.estimatedTime} phút`,
                    placement: 'topRight',
                    duration: 5
                });
                queryClient.invalidateQueries('kitchenOrders');
            }
        };

        const handleKitchenAddItems = (data) => {
            playNotificationSound();
            notification.info({
                message: 'Khách gọi thêm món',
                description: `Bàn ${data.tableNumber} gọi thêm ${data.items?.length} món`,
                placement: 'topRight',
                duration: 5
            });

            queryClient.invalidateQueries('orders');
            queryClient.invalidateQueries('kitchenOrders');

            if (selectedOrderId && selectedOrderId === data.orderId) {
                queryClient.invalidateQueries(['order', selectedOrderId]);
            }
        };

        const handleOrderUpdated = (data) => {
            playNotificationSound();
            if (data?.newItems) {

                notification.info({
                    message: 'Khách gọi thêm món',
                    description: `Bàn ${data.order?.table?.table_number || ''} gọi thêm ${data.newItems} món`,
                    placement: 'topRight',
                    duration: 5
                });
            }

            queryClient.invalidateQueries('orders');

            const updatedOrderId = data.orderId || data.order?.id;
            if (selectedOrderId && selectedOrderId === updatedOrderId) {
                queryClient.invalidateQueries(['order', selectedOrderId]);
            }
        };

        const handleOrderStatusUpdated = (data) => {
            if (data?.status === 'ready') {
                playNotificationSound();
                message.success(
                    `🔔 Món ${data.menuItemName} - Bàn ${data.tableNumber || '--'} đã chế biến xong`,
                    5
                );
            }
            queryClient.invalidateQueries('orders');

            const updatedOrderId = data.orderId || data.order?.id;
            if (selectedOrderId && selectedOrderId === updatedOrderId) {
                queryClient.invalidateQueries(['order', selectedOrderId]);
            }
        };

        const handleOrderItemUpdated = (data) => {

            queryClient.invalidateQueries('orders');

            if (selectedOrderId && selectedOrderId === data.orderId) {
                queryClient.invalidateQueries(['order', selectedOrderId]);
            }
        };

        const handleOrderListUpdated = (data) => {
            queryClient.invalidateQueries('orders');

            if (selectedOrderId && selectedOrderId === data.orderId) {
                queryClient.invalidateQueries(['order', selectedOrderId]);
            }
        };

        const handleNotification = (data) => {
            if (data.source !== 'new-order' && data.source !== 'new-takeaway-order') {

                notification[data.type || 'info']({
                    message: data.title || 'Thông báo',
                    description: data.message,
                    placement: 'topRight',
                    duration: data.duration || 4.5
                });
            }
        };

        socket.on('new-order', handleNewOrder);
        socket.on('new-takeaway-order', handleNewTakeawayOrder);
        socket.on('kitchen-new-order', handleKitchenNewOrder);
        socket.on('kitchen-add-items', handleKitchenAddItems);
        socket.on('order-updated', handleOrderUpdated);
        socket.on('order-status-updated', handleOrderStatusUpdated);
        socket.on('order-item-updated', handleOrderItemUpdated);
        socket.on('order-list-updated', handleOrderListUpdated);
        socket.on('notification', handleNotification);

        return () => {
            socket.off('new-order', handleNewOrder);
            socket.off('new-takeaway-order', handleNewTakeawayOrder);
            socket.off('kitchen-new-order', handleKitchenNewOrder);
            socket.off('kitchen-add-items', handleKitchenAddItems);
            socket.off('order-updated', handleOrderUpdated);
            socket.off('order-status-updated', handleOrderStatusUpdated);
            socket.off('order-item-updated', handleOrderItemUpdated);
            socket.off('order-list-updated', handleOrderListUpdated);
            socket.off('notification', handleNotification);
        };
    }, [queryClient, user, selectedOrderId]);

    // Fetch orders với filters
    const { data, isLoading, refetch } = useQuery(
        ['orders', filters],
        () => apiService.getOrders(filters).then(res => res.data),
        { keepPreviousData: true }
    );

    const handleViewDetail = (order) => {
        setSelectedOrder(order);
        setDetailVisible(true);
    };

    const handleCreateOrder = () => {
        setSelectedOrder(null);
        setFormVisible(true);
    };

    const handleEditOrder = (order) => {
        setSelectedOrder(order);
        setFormVisible(true);
    };

    const handleOrderUpdatedSuccess = () => {
        setDetailVisible(false);
        setFormVisible(false);
        setSelectedOrder(null);
        queryClient.invalidateQueries('orders');
    };

    // Xử lý tìm kiếm theo số bàn
    const handleTableSearch = (value) => {
        setFilters({
            ...filters,
            table_number: value,
            page: 1
        });
    };

    // Xử lý thay đổi trạng thái thanh toán
    const handlePaymentStatusChange = (value) => {
        setFilters({
            ...filters,
            payment_status: value,
            page: 1
        });
    };

    // Xử lý toggle chỉ xem đơn hôm nay
    const handleTodayOnlyToggle = (checked) => {
        setFilters({
            ...filters,
            today_only: checked,
            page: 1
        });
    };

    // Xử lý thay đổi trạng thái đơn
    const handleStatusChange = (value) => {
        setFilters({
            ...filters,
            status: value,
            page: 1
        });
    };

    // Reset tất cả filters
    const handleResetFilters = () => {
        setFilters({
            status: '',
            payment_status: 'unpaid',
            table_number: '',
            today_only: true,
            page: 1,
            limit: 20
        });
    };

    // Xóa một filter cụ thể
    const removeFilter = (filterName) => {
        switch (filterName) {
            case 'table_number':
                setFilters({ ...filters, table_number: '', page: 1 });
                break;
            case 'payment_status':
                setFilters({ ...filters, payment_status: '', page: 1 });
                break;
            case 'today_only':
                setFilters({ ...filters, today_only: false, page: 1 });
                break;
            case 'status':
                setFilters({ ...filters, status: '', page: 1 });
                break;
            default:
                break;
        }
    };

    if (isLoading && !data) {
        return <Loading />;
    }

    const orders = data?.data || [];
    const pagination = data?.pagination;
    const today = moment().format('DD/MM/YYYY');

    return (
        <RoleGuard roles={['admin', 'manager', 'receptionist']}>
            <div className="orders-page">
                <div className="page-header">
                    <h1>Quản lý đơn hàng</h1>
                    {can('createOrder') && (
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateOrder}
                        >
                            Tạo đơn mới
                        </Button>
                    )}
                </div>

                {/* Filter Section */}
                <Card className="filters-card">
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                            <div className="filter-label">Số bàn</div>
                            <Search
                                placeholder="Nhập số bàn..."
                                allowClear
                                enterButton={<SearchOutlined />}
                                onSearch={handleTableSearch}
                                defaultValue={filters.table_number}
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        handleTableSearch('');
                                    }
                                }}
                            />
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="filter-label">Trạng thái thanh toán</div>
                            <Select
                                style={{ width: '100%' }}
                                value={filters.payment_status}
                                onChange={handlePaymentStatusChange}
                                placeholder="Chọn trạng thái"
                            >
                                <Option value="">Tất cả</Option>
                                <Option value="unpaid">Chưa thanh toán</Option>
                                <Option value="paid">Đã thanh toán</Option>
                                <Option value="partial">Thanh toán một phần</Option>
                            </Select>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="filter-label">Ngày</div>
                            <Space>
                                <Button
                                    type={filters.today_only ? 'primary' : 'default'}
                                    icon={<CalendarOutlined />}
                                    onClick={() => handleTodayOnlyToggle(true)}
                                >
                                    Hôm nay ({today})
                                </Button>
                                <Button
                                    type={!filters.today_only ? 'primary' : 'default'}
                                    onClick={() => handleTodayOnlyToggle(false)}
                                >
                                    Tất cả
                                </Button>
                            </Space>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                            <div className="filter-label">Thao tác</div>
                            <Space>
                                <Button
                                    icon={<FilterOutlined />}
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                >
                                    Nâng cao
                                </Button>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={handleResetFilters}
                                >
                                    Đặt lại
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                            <Col xs={24} sm={12} md={8}>
                                <div className="filter-label">Trạng thái đơn</div>
                                <Select
                                    style={{ width: '100%' }}
                                    value={filters.status}
                                    onChange={handleStatusChange}
                                    placeholder="Chọn trạng thái"
                                    allowClear
                                >
                                    <Option value="">Tất cả</Option>
                                    <Option value="pending">Chờ xác nhận</Option>
                                    <Option value="confirmed">Đã xác nhận</Option>
                                    <Option value="preparing">Đang chuẩn bị</Option>
                                    <Option value="ready">Sẵn sàng</Option>
                                    <Option value="served">Đã phục vụ</Option>
                                    <Option value="completed">Hoàn thành</Option>
                                    <Option value="cancelled">Đã hủy</Option>
                                </Select>
                            </Col>
                        </Row>
                    )}

                    {/* Active Filters Display */}
                    {(filters.table_number ||
                        filters.payment_status === 'unpaid' ||
                        filters.today_only ||
                        filters.status) && (
                            <div className="active-filters" style={{ marginTop: 16 }}>
                                <span>Bộ lọc đang áp dụng:</span>
                                {filters.table_number && (
                                    <Tag
                                        closable
                                        onClose={() => removeFilter('table_number')}
                                        color="blue"
                                    >
                                        Bàn số: {filters.table_number}
                                    </Tag>
                                )}
                                {filters.payment_status === 'unpaid' && (
                                    <Tag
                                        closable
                                        onClose={() => removeFilter('payment_status')}
                                        color="orange"
                                    >
                                        Chưa thanh toán
                                    </Tag>
                                )}
                                {filters.today_only && (
                                    <Tag
                                        closable
                                        onClose={() => removeFilter('today_only')}
                                        color="green"
                                    >
                                        Hôm nay ({today})
                                    </Tag>
                                )}
                                {filters.status && (
                                    <Tag
                                        closable
                                        onClose={() => removeFilter('status')}
                                        color="purple"
                                    >
                                        {filters.status === 'pending' && 'Chờ xác nhận'}
                                        {filters.status === 'confirmed' && 'Đã xác nhận'}
                                        {filters.status === 'preparing' && 'Đang chuẩn bị'}
                                        {filters.status === 'ready' && 'Sẵn sàng'}
                                        {filters.status === 'served' && 'Đã phục vụ'}
                                        {filters.status === 'completed' && 'Hoàn thành'}
                                        {filters.status === 'cancelled' && 'Đã hủy'}
                                    </Tag>
                                )}
                            </div>
                        )}
                </Card>

                <OrderList
                    orders={orders}
                    pagination={pagination}
                    loading={isLoading}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEditOrder}
                    filters={filters}
                    onFilterChange={setFilters}
                />

                <Modal
                    title="Chi tiết đơn hàng"
                    open={detailVisible}
                    onCancel={() => setDetailVisible(false)}
                    footer={null}
                    width={800}
                >
                    {selectedOrder && (
                        <OrderDetail
                            orderId={selectedOrder.id}
                            onClose={() => setDetailVisible(false)}
                            onEdit={() => {
                                setDetailVisible(false);
                                setFormVisible(true);
                            }}
                        />
                    )}
                </Modal>

                <Modal
                    title={selectedOrder ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'}
                    open={formVisible}
                    onCancel={() => {
                        setFormVisible(false);
                        setSelectedOrder(null);
                    }}
                    footer={null}
                    width={800}
                >
                    <OrderForm
                        initialValues={selectedOrder}
                        onSubmit={handleOrderUpdatedSuccess}
                        onCancel={() => {
                            setFormVisible(false);
                            setSelectedOrder(null);
                        }}
                    />
                </Modal>
            </div>
        </RoleGuard>
    );
};

export default OrdersPage;