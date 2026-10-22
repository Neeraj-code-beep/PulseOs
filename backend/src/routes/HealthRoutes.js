const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const MONGO_STATE_NAMES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Health check handler verifying process liveness and MongoDB readiness.
 * Returns HTTP 200 when ready, HTTP 503 when database is unavailable.
 */
const healthCheck = (req, res) => {
  const readyState = mongoose.connection ? mongoose.connection.readyState : 0;
  const isDbReady = readyState === 1;
  const dbState = MONGO_STATE_NAMES[readyState] || 'unknown';

  const responseData = {
    status: isDbReady ? 'healthy' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      process: 'alive',
      database: dbState,
    },
  };

  if (isDbReady) {
    return res.status(200).json({
      success: true,
      message: 'PulseOS API is healthy and ready.',
      data: responseData,
    });
  }

  return res.status(503).json({
    success: false,
    message: 'PulseOS API is degraded: database is not ready.',
    data: responseData,
  });
};

router.get('/', healthCheck);

module.exports = router;
module.exports.healthCheck = healthCheck;
