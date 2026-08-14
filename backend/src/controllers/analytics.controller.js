const analyticsService = require('../services/analytics.service');

// @desc    Get productivity overview metrics for authenticated user
// @route   GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const data = await analyticsService.getOverview(userId);
    return res.status(200).json({
      success: true,
      message: 'Analytics overview retrieved successfully.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get focus session trends for past N days (7, 14, 30) for authenticated user
// @route   GET /api/analytics/focus-trend
const getFocusTrend = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const daysQuery = req.query.days;
    let days = 7; // Default value

    if (daysQuery !== undefined) {
      const parsedDays = Number(daysQuery);
      if (!Number.isInteger(parsedDays) || ![7, 14, 30].includes(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "days" must be one of: 7, 14, 30.',
        });
      }
      days = parsedDays;
    }

    const data = await analyticsService.getFocusTrend(userId, days);
    return res.status(200).json({
      success: true,
      message: 'Focus trend retrieved successfully.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get task performance metrics for authenticated user
// @route   GET /api/analytics/task-performance
const getTaskPerformance = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const data = await analyticsService.getTaskPerformance(userId);
    return res.status(200).json({
      success: true,
      message: 'Task performance metrics retrieved successfully.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get consolidated analytics dashboard for authenticated user
// @route   GET /api/analytics/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const daysQuery = req.query.days;
    let days = 7; // Default value

    if (daysQuery !== undefined) {
      const parsedDays = Number(daysQuery);
      if (!Number.isInteger(parsedDays) || ![7, 14, 30].includes(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "days" must be one of: 7, 14, 30.',
        });
      }
      days = parsedDays;
    }

    const data = await analyticsService.getDashboard(userId, days);
    return res.status(200).json({
      success: true,
      message: 'Analytics dashboard fetched successfully.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Unable to load analytics dashboard.',
    });
  }
};

module.exports = {
  getOverview,
  getFocusTrend,
  getTaskPerformance,
  getDashboard,
};
