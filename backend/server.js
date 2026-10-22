const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

if (!process.env.JWT_SECRET && require.main === module) {
  console.error('FATAL CONFIGURATION ERROR: JWT_SECRET is required.');
  process.exit(1);
}

const http = require('http');
const app = require('./src/app');
const connectToDB = require('./src/db/db');
const { disconnectDB } = require('./src/db/db');
const { initializeSocket, closeSocket } = require('./src/sockets/socket');
const { startReminderScheduler, stopReminderScheduler } = require('./src/scheduler/reminder.scheduler');

const port = process.env.PORT || 3000;

// Create single HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

/**
 * Creates an idempotent graceful shutdown coordinator.
 * Exported for testability and lifecycle management.
 */
function createShutdownHandler({
  server,
  closeSocketFn = closeSocket,
  stopSchedulerFn = stopReminderScheduler,
  disconnectDbFn = disconnectDB,
  exitFn = process.exit,
  timeoutMs = 10000,
} = {}) {
  let isShuttingDown = false;

  return async function handleShutdown(signal = 'SIGTERM') {
    if (isShuttingDown) {
      console.log(`Shutdown already in progress. Ignoring duplicate signal (${signal}).`);
      return;
    }
    isShuttingDown = true;
    console.log(`Received ${signal}. Initiating graceful shutdown...`);

    // Force exit timer if in-flight requests or sockets fail to close in time
    const forceExitTimer = setTimeout(() => {
      console.error(`Graceful shutdown timed out after ${timeoutMs}ms. Forcing process exit.`);
      exitFn(1);
    }, timeoutMs);
    if (typeof forceExitTimer.unref === 'function') {
      forceExitTimer.unref();
    }

    let hasError = false;

    try {
      // 1. Stop background scheduler
      try {
        stopSchedulerFn();
      } catch (err) {
        hasError = true;
        console.error('Error stopping reminder scheduler:', err.message);
      }

      // 2. Stop accepting new HTTP connections and close server
      await new Promise((resolve) => {
        if (server && typeof server.close === 'function') {
          // If server supports closeIdleConnections (Node 18.2+), close idle keep-alive connections
          if (typeof server.closeIdleConnections === 'function') {
            try {
              server.closeIdleConnections();
            } catch (_) {}
          }

          let closed = false;
          const closeTimer = setTimeout(() => {
            if (!closed) {
              closed = true;
              console.warn('HTTP server close timed out waiting for in-flight requests. Proceeding with cleanup.');
              resolve();
            }
          }, Math.min(timeoutMs / 2, 5000));
          if (typeof closeTimer.unref === 'function') {
            closeTimer.unref();
          }

          server.close((err) => {
            if (!closed) {
              closed = true;
              clearTimeout(closeTimer);
              if (err) {
                hasError = true;
                console.error('Error closing HTTP server:', err.message);
              } else {
                console.log('HTTP server closed successfully.');
              }
              resolve();
            }
          });
        } else {
          resolve();
        }
      });

      // 3. Cleanly disconnect Socket.IO clients and close server
      try {
        await closeSocketFn();
        console.log('Socket.IO server closed cleanly.');
      } catch (err) {
        hasError = true;
        console.error('Error closing Socket.IO:', err.message);
      }

      // 4. Close MongoDB connection
      try {
        await disconnectDbFn();
        console.log('Database connection closed cleanly.');
      } catch (err) {
        hasError = true;
        console.error('Error closing MongoDB connection:', err.message);
      }

      clearTimeout(forceExitTimer);
      if (hasError) {
        console.error('Graceful shutdown completed with errors. Exiting.');
        exitFn(1);
      } else {
        console.log('Graceful shutdown completed successfully. Exiting.');
        exitFn(0);
      }
    } catch (err) {
      clearTimeout(forceExitTimer);
      console.error('Unhandled error during graceful shutdown:', err.message);
      exitFn(1);
    }
  };
}

const handleShutdown = createShutdownHandler({ server });

// Attach signal listeners and start server only when executed directly
if (require.main === module) {
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  // Connect DB & Start Server + Scheduler
  connectToDB()
    .then(() => {
      startReminderScheduler();

      server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB during server startup:', err);
      process.exit(1);
    });
}

module.exports = {
  server,
  handleShutdown,
  createShutdownHandler,
};
