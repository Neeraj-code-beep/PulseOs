const analyticsService = require('../services/analytics.service');

// @desc    Get productivity overview metrics
// @route   GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const data = await analyticsService.getOverview();
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

// @desc    Get focus session trends for past N days (7, 14, 30)
// @route   GET /api/analytics/focus-trend
const getFocusTrend = async (req, res) => {
  try {
    const daysQuery = req.query.days;
    let days = 7; // Default value

    if (daysQuery !== undefined) {
      // Validate that days is an integer and one of [7, 14, 30]
      const parsedDays = Number(daysQuery);
      if (!Number.isInteger(parsedDays) || ![7, 14, 30].includes(parsedDays)) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter "days" must be one of: 7, 14, 30.',
        });
      }
      days = parsedDays;
    }

    const data = await analyticsService.getFocusTrend(days);
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

// @desc    Get task performance metrics (planned vs focused minutes & completion rate)
// @route   GET /api/analytics/task-performance
const getTaskPerformance = async (req, res) => {
  try {
    const data = await analyticsService.getTaskPerformance();
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

module.exports = {
  getOverview,
  getFocusTrend,
  getTaskPerformance,
};
