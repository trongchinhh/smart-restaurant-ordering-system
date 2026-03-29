import React from 'react';
import './QuantityControl.scss';

const QuantityControl = ({ quantity, onIncrease, onDecrease, size = 'normal', min = 0,
    max = 99, }) => {
    return (
        <div className={`quantity-control ${size}`}>
            <button
                className="quantity-btn"
                onClick={onDecrease}
                disabled={quantity <= min}
            >
                −
            </button>
            <span className="quantity-value">{quantity}</span>
            <button
                className="quantity-btn"
                onClick={onIncrease}
                disabled={quantity >= 99}
            >
                +
            </button>
        </div>
    );
};

export default QuantityControl;