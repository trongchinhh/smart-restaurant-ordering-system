import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Loading from '../components/common/Loading';
import { useOrder } from '../hooks/useOrder';
import './OrderSuccessPage.scss';

const OrderSuccessPage = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { data: orderData, loading } = useOrder(orderId);

    const order = orderData?.data;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải thông tin đơn hàng..." />;
    }

    if (!order) {
        return (
            <Layout title="Không tìm thấy đơn hàng" showBack>
                <div className="not-found">
                    <p>Không tìm thấy thông tin đơn hàng</p>
                    <button onClick={() => navigate('/')}>Về trang chủ</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Đặt món thành công" showBack>
            <div className="order-success">
                <div className="success-icon">✓</div>
                <h2>Đặt món thành công!</h2>
                <p className="order-number">Mã đơn: {order.order_number}</p>

                <div className="order-details">
                    <h3>Chi tiết đơn hàng</h3>

                    <div className="info-row">
                        <span>Bàn:</span>
                        <span>{order.table?.table_number}</span>
                    </div>

                    <div className="info-row">
                        <span>Khách hàng:</span>
                        <span>{order.customer_name}</span>
                    </div>

                    <div className="info-row">
                        <span>Thời gian:</span>
                        <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                    </div>

                    <div className="items-list">
                        <h4>Món đã đặt</h4>
                        {order.items?.map((item, index) => (
                            <div key={index} className="item-row">
                                <div className="item-info">
                                    <span>{item.menuItem?.name}</span>
                                    {item.note && <small>{item.note}</small>}
                                </div>
                                <div className="item-quantity">x{item.quantity}</div>
                                <div className="item-price">{formatPrice(item.subtotal)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="total-row">
                        <span>Tổng cộng:</span>
                        <span className="total-price">{formatPrice(order.total)}</span>
                    </div>
                </div>

                <div className="actions">
                    <button className="primary-btn" onClick={() => navigate('/')}>
                        Tiếp tục đặt món
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default OrderSuccessPage;