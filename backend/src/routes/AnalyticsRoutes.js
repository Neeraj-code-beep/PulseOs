const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const analyticsController = require('../controllers/analytics.controller');

// Secure all Analytics routes with JWT authentication
router.use(authMiddleware);

// @route   GET /api/analytics/overview
router.get('/overview', analyticsController.getOverview);

// @route   GET /api/analytics/focus-trend
router.get('/focus-trend', analyticsController.getFocusTrend);

// @route   GET /api/analytics/task-performance
router.get('/task-performance', analyticsController.getTaskPerformance);

module.exports = router;
