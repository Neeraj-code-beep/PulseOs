const aiService = require('../services/ai.service');
const aiPlanService = require('../services/aiPlan.service');

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

/**
 * Controller endpoint: POST /api/ai/daily-plan
 * Generates AI-powered daily focus recommendations synthesizing tasks, focus history, completion rates & planning availability.
 */
const getDailyPlan = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const { availability } = req.body || {};
    const data = await aiPlanService.generateDailyPlan(userId, availability);

    return res.status(200).json({
      success: true,
      message: 'Daily focus plan generated successfully.',
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Daily planning recommendations are temporarily unavailable.',
    });
  }
};

module.exports = {
  breakdownTask,
  estimateTaskTime,
  proposeSchedule,
  getDailyPlan,
};
