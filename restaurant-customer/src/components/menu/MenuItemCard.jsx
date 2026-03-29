import React from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import { UPLOAD_URL } from '../../services/config';
import './MenuItemCard.scss';

const MenuItemCard = ({ item, onClick, statusDisplayType = 'chip' }) => {
    const isSoldOut = item.status === 'sold_out';
    const isUnavailable = item.status === 'unavailable';
    const isDisabled = isSoldOut || isUnavailable;

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + " đ";
    };

    const getStatusText = () => {
        if (isSoldOut) return 'Hết món';
        if (isUnavailable) return 'Ngừng bán';
        return '';
    };

    const getStatusClass = () => {
        if (isSoldOut) return 'sold-out';
        if (isUnavailable) return 'unavailable';
        return '';
    };

    // Render status based on type
    const renderStatus = () => {
        if (!isDisabled) return null;

        const statusClass = getStatusClass();
        const statusText = getStatusText();



        return (
            <div className={`status-chip ${statusClass}`}>
                {statusText}
            </div>
        );

    };


    return (
        <div
            className={`menu-item-card ${isDisabled ? 'disabled' : ''}`}
            onClick={() => !isDisabled && onClick && onClick(item)}
        >
            {/* IMAGE */}
            <div className="item-image">
                {/* Status indicator */}
                {renderStatus()}



                <ImageWithFallback
                    src={item.image_url ? `${UPLOAD_URL}${item.image_url}` : null}
                    alt={item.name}
                />
            </div>

            {/* INFO */}
            <div className="item-info">
                <div className="item-name">{item.name}</div>

                {item.name_en && (
                    <div className="item-description">
                        {item.name_en}
                    </div>
                )}

                {/* Sold count */}
                {item.total_sold > 0 && (
                    <div className="item-sold">
                        Đã bán {item.total_sold}
                    </div>
                )}
            </div>

            {/* PRICE */}
            <div className="item-price">
                {item.discount_price && item.discount_price > 0 ? (
                    <>
                        <span className="original-price">
                            {formatPrice(item.price)}
                        </span>
                        <span className="discount-price">
                            {formatPrice(item.discount_price)}
                        </span>
                    </>
                ) : (
                    <span className="price">
                        {formatPrice(item.price)}
                    </span>
                )}
            </div>

            {/* ADD BUTTON */}
            <button className="add-btn" disabled={isDisabled}>
                +
            </button>
        </div>
    );
};

export default MenuItemCard;