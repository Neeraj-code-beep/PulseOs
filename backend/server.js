const app = require('./src/app');
const cors = require('cors');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL CONFIGURATION ERROR: JWT_SECRET is required.');
  process.exit(1);
}

const express = require('express');
const http = require('http');
const AuthRoutes = require('./src/routes/AuthRoutes');
const TodoRoutes = require('./src/routes/TodoRoutes');
const FocusRoutes = require('./src/routes/FocusRoutes');
const AnalyticsRoutes = require('./src/routes/AnalyticsRoutes');
const AiRoutes = require('./src/routes/AiRoutes');
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
app.use('/api/auth', AuthRoutes);
app.use('/api/todos', TodoRoutes);
app.use('/api/focus', FocusRoutes);
app.use('/api/analytics', AnalyticsRoutes);
app.use('/api/ai', AiRoutes);


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
