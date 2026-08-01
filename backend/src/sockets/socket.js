const { Server } = require('socket.io');

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

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Immediate catch-up: deliver any pending due reminders on reconnect
    // Use lazy require to avoid circular dependency with reminder.scheduler.js
    setTimeout(() => {
      try {
        const { processDueReminders } = require('../scheduler/reminder.scheduler');
        processDueReminders();
      } catch (err) {
        console.error('Catch-up reminder processing error:', err.message);
      }
    }, 1000);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
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

module.exports = {
  initializeSocket,
  getIO,
  getConnectedClientCount,
};
