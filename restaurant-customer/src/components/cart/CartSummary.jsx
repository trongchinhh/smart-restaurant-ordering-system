import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CartSummary.scss';

const CartSummary = ({ total, itemCount, onClose, onPlaceOrder }) => {
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleCheckout = () => {
        if (onPlaceOrder) {
            onPlaceOrder(); // Gọi hàm đặt hàng từ TakeawayPage
        } else {
            onClose();
            navigate('/cart');
        }
    };

    const subtotal = total;
    const tax = total * 0.1;
    const grandTotal = total * 1.1;

    return (
        <div className="cart-summary">
            <div className="summary-row">
                <span>Tạm tính ({itemCount} món)</span>
                <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
                <span>Thuế VAT (10%)</span>
                <span>{formatPrice(tax)}</span>
            </div>
            <div className="summary-row total">
                <span>Tổng cộng</span>
                <span className="total-amount">{formatPrice(grandTotal)}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
                {onPlaceOrder ? 'Đặt món' : 'Tiến hành đặt món'}
            </button>
        </div>
    );
};

export default CartSummary;