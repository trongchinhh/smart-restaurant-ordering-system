import React, { createContext, useContext, useState, useEffect } from 'react';
import cartService from '../services/cart';

// Export context
export const CartContext = createContext();

// Export hook
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [itemCount, setItemCount] = useState(0);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        loadCart();
    }, []);

    useEffect(() => {
        setItemCount(cartService.getItemCount());
        setTotal(cartService.getTotal());
    }, [cart]);

    const loadCart = () => {
        setCart(cartService.getCart());
    };

    const addToCart = (item) => {
        const newCart = cartService.addItem(item);
        setCart(newCart);
    };

    const updateQuantity = (itemId, quantity) => {
        const newCart = cartService.updateQuantity(itemId, quantity);
        setCart(newCart);
    };

    const updateNote = (itemId, note) => {
        const newCart = cartService.updateNote(itemId, note);
        setCart(newCart);
    };

    const removeFromCart = (itemId) => {
        const newCart = cartService.removeItem(itemId);
        setCart(newCart);
    };

    const clearCart = () => {
        const newCart = cartService.clearCart();
        setCart(newCart);
    };

    const value = {
        cart,
        itemCount,
        total,
        addToCart,
        updateQuantity,
        updateNote,
        removeFromCart,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};