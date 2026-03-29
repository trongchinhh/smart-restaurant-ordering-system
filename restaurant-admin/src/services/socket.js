import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';
import authService from './auth';

class SocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect() {
        if (!authService.isAuthenticated()) return;

        if (this.socket && this.socket.connected) {
            return;
        }

        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.socket = io(SOCKET_URL, {
            auth: {
                token: authService.getToken()
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.emit('staff-connect', {
                userId: authService.getUser()?.id,
                role: authService.getUser()?.role
            });
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on('new-order', (data) => {
            this.notifyListeners('new-order', data);
        });

        this.socket.on('order-updated', (data) => {
            this.notifyListeners('order-updated', data);
        });

        this.socket.on('order-status-updated', (data) => {
            this.notifyListeners('order-status-updated', data);
        });

        this.socket.on('new-takeaway-order', (data) => {
            this.notifyListeners('new-takeaway-order', data);
        });

        this.socket.on('kitchen-new-order', (data) => {
            this.notifyListeners('kitchen-new-order', data);
        });

        this.socket.on('kitchen-add-items', (data) => {
            this.notifyListeners('kitchen-add-items', data);
        });

        this.socket.on('kitchen-order-updated', (data) => {
            this.notifyListeners('kitchen-order-updated', data);
        });

        this.socket.on('order-item-updated', (data) => {

            this.notifyListeners('order-item-updated', data);
        });

        this.socket.on('order-list-updated', (data) => {

            this.notifyListeners('order-list-updated', data);
        });

        this.socket.on('order-add-items', (data) => {
            this.notifyListeners('order-add-items', data);
        });

        this.socket.on('table-status-updated', (data) => {
            this.notifyListeners('table-status-updated', data);
        });

        this.socket.on('notification', (data) => {
            this.notifyListeners('notification', data);
        });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }

    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach((callback) => callback(data));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    joinRoom(room) {
        this.emit('join-room', room);
    }

    leaveRoom(room) {
        this.emit('leave-room', room);
    }
}

export default new SocketService();