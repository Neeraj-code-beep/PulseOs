const app = require('./src/app');
const cors = require('cors');
require('dotenv').config();
const express = require('express');
const http = require('http');
const TodoRoutes = require('./src/routes/TodoRoutes');
const FocusRoutes = require('./src/routes/FocusRoutes');
const connectToDB = require('./src/db/db');
const { initializeSocket } = require('./src/sockets/socket');
const { startReminderScheduler } = require('./src/scheduler/reminder.scheduler');

const port = process.env.PORT || 3000;

// Safe CORS configuration with local development fallback
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());

// Routes
app.use('/api/todos', TodoRoutes);
app.use('/api/focus', FocusRoutes);

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
