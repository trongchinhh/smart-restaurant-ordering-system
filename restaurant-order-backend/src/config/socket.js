const socketIO = require('socket.io');

let io;

const initializeSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {


        // Join rooms based on role
        socket.on('join-room', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room: ${room}`);
        });

        // Handle staff connections
        socket.on('staff-connect', (staffInfo) => {
            if (staffInfo.role === 'kitchen') {
                socket.join('kitchen-staff');
            }

            if (
                staffInfo.role === 'reception' ||
                staffInfo.role === 'receptionist' ||
                staffInfo.role === 'admin' ||
                staffInfo.role === 'manager'
            ) {
                socket.join('reception-staff');
            }
        });

        socket.on('disconnect', () => {

        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

module.exports = { initializeSocket, getIO };