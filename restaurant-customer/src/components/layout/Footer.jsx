import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import './Footer.scss';

const Footer = () => {
    const navigate = useNavigate();
    const { total, itemCount } = useCart();

    if (itemCount === 0) return null;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="cart-footer" onClick={() => navigate('/cart')}>
            <div className="cart-info">
                <span className="item-count">{itemCount} món</span>
                <span className="total-price">{formatPrice(total)}</span>
            </div>
            <button className="view-cart-btn">
                Xem giỏ hàng
            </button>
        </div>
    );
};

export default Footer;