import React from 'react';
import { useCart } from '../../hooks/useCart';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import './CartDrawer.scss';

const CartDrawer = ({ visible, onClose, cart: propCart, total: propTotal, onUpdateItem, onRemoveItem, onPlaceOrder }) => {
    // Lấy cart từ context nếu không có props
    const { cart: contextCart, updateQuantity, updateNote, removeFromCart } = useCart();

    // Quyết định dùng cart nào: ưu tiên props nếu có
    const cart = propCart || contextCart;

    // Tính toán dựa trên cart được dùng
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = propTotal !== undefined ? propTotal :
        cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Hàm xử lý cập nhật
    const handleUpdateItem = (itemId, quantity, note) => {
        if (onUpdateItem) {
            onUpdateItem(itemId, quantity, note);
        } else {
            updateQuantity(itemId, quantity);
            if (note !== undefined) updateNote(itemId, note);
        }
    };

    const handleRemoveItem = (itemId) => {
        if (onRemoveItem) {
            onRemoveItem(itemId);
        } else {
            removeFromCart(itemId);
        }
    };

    if (!visible) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose} />
            <div className="cart-drawer">
                <div className="drawer-header">
                    <h3>Giỏ hàng của bạn</h3>
                    <span className="item-count">{itemCount} món</span>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="drawer-content">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <span className="empty-icon">🛒</span>
                            <p>Giỏ hàng trống</p>
                            <button className="continue-btn" onClick={onClose}>
                                Tiếp tục mua hàng
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map(item => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onUpdateQuantity={(quantity) => handleUpdateItem(item.id, quantity, item.note)}
                                        onUpdateNote={(note) => handleUpdateItem(item.id, item.quantity, note)}
                                        onRemove={() => handleRemoveItem(item.id)}
                                    />
                                ))}
                            </div>
                            <CartSummary
                                total={cartTotal}
                                itemCount={itemCount}
                                onClose={onClose}
                                onPlaceOrder={onPlaceOrder}
                            />
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartDrawer;