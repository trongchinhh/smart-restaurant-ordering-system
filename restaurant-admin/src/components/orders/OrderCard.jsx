import React from 'react';
import { Card, Tag, Space, Button, Badge } from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    PrinterOutlined,
    DollarOutlined
} from '@ant-design/icons';
import moment from 'moment';
import './OrderCard.scss';

const OrderCard = ({ order, onView, onEdit, onPayment }) => {
    const hasNewItems = order.items?.some(item => item.is_new);
    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            confirmed: 'processing',
            preparing: 'processing',
            ready: 'success',
            served: 'success',
            completed: 'default',
            cancelled: 'error',
            paid: 'success'
        };
        return colors[status] || 'default';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            preparing: 'Đang chế biến',
            ready: 'Đã sẵn sàng',
            served: 'Đã phục vụ',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
            paid: 'Đã thanh toán'
        };
        return texts[status] || status;
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            unpaid: 'error',
            paid: 'success',
            partial: 'warning'
        };
        return colors[status] || 'default';
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    return (
        <Badge.Ribbon
            text={order.priority === 'urgent' ? 'Gấp' : ''}
            color="red"
            style={{ display: order.priority === 'urgent' ? 'block' : 'none' }}
        >
            <Card className={`order-card status-${order.status}`}>
                <div className="order-header">
                    <div className="order-number">
                        <strong>#{order.order_number}</strong>
                        <Tag color={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                        </Tag>
                    </div>
                    <div className="order-time">
                        {moment(order.createdAt).format('HH:mm DD/MM')}
                    </div>
                </div>

                <div className="order-body">
                    <div className="table-info">
                        <span className="label">Bàn:</span>
                        <span className="value">{order.table?.table_number}</span>
                    </div>

                    <div className="customer-info">
                        <span className="label">Khách:</span>
                        <span className="value">{order.customer_name}</span>
                    </div>

                    <div className="items-count">
                        <span className="label">Số món:</span>
                        <span className="value">{order.items?.length || 0}</span>
                    </div>

                    <div className="total-amount">
                        <span className="label">Tổng:</span>
                        <span className="value">{formatCurrency(order.total)}</span>
                    </div>

                    <div className="payment-status">
                        <Tag color={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status === 'unpaid' ? 'Chưa TT' : 'Đã TT'}
                        </Tag>
                    </div>
                </div>

                <div className="order-footer">
                    <Space size="small">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => onView(order)}
                        >
                            Chi tiết
                        </Button>

                        {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => onEdit(order)}
                            />
                        )}

                        <Button
                            size="small"
                            icon={<PrinterOutlined />}
                        />

                        {order.payment_status === 'unpaid' && order.status === 'served' && (
                            <Button
                                type="primary"
                                size="small"
                                icon={<DollarOutlined />}
                                onClick={() => onPayment(order)}
                            >
                                TT
                            </Button>
                        )}
                    </Space>
                </div>
            </Card>
        </Badge.Ribbon>
    );
};

export default OrderCard;

