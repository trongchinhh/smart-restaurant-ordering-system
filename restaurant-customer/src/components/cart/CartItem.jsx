import React, { useState } from 'react';
import { useCart } from '../../hooks/useCart';
import ImageWithFallback from '../common/ImageWithFallback';
import QuantityControl from '../common/QuantityControl';
import { UPLOAD_URL } from '../../services/config';
import './CartItem.scss';

const CartItem = ({ item }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [note, setNote] = useState(item.note || '');
    const { updateQuantity, updateNote, removeFromCart } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };
    const options = item.options || {};

    const size = options.size;
    const sugar = options.sugar;
    const ice = options.ice;
    const toppings = options?.selectedIngredients || [];

    const handleSaveNote = () => {
        updateNote(item.id, note);
        setIsEditing(false);
    };

    return (
        <div className="cart-item">
            <div className="item-image-wrapper">
                <ImageWithFallback
                    src={item.image ? `${UPLOAD_URL}${item.image}` : null}
                    alt={item.name}
                    className="item-image"
                />
                <div className="item-quantity-badge">{item.quantity}</div>
            </div>

            <div className="item-details">
                <div className="item-header">
                    <div className="item-info">
                        <h4 className="item-name">{item.name}</h4>
                        <div className="item-base-price">
                            {formatPrice(item.basePrice || item.price)}
                        </div>
                    </div>
                    <button
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Options Tags */}
                <div className="item-options-tags">
                    {size && (
                        <span className="option-tag size-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7H4M12 7V21M8 11H16M6 21H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            {size}
                        </span>
                    )}
                    {sugar && (
                        <span className="option-tag sugar-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2V4M12 20V22M4 12H2M6 12H4M20 12H22M18 12H20M12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6Z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            Đường {sugar}
                        </span>
                    )}
                    {ice && (
                        <span className="option-tag ice-tag">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L12 22M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Đá {ice}
                        </span>
                    )}
                </div>

                {/* Toppings */}
                {toppings.length > 0 && (
                    <div className="item-toppings">
                        <div className="toppings-header">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L15 8H22L16 12L19 18L12 14L5 18L8 12L2 8H9L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            </svg>
                            <span>Thêm</span>
                        </div>
                        <div className="toppings-list">
                            {toppings.map((t, i) => (
                                <div key={i} className="topping-item">
                                    <span className="topping-name">{t.name}</span>
                                    <span className="topping-quantity">x{t.quantity}</span>
                                    <span className="topping-price">{formatPrice(t.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="item-actions">
                    <div className="quantity-wrapper">
                        <QuantityControl
                            quantity={item.quantity}
                            onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                            onDecrease={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            size="small"
                        />
                    </div>
                    <div className="item-total-price">
                        <span className="total-label">Tổng</span>
                        <span className="total-amount">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                </div>

                {/* Note */}
                <div className="item-note">
                    {isEditing ? (
                        <div className="note-edit">
                            <input
                                type="text"
                                placeholder="Thêm ghi chú cho món ăn..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                onBlur={handleSaveNote}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSaveNote();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    ) : (
                        <button
                            className={`note-btn ${item.note ? 'has-note' : ''}`}
                            onClick={() => setIsEditing(true)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 12V18H4V12M12 4V14M12 14L15 11M12 14L9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            {item.note ? item.note : 'Thêm ghi chú'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartItem;