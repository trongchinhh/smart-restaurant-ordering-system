import api from './api';

class AuthService {
    setToken(token) {
        localStorage.setItem('token', token);
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    async login(credentials) {
        try {
            const response = await api.post('/auth/login', credentials);


            // Backend trả về { success: true, data: {...} }
            if (response.data && response.data.success) {
                const { token, ...userData } = response.data.data;
                this.setToken(token);
                this.setUser(userData);
                return { success: true, user: userData };
            }
            return {
                success: false,
                message: response.data?.message || 'Login failed'
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    }

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    hasRole(roles) {
        const user = this.getUser();
        if (!user) return false;
        if (Array.isArray(roles)) {
            return roles.includes(user.role);
        }
        return user.role === roles;
    }

    can(permission) {
        const user = this.getUser();
        if (!user) return false;

        // Admin has all permissions
        if (user.role === 'admin') return true;

        const permissions = {
            admin: ['*'],
            manager: [
                'view_dashboard',
                'view_statistics',
                'manage_menu',
                'manage_tables',
                'view_orders',
                'manage_orders',
                'view_reports'
            ],
            receptionist: [
                'view_dashboard',
                'view_tables',
                'manage_tables_status',
                'view_menu',
                'view_orders',
                'create_orders',
                'manage_orders',
                'process_payment'
            ],
            kitchen: [
                'view_kitchen_queue',
                'update_order_status',
                'update_item_status'
            ]
        };

        return permissions[user.role]?.includes(permission) || false;
    }
}

export default new AuthService();