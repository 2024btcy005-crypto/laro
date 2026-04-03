require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, sequelize } = require('./config/db');
const { Server } = require('socket.io');
const { setIo } = require('./services/socketService');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust for production
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join room for specific customer or shop
    socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Store io instance for API controllers
setIo(io);
app.set('io', io);

// Start server
const startServer = async () => {
    const dbConnected = await connectDB();

    // Sync DB only if connection succeeded
    try {
        await sequelize.sync({ alter: true });
        console.log('📦 Database tables synced (ALREADY UPDATED SCHEMA).');
    } catch (syncErr) {
        console.warn('⚠️  DB sync failed:', syncErr.message);
    }

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT} across all network interfaces`);
    });
};

startServer();
