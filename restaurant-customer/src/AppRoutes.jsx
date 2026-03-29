import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderSuccessPage from './pages/OrderSuccessPage';

import ThankYouPage from './pages/ThankYouPage'; // Import trang cảm ơn
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<MenuPage />} />

            <Route path="/cart" element={<CartPage />} />
            <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} /> {/* Thêm route cảm ơn */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;