const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initializeSocket(server, options = {}) {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    ...options,
  });

  // Middleware to authenticate incoming socket connections via JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization
        ? socket.handshake.headers.authorization.replace('Bearer ', '')
        : null);

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'fallback_secret_key_pulseos';
      const decoded = jwt.verify(token, secret);

      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token payload'));
      }

      // Attach verified userId to socket
      socket.userId = decoded.userId.toString();
      next();
    } catch (err) {
      return next(new Error('Authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.userId}`;
    socket.join(userRoom);
    console.log(`Authenticated socket connected: ${socket.id} (Joined room: ${userRoom})`);

    // Immediate catch-up: deliver any pending due reminders for this specific user on connect
    setTimeout(() => {
      try {
        const { processDueReminders } = require('../scheduler/reminder.scheduler');
        processDueReminders(socket.userId);
      } catch (err) {
        console.error('Catch-up reminder processing error:', err.message);
      }
    }, 1000);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized!');
  }
  return io;
}

function getConnectedClientCount() {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

function getConnectedUserCount() {
  if (!io) return 0;
  const userRooms = new Set();
  for (const socket of io.sockets.sockets.values()) {
    if (socket.userId) {
      userRooms.add(socket.userId);
    }
  }
  return userRooms.size;
}

module.exports = {
  initializeSocket,
  getIO,
  getConnectedClientCount,
  getConnectedUserCount,
};
