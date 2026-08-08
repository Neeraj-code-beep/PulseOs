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

/**
 * Controller endpoint: POST /api/ai/estimate
 * Generates an AI-powered duration estimate for a task.
 */
const estimateTaskTime = async (req, res) => {
  try {
    const { title, context } = req.body || {};
    const data = await aiService.estimateTaskTime({ title, context });

    return res.status(200).json({
      success: true,
      message: 'Task time estimated successfully.',
      data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    const message = error.message || 'AI time estimation is temporarily unavailable.';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

/**
 * Controller endpoint: POST /api/ai/schedule
 * Generates a proposed focus schedule for a task within user availability.
 */
const proposeSchedule = async (req, res) => {
  try {
    const { title, estimatedMinutes, context, availability } = req.body || {};
    const data = await aiService.proposeSchedule({
      title,
      estimatedMinutes,
      context,
      availability,
    });

    return res.status(200).json({
      success: true,
      message: 'Schedule proposal generated successfully.',
      data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    const message = error.message || 'Schedule proposal is temporarily unavailable.';

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  breakdownTask,
  estimateTaskTime,
  proposeSchedule,
};

