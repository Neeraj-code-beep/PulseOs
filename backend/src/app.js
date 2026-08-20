const express = require('express');
const cors = require('cors');

const AuthRoutes = require('./routes/AuthRoutes');
const TodoRoutes = require('./routes/TodoRoutes');
const FocusRoutes = require('./routes/FocusRoutes');
const AnalyticsRoutes = require('./routes/AnalyticsRoutes');
const AiRoutes = require('./routes/AiRoutes');

const app = express();

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

module.exports = app;
