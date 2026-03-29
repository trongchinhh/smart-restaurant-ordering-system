import React, { useState, useEffect, useMemo } from 'react';
import { Card, Tag, Button, Progress, Badge, Alert, Tooltip, Divider, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    WarningOutlined,
    FireOutlined,
    CoffeeOutlined,
    PlusCircleOutlined,
    EnvironmentOutlined,
    LoadingOutlined,
    ShopOutlined,
    CarryOutOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/vi';
import './KitchenOrderCard.scss';

const { Text } = Typography;

const KitchenOrderCard = ({ order, onUpdateStatus }) => {
    const [timeElapsed, setTimeElapsed] = useState(0);

    // ========== ĐỊNH NGHĨA TẤT CẢ HÀM HELPER TRƯỚC KHI SỬ DỤNG ==========

    // Tính thời gian tạo của món (phút)
    const getItemAge = (createdAt) => {
        if (!createdAt) return 0;
        return moment().diff(moment(createdAt), 'minutes');
    };

    // Format thời gian tạo món
    const formatItemTime = (createdAt) => {
        if (!createdAt) return '';
        return moment(createdAt).format('HH:mm:ss');
    };

    // Lấy màu sắc cho thời gian chờ
    const getWaitingColor = (status, age) => {
        if (status === 'pending') {
            if (age >= 15) return '#ff4d4f';
            if (age >= 10) return '#fa8c16';
            if (age >= 5) return '#faad14';
        }
        if (status === 'preparing') {
            if (age >= 20) return '#ff4d4f';
            if (age >= 15) return '#fa8c16';
        }
        return '#52c41a';
    };

    // Lấy icon cho thời gian chờ
    const getWaitingIcon = (status, age) => {
        if (status === 'pending') {
            if (age >= 10) return <WarningOutlined />;
            return <ClockCircleOutlined />;
        }
        if (status === 'preparing') {
            if (age >= 15) return <LoadingOutlined spin />;
            return <CoffeeOutlined />;
        }
        return <CheckCircleOutlined />;
    };

    // Lấy text và icon cho order type
    const getOrderTypeInfo = (orderType) => {
        const types = {
            dine_in: {
                text: 'Tại chỗ',
                icon: <ShopOutlined />,
                color: '#1890ff',
                bgColor: '#e6f7ff'
            },
            takeaway: {
                text: 'Mang về',
                icon: <CarryOutOutlined />,
                color: '#52c41a',
                bgColor: '#f6ffed'
            }
        };
        return types[orderType] || types.dine_in;
    };

    // Format item options với size, đường, đá rõ ràng
    const formatItemOptions = (item) => {
        try {
            const options = item.options ? JSON.parse(item.options) : null;
            if (!options) return null;

            const optionsList = [];

            // Hiển thị SIZE nổi bật
            if (options.size) {
                let sizeDisplay = '';
                switch (options.size) {
                    case 'small': sizeDisplay = '📏 Size S (Nhỏ)'; break;
                    case 'medium': sizeDisplay = '📏 Size M (Vừa)'; break;
                    case 'large': sizeDisplay = '📏 Size L (Lớn)'; break;
                    default: sizeDisplay = `📏 Size: ${options.size}`;
                }
                optionsList.push(sizeDisplay);
            }

            // Hiển thị ĐƯỜNG rõ ràng
            if (options.sugar) {
                let sugarDisplay = '';
                switch (options.sugar) {
                    case '0': sugarDisplay = '🍬 0% (Không đường)'; break;
                    case '30': sugarDisplay = '🍬 30% (Ít đường)'; break;
                    case '50': sugarDisplay = '🍬 50% (Vừa)'; break;
                    case '70': sugarDisplay = '🍬 70% (Ngọt vừa)'; break;
                    case '100': sugarDisplay = '🍬 100% (Ngọt đậm)'; break;
                    default: sugarDisplay = `🍬 Đường: ${options.sugar}%`;
                }
                optionsList.push(sugarDisplay);
            }

            // Hiển thị ĐÁ rõ ràng
            if (options.ice) {
                let iceDisplay = '';
                switch (options.ice) {
                    case 'none': iceDisplay = '🧊 Không đá'; break;
                    case 'less': iceDisplay = '🧊 Ít đá'; break;
                    case 'normal': iceDisplay = '🧊 Đá bình thường'; break;
                    case 'more': iceDisplay = '🧊 Nhiều đá'; break;
                    default: iceDisplay = `🧊 Đá: ${options.ice}`;
                }
                optionsList.push(iceDisplay);
            }

            // Hiển thị topping/thêm
            if (options.selectedIngredients && options.selectedIngredients.length > 0) {
                const toppings = options.selectedIngredients.map(ing => {
                    const priceText = ing.price ? ` (${ing.price.toLocaleString()}đ)` : '';
                    return `${ing.name}${priceText} x${ing.quantity}`;
                }).join(', ');
                optionsList.push(`➕ Thêm: ${toppings}`);
            }

            return optionsList;
        } catch {
            return null;
        }
    };

    // ========== CÁC HOOK useEffect VÀ useMemo ==========

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsed = moment().diff(moment(order.createdAt), 'minutes');
            setTimeElapsed(elapsed);
        }, 60000);

        return () => clearInterval(interval);
    }, [order.createdAt]);

    // Sắp xếp items theo thời gian tạo và ưu tiên món gọi thêm
    const sortedItems = useMemo(() => {
        if (!order.items) return [];
        return [...order.items].sort((a, b) => {
            // 1. Món gọi thêm (is_new) ưu tiên lên trước
            if (a.is_new && !b.is_new) return -1;
            if (!a.is_new && b.is_new) return 1;

            // 2. Món đang chế biến lên trước
            if (a.status === 'preparing' && b.status !== 'preparing') return -1;
            if (a.status !== 'preparing' && b.status === 'preparing') return 1;

            // 3. Món chờ lâu (pending > 10 phút) ưu tiên
            const aAge = getItemAge(a.createdAt);
            const bAge = getItemAge(b.createdAt);
            if (a.status === 'pending' && b.status === 'pending') {
                if (aAge > 10 && bAge <= 10) return -1;
                if (aAge <= 10 && bAge > 10) return 1;
            }

            // 4. Món chờ lâu hơn lên trước
            if (a.status === 'pending' && b.status === 'pending') {
                return bAge - aAge;
            }

            // 5. Món đang chế biến lâu hơn lên trước
            if (a.status === 'preparing' && b.status === 'preparing') {
                return bAge - aAge;
            }

            // 6. Cuối cùng sắp xếp theo thời gian tạo (cũ hơn trước)
            return new Date(a.createdAt) - new Date(b.createdAt);
        });
    }, [order.items]);

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
            pending: 'Chờ chế biến',
            preparing: 'Đang chế biến',
            ready: 'Hoàn thành',
            served: 'Đã phục vụ',
            cancelled: 'Đã hủy'
        };
        return texts[status] || status;
    };

    const calculateProgress = () => {
        const items = order.items || [];
        if (items.length === 0) return 0;
        const completed = items.filter(item =>
            ['ready', 'served'].includes(item.status)
        ).length;
        return Math.round((completed / items.length) * 100);
    };

    const handleItemStatusUpdate = (itemId, currentStatus) => {
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
        onUpdateStatus(order.id, itemId, nextStatus);
    };

    const estimatedTime = order.estimated_time || 15;
    const isOverdue = timeElapsed > estimatedTime;
    const progress = calculateProgress();

    const hasNewItems = order.items?.some(item => item.is_new && item.status !== 'ready' && item.status !== 'served') || false;
    const newItemsCount = order.items?.filter(item => item.is_new && item.status !== 'ready' && item.status !== 'served').length || 0;

    // Kiểm tra xem order có mix trạng thái không
    const hasMixedStatus = useMemo(() => {
        const items = order.items || [];
        const hasPending = items.some(i => i.status === 'pending' || i.status === 'preparing');
        const hasCompleted = items.some(i => i.status === 'ready' || i.status === 'served');
        return hasPending && hasCompleted;
    }, [order.items]);

    return (
        <Card
            className={`kitchen-order-card priority-${order.priority || 'normal'} ${hasNewItems ? 'has-new-items' : ''}`}
            bodyStyle={{ padding: 0 }}
        >
            {/* Header */}
            <div className="card-header">
                <div className="order-info-left">
                    <div className="order-number">
                        <FireOutlined /> #{order.order_number}
                    </div>
                    <div className="table-info">
                        <div className="table-badge">
                            <EnvironmentOutlined /> Bàn {order.table?.table_number || 'N/A'}
                        </div>
                        <div className="customer-info">
                            {order.customer_count || 0} người
                            {order.customer_name && ` • ${order.customer_name}`}
                        </div>
                    </div>
                </div>

                <div className="order-info-right">
                    <Tooltip title={`Tạo lúc: ${moment(order.createdAt).format('HH:mm:ss DD/MM/YYYY')}`}>
                        <div className={`time-badge ${isOverdue ? 'overdue' : ''}`}>
                            <ClockCircleOutlined />
                            <span>{moment(order.createdAt).format('HH:mm')}</span>
                            <span>({timeElapsed}/{estimatedTime}p)</span>
                            {isOverdue && <WarningOutlined />}
                        </div>
                    </Tooltip>

                    <Tag color={getPriorityColor(order.priority || 'normal')} className="priority-tag">
                        {getPriorityText(order.priority || 'normal')}
                    </Tag>

                    {hasNewItems && (
                        <div className="new-badge pulse">
                            <PlusCircleOutlined /> +{newItemsCount} món mới
                        </div>
                    )}

                    {hasMixedStatus && (
                        <Tooltip title="Đơn hàng có món đã hoàn thành và đang chế biến">
                            <Badge
                                count="Mix"
                                style={{ backgroundColor: '#faad14' }}
                                className="mixed-badge"
                            />
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Items List */}
            <div className="items-container">
                <div className="items-header">
                    <h3>
                        Danh sách món
                        {hasNewItems && <Badge count="Có món mới" style={{ backgroundColor: '#ff4d4f', marginLeft: 8 }} />}
                    </h3>
                    <div className="progress-info">
                        <Progress
                            percent={progress}
                            size="small"
                            width={80}
                            strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
                        />
                    </div>
                </div>

                <div className="order-items">
                    {sortedItems.map((item) => {
                        const optionsList = formatItemOptions(item);
                        const isNew = item.is_new;
                        const itemAge = getItemAge(item.createdAt);
                        const isWaitingLong = item.status === 'pending' && itemAge > 10;
                        const waitingColor = getWaitingColor(item.status, itemAge);
                        const waitingIcon = getWaitingIcon(item.status, itemAge);
                        const itemTime = formatItemTime(item.createdAt);
                        const orderTypeInfo = getOrderTypeInfo(item.order_type || order.order_type || 'dine_in');

                        return (
                            <div key={item.id} className={`order-item ${isNew ? 'new-item' : ''} ${item.status}`}>
                                <div className="item-row">
                                    <div className="item-details">
                                        <div className="item-name-section">
                                            <span className="item-name">
                                                {item.menuItem?.name || 'Không tên'}
                                            </span>
                                            {item.quantity > 1 && (
                                                <span className="item-quantity">x{item.quantity}</span>
                                            )}
                                            {isNew && (
                                                <Tag color="red" icon={<PlusCircleOutlined />} className="new-tag">
                                                    Mới gọi
                                                </Tag>
                                            )}
                                            {isWaitingLong && (
                                                <Tag color="orange" icon={<WarningOutlined />} className="waiting-tag">
                                                    Chờ {itemAge}p
                                                </Tag>
                                            )}
                                            {/* Hiển thị Order Type cho từng món */}
                                            <Tag
                                                icon={orderTypeInfo.icon}
                                                style={{
                                                    backgroundColor: orderTypeInfo.bgColor,
                                                    color: orderTypeInfo.color,
                                                    border: 'none',
                                                    fontSize: '15px',
                                                    padding: '0px 6px',
                                                    margin: 0
                                                }}
                                                className="order-type-tag"
                                            >
                                                {orderTypeInfo.text}
                                            </Tag>
                                            {/* Hiển thị thời gian gọi món */}
                                            <Tooltip title={`Gọi lúc: ${moment(item.createdAt).format('HH:mm:ss DD/MM/YYYY')}`}>
                                                <span className="item-time" style={{ color: waitingColor }}>
                                                    {waitingIcon} {itemTime}
                                                </span>
                                            </Tooltip>
                                        </div>

                                        {/* Hiển thị SIZE, ĐƯỜNG, ĐÁ rõ ràng */}
                                        {optionsList && optionsList.length > 0 && (
                                            <div className="item-options">
                                                <Divider style={{ margin: '4px 0' }} />
                                                {optionsList.map((opt, idx) => (
                                                    <div key={idx} className="option-group">
                                                        {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {item.note && (
                                            <div className="item-note">
                                                <WarningOutlined /> Ghi chú: {item.note}
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-status">
                                        <Tag
                                            color={getItemStatusColor(item.status)}
                                            className="status-tag"
                                        >
                                            {getItemStatusText(item.status)}
                                        </Tag>

                                        {/* Hiển thị thời gian chờ cụ thể */}
                                        {item.status !== 'ready' && item.status !== 'served' && item.status !== 'cancelled' && (
                                            <div className="waiting-time" style={{ color: waitingColor }}>
                                                {itemAge} phút
                                            </div>
                                        )}

                                        {item.status === 'preparing' && (
                                            <Button
                                                type={item.status === 'pending' ? 'primary' : 'default'}
                                                size="middle"
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => handleItemStatusUpdate(item.id, item.status)}
                                                className={`action-btn ${item.status}`}
                                                block
                                            >
                                                Hoàn thành
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="card-footer">
                <div className="progress-section">
                    <div className="progress-label">
                        <span>Tiến độ đơn hàng</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress
                        percent={progress}
                        size="small"
                        status={progress === 100 ? 'success' : 'active'}
                        strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
                    />
                </div>

                {order.note && (
                    <div className="order-note">
                        <WarningOutlined /> Ghi chú đơn hàng: {order.note}
                    </div>
                )}

                {order.special_requests && (
                    <Alert
                        message="Yêu cầu đặc biệt"
                        description={order.special_requests}
                        type="warning"
                        showIcon
                        style={{ marginTop: 12 }}
                    />
                )}
            </div>
        </Card>
    );
};

export default KitchenOrderCard;