require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL CONFIGURATION ERROR: JWT_SECRET is required.');
  process.exit(1);
}

const http = require('http');
const app = require('./src/app');
const connectToDB = require('./src/db/db');
const { initializeSocket } = require('./src/sockets/socket');
const { startReminderScheduler } = require('./src/scheduler/reminder.scheduler');

const port = process.env.PORT || 3000;

// Create single HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Connect DB & Start Server + Scheduler
connectToDB()
  .then(() => {
    // Start scheduler once after DB connection and Socket initialization
    startReminderScheduler();

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
