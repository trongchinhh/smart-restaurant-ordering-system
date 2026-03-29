import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PrivateRoute from './components/common/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import RoleBasedRedirect from './components/common/RoleBasedRedirect';
// Pages
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import Unauthorized from './pages/Unauthorized';

// Components
import KitchenQueue from './components/orders/KitchenQueue';

const AppRoutes = () => {
    return (
        <ErrorBoundary>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route element={<PrivateRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<RoleBasedRedirect />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/tables" element={<TablesPage />} />
                        <Route path="/menu" element={<MenuPage />} />
                        <Route path="/orders" element={<OrdersPage />} />
                        <Route path="/kitchen" element={<KitchenPage />} />
                        <Route path="/kitchen/queue" element={<KitchenQueue />} />

                        <Route path="/statistics" element={<StatisticsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                </Route>

                {/* 404 route */}
                <Route path="*" element={<RoleBasedRedirect />} />
            </Routes>
        </ErrorBoundary>
    );
};

export default AppRoutes;