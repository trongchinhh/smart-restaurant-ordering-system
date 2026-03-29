import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RoleBasedRedirect = () => {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role = user.role?.toLowerCase();

    switch (role) {
        case 'admin':
        case 'manager':
            return <Navigate to="/dashboard" replace />;
        case 'receptionist':
            return <Navigate to="/tables" replace />;
        case 'kitchen':
            return <Navigate to="/kitchen" replace />;
        default:
            return <Navigate to="/unauthorized" replace />;
    }
};

export default RoleBasedRedirect;