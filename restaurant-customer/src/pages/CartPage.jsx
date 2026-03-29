import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import CartItem from '../components/cart/CartItem';
import { useCart } from '../hooks/useCart';
import { useTable } from '../hooks/useTable';
import { useCreateOrder } from '../hooks/useOrder';
import './CartPage.scss';
import { addItemsToOrder, getTableInfo, getActiveOrderByTable } from '../services/api';
const CartPage = () => {
    const navigate = useNavigate();
    const { cart, total, clearCart } = useCart();
    const { tableId } = useTable();
    const { mutate: createOrder, loading } = useCreateOrder();

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerCount, setCustomerCount] = useState(1);
    const [note, setNote] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [orderTypeModal, setOrderTypeModal] = useState(false); // popup chọn loại
    const [selectedOrderType, setSelectedOrderType] = useState(null); // dine_in | takeaway
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleConfirmOrder = async () => {



        if (cart.length === 0) {
            alert('Giỏ hàng trống');
            return;
        }

        try {

            const items = cart.map(item => ({
                menu_item_id: item.menuItemId,
                quantity: item.quantity,
                note: item.note,
                options: {
                    ...item.options,
                    order_type: selectedOrderType // 🔥 CHỈ LƯU Ở ITEM
                }
            }));

            // lấy thông tin bàn
            const table = await getTableInfo(tableId);

            if (table.data.status === 'available') {

                // bàn trống → tạo order mới
                await createOrder({
                    table_id: tableId,
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    customer_count: customerCount,
                    note,
                    items
                });

            } else if (table.data.status === 'occupied') {

                // bàn đang phục vụ → gọi thêm món

                const orderData = await getActiveOrderByTable(tableId);

                await addItemsToOrder(orderData.data.id, { items });

            }
            setShowConfirmModal(false);
            setShowSuccessModal(true);
            clearCart();


        } catch (error) {

            alert(error.message || 'Đặt món thất bại');

        }

    };

    if (cart.length === 0 && !showSuccessModal) {
        return (
            <Layout title="Giỏ hàng" showBack>
                <div className="empty-cart-page">
                    <div className="empty-icon">🛒</div>
                    <h3>Giỏ hàng trống</h3>
                    <p>Hãy thêm món ăn vào giỏ hàng</p>
                    <button className="continue-shopping" onClick={() => navigate('/')}>
                        Xem thực đơn
                    </button>
                </div>
            </Layout>
        );
    }


    return (
        <Layout title="Giỏ hàng" showBack showFooter={false}>
            <div className="cart-page">
                <div className="cart-items-section">
                    {cart.map(item => (
                        <CartItem key={item.id} item={item} />
                    ))}
                </div>



                <div className="order-summary">
                    <h3>Chi tiết thanh toán</h3>

                    <div className="summary-row">
                        <span>Tạm tính</span>
                        <span>{formatPrice(total)}</span>
                    </div>

                    <div className="summary-row">
                        <span>Thuế (10%)</span>
                        <span>{formatPrice(total * 0.1)}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Tổng cộng</span>
                        <span className="total-price">{formatPrice(total * 1.1)}</span>
                    </div>
                </div>

                <button
                    className="submit-order-btn"
                    onClick={() => setOrderTypeModal(true)}
                    disabled={loading}
                >
                    {loading ? 'Đang xử lý...' : 'Đặt món'}
                </button>
            </div>

            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Xác nhận</h3>
                        <p>Bạn có chắc muốn gọi món không?</p>

                        <div className="modal-actions">
                            <button onClick={() => setShowConfirmModal(false)}>
                                Hủy
                            </button>
                            <button onClick={handleConfirmOrder}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {orderTypeModal && (
                <div className="modal-overlay">
                    <div className="modal order-type-modal">
                        <div className="modal-header">
                            <div className="icon-wrapper">
                                <span className="sparkle">✨</span>
                            </div>
                            <h2>Chọn hình thức</h2>
                            <p>Bạn muốn dùng món tại đây hay mang về?</p>
                        </div>

                        <div className="order-type-options">
                            <button
                                className="type-btn dine-in"
                                onClick={() => {
                                    setSelectedOrderType('dine_in');
                                    setOrderTypeModal(false);
                                    setShowConfirmModal(true);
                                }}
                            >
                                <div className="btn-icon">🍽️</div>
                                <div className="btn-text">
                                    <strong>Ăn tại quán</strong>
                                    <span>Thưởng thức không gian ấm cúng</span>
                                </div>
                                <div className="btn-arrow">→</div>
                            </button>

                            <button
                                className="type-btn takeaway"
                                onClick={() => {
                                    setSelectedOrderType('takeaway');
                                    setOrderTypeModal(false);
                                    setShowConfirmModal(true);
                                }}
                            >
                                <div className="btn-icon">🛍️</div>
                                <div className="btn-text">
                                    <strong>Mang về</strong>
                                    <span>Thưởng thức tại nhà</span>
                                </div>
                                <div className="btn-arrow">→</div>
                            </button>
                        </div>

                        <button className="close-modal-btn" onClick={() => setOrderTypeModal(false)}>
                            Huỷ
                        </button>
                    </div>
                </div>
            )}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal success-modal">
                        <div className="success-animation">
                            <div className="checkmark-circle">
                                <div className="checkmark-draw"></div>
                            </div>
                        </div>

                        <div className="success-content">
                            <h3>Đặt món thành công! 🎉</h3>
                            <p>
                                Các món bạn đã gọi đã được gửi đến nhà bếp.
                                <br />
                                Vui lòng chờ nhân viên phục vụ trong giây lát.
                            </p>


                        </div>

                        <div className="modal-actions-footer">
                            <button
                                className="continue-btn"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    navigate('/');
                                }}
                            >
                                <span>Tiếp tục mua hàng</span>
                                <span className="btn-icon">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default CartPage;