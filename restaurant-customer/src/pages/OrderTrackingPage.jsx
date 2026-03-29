import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Steps, Button, Tag } from 'antd-mobile';
import Layout from '../components/layout/Layout';
import { useOrder } from '../hooks/useOrder';
import './OrderTrackingPage.scss';

const { Step } = Steps;

const OrderTrackingPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { data: orderData, isLoading } = useOrder(orderId);

    const order = orderData?.data;

    const getStatusStep = (status) => {
        const steps = {
            pending: 0,
            confirmed: 1,
            preparing: 1,
            ready: 2,
            served: 3,
            completed: 3,
            paid: 3
        };
        return steps[status] || 0;
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            preparing: 'Đang chế biến',
            ready: 'Đã sẵn sàng',
            served: 'Đã phục vụ',
            completed: 'Hoàn thành',
            paid: 'Đã thanh toán'
        };
        return texts[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            confirmed: 'primary',
            preparing: 'primary',
            ready: 'success',
            served: 'success',
            completed: 'success',
            paid: 'success'
        };
        return colors[status] || 'default';
    };

    if (isLoading) {
        return (
            <Layout title="Theo dõi đơn hàng" showBack>
                <div className="loading">Đang tải...</div>
            </Layout>
        );
    }

    if (!order) {
        return (
            <Layout title="Theo dõi đơn hàng" showBack>
                <div className="not-found">
                    <p>Không tìm thấy đơn hàng</p>
                    <Button color="primary" onClick={() => navigate('/')}>
                        Về trang chủ
                    </Button>
                </div>
            </Layout>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <Layout title="Theo dõi đơn hàng" showBack>
            <div className="order-tracking">
                <div className="order-header">
                    <h2>Đơn hàng #{order.order_number}</h2>
                    <Tag color={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                    </Tag>
                </div>

                <Steps current={getStatusStep(order.status)} className="tracking-steps">
                    <Step title="Đã đặt" />
                    <Step title="Đang chế biến" />
                    <Step title="Đã sẵn sàng" />
                    <Step title="Đã phục vụ" />
                </Steps>

                <div className="order-info">
                    <h3>Thông tin đơn hàng</h3>

                    <div className="info-row">
                        <span>Bàn:</span>
                        <span>{order.table?.table_number}</span>
                    </div>

                    <div className="info-row">
                        <span>Khách hàng:</span>
                        <span>{order.customer_name}</span>
                    </div>

                    <div className="info-row">
                        <span>Thời gian đặt:</span>
                        <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    {order.estimated_time && (
                        <div className="info-row">
                            <span>Thời gian dự kiến:</span>
                            <span>{order.estimated_time} phút</span>
                        </div>
                    )}
                </div>

                <div className="items-list">
                    <h3>Món đã đặt</h3>

                    {order.items?.map((item, index) => (
                        <div key={index} className="item-card">
                            <div className="item-main">
                                <div className="item-name">
                                    {item.menuItem?.name}
                                    <span className="item-quantity">x{item.quantity}</span>
                                </div>
                                <div className="item-price">{formatPrice(item.subtotal)}</div>
                            </div>

                            {item.note && (
                                <div className="item-note">📝 {item.note}</div>
                            )}

                            <div className="item-status">
                                <Tag color={
                                    item.status === 'ready' ? 'success' :
                                        item.status === 'preparing' ? 'primary' :
                                            item.status === 'pending' ? 'warning' : 'default'
                                }>
                                    {item.status === 'pending' ? 'Chờ CB' :
                                        item.status === 'preparing' ? 'Đang CB' :
                                            item.status === 'ready' ? 'Đã CB' :
                                                item.status === 'served' ? 'Đã phục vụ' : ''}
                                </Tag>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="order-total">
                    <div className="total-row">
                        <span>Tạm tính</span>
                        <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="total-row">
                        <span>Thuế (10%)</span>
                        <span>{formatPrice(order.tax)}</span>
                    </div>
                    <div className="total-row final">
                        <span>Tổng cộng</span>
                        <span className="total-price">{formatPrice(order.total)}</span>
                    </div>
                </div>

                <Button
                    color="primary"
                    block
                    onClick={() => navigate('/')}
                    className="back-btn"
                >
                    Tiếp tục đặt món
                </Button>
            </div>
        </Layout>
    );
};

export default OrderTrackingPage;