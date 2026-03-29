import React, { useState, useEffect } from 'react';
import ImageWithFallback from '../common/ImageWithFallback';
import QuantityControl from '../common/QuantityControl';
import { UPLOAD_URL } from '../../services/config';
import { message } from 'antd';
import './MenuItemDetail.scss';

const MenuItemDetail = ({ visible, item, onClose, onAddToCart }) => {
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [size, setSize] = useState('');
    const [sugar, setSugar] = useState('');
    const [ice, setIce] = useState('');
    const [toppings, setToppings] = useState([]);
    const [ingredientQuantities, setIngredientQuantities] = useState({});

    useEffect(() => {
        if (item?.ingredients) {
            // Khởi tạo state với giá trị mặc định từ ingredients
            const initialQuantities = {};
            item.ingredients.forEach((ing, index) => {
                // Kiểm tra nếu ing là object
                if (typeof ing === 'object' && ing !== null) {
                    initialQuantities[index] = ing.defaultQuantity || 0;
                } else {
                    initialQuantities[index] = 0;
                }
            });
            setIngredientQuantities(initialQuantities);
        }
    }, [item]);

    // Reset form when item changes
    useEffect(() => {
        if (visible && item) {
            setQuantity(1);
            setNote('');
            setSize('');
            setSugar('');
            setIce('');
            setIngredientQuantities({});
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [visible, item]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const drinkCategories = [
        'Cà phê',
        'Trà sữa',
        'Nước ép',
        'Sinh tố',
        'Đá xay',
        'Trà trái cây'
    ];

    // Check if item requires size selection
    const requiresSize = () => {
        return item?.size_prices && Object.keys(item.size_prices).length > 0;
    };

    // Check if item requires sugar/ice selection (drink item)
    const requiresSugarIce = () => {
        return drinkCategories.includes(item?.category?.name);
    };

    // Validate all required fields
    const validateSelections = () => {
        // Validate size if required
        if (requiresSize() && !size) {
            message.warning('Vui lòng chọn size cho món ăn');
            return false;
        }

        // Validate sugar if required
        if (requiresSugarIce() && !sugar) {
            message.warning('Vui lòng chọn độ đường');
            return false;
        }

        // Validate ice if required
        if (requiresSugarIce() && !ice) {
            message.warning('Vui lòng chọn độ đá');
            return false;
        }

        return true;
    };

    const getFinalPrice = () => {
        let base = item.discount_price || item.price;

        if (size && item.size_prices?.[size]) {
            base = item.size_prices[size];
        }

        return base;
    };

    const calculateToppingsTotal = () => {
        let total = 0;
        if (item?.ingredients) {
            item.ingredients.forEach((ing, index) => {
                const qty = ingredientQuantities[index] || 0;
                if (qty > 0) {
                    // Kiểm tra nếu ing là object
                    if (typeof ing === 'object' && ing !== null) {
                        total += (ing.price || 0) * qty;
                    }
                }
            });
        }
        return total;
    };

    const calculateTotalWithIngredients = () => {
        const basePrice = getFinalPrice();
        const toppingsTotal = calculateToppingsTotal();
        return (basePrice * quantity) + toppingsTotal;
    };

    const updateIngredientQuantity = (index, delta) => {
        setIngredientQuantities(prev => {
            const currentQty = prev[index] || 0;
            let maxQty = 1;

            // Lấy maxQuantity từ ingredient
            if (item?.ingredients && item.ingredients[index]) {
                const ing = item.ingredients[index];
                if (typeof ing === 'object' && ing !== null) {
                    maxQty = ing.maxQuantity || 1;
                }
            }

            const newQty = Math.max(0, Math.min(maxQty, currentQty + delta));
            return { ...prev, [index]: newQty };
        });
    };

    const handleAdd = () => {
        // Validate before adding to cart
        if (!validateSelections()) {
            return;
        }

        // Lọc các thành phần được chọn
        const selectedIngredients = [];
        if (item?.ingredients) {
            item.ingredients.forEach((ing, index) => {
                const qty = ingredientQuantities[index] || 0;
                if (qty > 0) {
                    if (typeof ing === 'object' && ing !== null) {
                        selectedIngredients.push({
                            name: ing.name,
                            quantity: qty,
                            price: ing.price,
                            total: ing.price * qty
                        });
                    } else {
                        selectedIngredients.push({
                            name: ing,
                            quantity: qty,
                            price: 0,
                            total: 0
                        });
                    }
                }
            });
        }

        const cartItem = {
            id: Date.now(),
            menuItemId: item.id,
            name: item.name,
            image: item.image_url,
            basePrice: getFinalPrice(),
            quantity: quantity,
            note: note,
            options: {
                size,
                sugar,
                ice,
                toppings,
                // QUAN TRỌNG: Đưa selectedIngredients vào bên trong options
                selectedIngredients: selectedIngredients
            },
            // Tính tổng tiền bao gồm cả thành phần
            price: calculateTotalWithIngredients(),
            // Tạo text hiển thị
            ingredientsText: selectedIngredients.map(ing =>
                `${ing.name} x${ing.quantity} (+${formatPrice(ing.price * ing.quantity)})`
            ).join(', ')
        };

        onAddToCart(cartItem);
        onClose();
    };

    // Render danh sách nguyên liệu (chỉ hiển thị tên)
    const renderIngredients = () => {
        if (!item?.ingredients || item.ingredients.length === 0) return null;

        return (
            <div className="item-ingredients">
                <h3>Nguyên liệu</h3>
                <div className="tags-list">
                    {item.ingredients.map((ing, index) => {
                        // Lấy tên từ object hoặc string
                        let name = '';
                        if (typeof ing === 'object' && ing !== null) {
                            name = ing.name || '';
                        } else if (typeof ing === 'string') {
                            name = ing;
                        }

                        return (
                            <span key={index} className="tag">{name}</span>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render các thành phần có thể thêm (có giá)
    const renderAddableIngredients = () => {
        if (!item?.ingredients || item.ingredients.length === 0) return null;

        // Lọc các thành phần có giá > 0
        const addableIngredients = item.ingredients.filter(ing => {
            if (typeof ing === 'object' && ing !== null) {
                return ing.price > 0;
            }
            return false;
        });

        if (addableIngredients.length === 0) return null;

        return (
            <div className="toppings-section">
                <h3>Gọi Thêm</h3>
                {item.ingredients.map((ingredient, index) => {
                    // Chỉ hiển thị nếu có giá
                    if (typeof ingredient !== 'object' || ingredient === null || !ingredient.price) {
                        return null;
                    }

                    return (
                        <div key={index} className="topping-item">
                            <div className="topping-info">
                                <span className="topping-name">{ingredient.name}</span>
                                <span className="topping-price">+{formatPrice(ingredient.price)}</span>
                            </div>
                            <div className="topping-quantity">
                                <QuantityControl
                                    quantity={ingredientQuantities[index] || 0}
                                    onIncrease={() => updateIngredientQuantity(index, 1)}
                                    onDecrease={() => updateIngredientQuantity(index, -1)}
                                />
                                {ingredient.maxQuantity >= 1 && (
                                    <span className="max-notice">Tối đa {ingredient.maxQuantity}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!visible || !item) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="detail-image">
                    <ImageWithFallback
                        src={item.image_url ? `${UPLOAD_URL}${item.image_url}` : null}
                        alt={item.name}
                    />
                </div>

                <div className="detail-content">
                    <h2 className="item-name">{item.name}</h2>

                    <div className="item-price">
                        {item.discount_price > 0 ? (
                            <>
                                <span className="original-price">{formatPrice(item.price)}</span>
                                <span className="discount-price">{formatPrice(item.discount_price)}</span>
                            </>
                        ) : (
                            <span className="price">{formatPrice(item.price)}</span>
                        )}
                    </div>

                    {item.description && (
                        <div className="item-description">
                            <h3>Mô tả</h3>
                            <p>{item.description}</p>
                        </div>
                    )}

                    {/* Hiển thị nguyên liệu */}
                    {renderIngredients()}

                    <div className="item-options">
                        <div className="quantity-section">
                            <h3>Số lượng</h3>
                            <QuantityControl
                                quantity={quantity}
                                min={1}
                                onIncrease={() => setQuantity(q => q + 1)}
                                onDecrease={() => setQuantity(q => Math.max(1, q - 1))}
                            />
                        </div>

                        <div className="note-section">
                            <h3>Ghi chú</h3>
                            <textarea
                                placeholder="Ví dụ: Không hành, ít cay..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={3}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.target.blur();
                                    }
                                }}
                            />
                        </div>

                        {item.size_prices && (
                            <>
                                <div className="option-group">
                                    <label className={requiresSize() && !size ? 'required' : ''}>
                                        Size {requiresSize()}
                                    </label>
                                    <div className="option-list">
                                        {Object.keys(item.size_prices).map(s => {
                                            const sizePrice = item.size_prices[s];
                                            const basePrice = item.discount_price || item.price;
                                            const diff = sizePrice - basePrice;

                                            return (
                                                <button
                                                    key={s}
                                                    className={size === s ? 'active' : ''}
                                                    onClick={() => setSize(s)}
                                                >
                                                    {s} {diff > 0 && `+${formatPrice(diff)}`}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}

                        {drinkCategories.includes(item?.category?.name) && (
                            <>
                                <div className="option-group">
                                    <label className={requiresSugarIce() && !sugar ? 'required' : ''}>
                                        Đường {requiresSugarIce()}
                                    </label>
                                    <div className="option-list">
                                        {['0%', '30%', '50%', '70%', '100%'].map(s => (
                                            <button
                                                key={s}
                                                className={sugar === s ? 'active' : ''}
                                                onClick={() => setSugar(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="option-group">
                                    <label className={requiresSugarIce() && !ice ? 'required' : ''}>
                                        Đá {requiresSugarIce()}
                                    </label>
                                    <div className="option-list">
                                        {['Không', 'Ít', 'Vừa', 'Nhiều'].map(i => (
                                            <button
                                                key={i}
                                                className={ice === i ? 'active' : ''}
                                                onClick={() => setIce(i)}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Render các thành phần có thể thêm */}
                        {renderAddableIngredients()}
                    </div>

                    <button
                        className="add-to-cart-btn"
                        onClick={handleAdd}
                    >
                        Thêm vào giỏ - {formatPrice(calculateTotalWithIngredients())}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemDetail;