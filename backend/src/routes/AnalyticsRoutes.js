const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// @route   GET /api/analytics/overview
router.get('/overview', analyticsController.getOverview);

// @route   GET /api/analytics/focus-trend
router.get('/focus-trend', analyticsController.getFocusTrend);

// @route   GET /api/analytics/task-performance
router.get('/task-performance', analyticsController.getTaskPerformance);

module.exports = router;
