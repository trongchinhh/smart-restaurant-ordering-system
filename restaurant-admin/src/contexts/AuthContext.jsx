import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/auth';
import { useNavigate } from 'react-router-dom';

// Export context để các file khác có thể import
export const AuthContext = createContext();

// Export hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const user = authService.getUser();
                setUser(user);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (credentials) => {
        const result = await authService.login(credentials);
        if (result.success) {
            setUser(result.user);
            navigate(getDefaultRoute(result.user.role));
        }
        return result;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        navigate('/login');
    };

    const updateUser = (newUserData) => {
        setUser(prev => ({ ...prev, ...newUserData }));
        authService.setUser({ ...user, ...newUserData });
    };

    const getDefaultRoute = (role) => {
        switch (role) {
            case 'admin':
            case 'manager':
                return '/dashboard';
            case 'receptionist':
                return '/tables';
            case 'kitchen':
                return '/kitchen';
            default:
                return '/dashboard';
        }
    };

    const hasRole = (roles) => {
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    };

    const can = (permission) => {
        return authService.can(permission);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        hasRole,
        can,
        updateUser,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};