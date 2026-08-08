const aiService = require('../services/ai.service');

/**
 * Controller endpoint: POST /api/ai/breakdown
 * Generates an AI-powered task breakdown with subtasks and duration estimates.
 */
const breakdownTask = async (req, res) => {
  try {
    const { title, context } = req.body || {};
    const data = await aiService.breakDownTask({ title, context });

    return res.status(200).json({
      success: true,
      message: 'Task breakdown generated successfully.',
      data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    const message = error.message || 'AI planning is temporarily unavailable.';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  breakdownTask,
};
