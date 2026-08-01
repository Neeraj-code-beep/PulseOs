const FocusSessionModel = require('../models/FocusSession');
const TodoModel = require('../models/Todo');
const mongoose = require('mongoose');

// @desc    Create/Complete a Focus Session
// @route   POST /api/focus/sessions
const createFocusSession = async (req, res) => {
  try {
    const { taskId, mode, plannedMinutes, actualSeconds, status, startedAt, endedAt } = req.body;

    // Validate mode
    if (!mode || !['pomodoro', 'custom'].includes(mode)) {
      return res.status(400).json({
        success: false,
        message: "Mode must be either 'pomodoro' or 'custom'.",
      });
    }

    // Validate plannedMinutes
    const parsedPlanned = Number(plannedMinutes);
    if (isNaN(parsedPlanned) || parsedPlanned < 1) {
      return res.status(400).json({
        success: false,
        message: 'Planned minutes must be a positive number.',
      });
    }

    // Validate actualSeconds
    const parsedActual = Number(actualSeconds);
    if (isNaN(parsedActual) || parsedActual < 0) {
      return res.status(400).json({
        success: false,
        message: 'Actual seconds must be a non-negative number.',
      });
    }

    // Validate status
    if (!status || !['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'completed' or 'cancelled'.",
      });
    }

    // Validate startedAt and endedAt
    const startDate = new Date(startedAt);
    const endDate = new Date(endedAt);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startedAt or endedAt date format.',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'endedAt date must be greater than or equal to startedAt date.',
      });
    }

    let existingTodo = null;
    let taskTitleSnapshot = null;

    // Validate taskId if provided
    if (taskId) {
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Task ID format.',
        });
      }

      existingTodo = await TodoModel.findById(taskId);
      if (!existingTodo) {
        return res.status(404).json({
          success: false,
          message: 'Associated task not found.',
        });
      }
      taskTitleSnapshot = existingTodo.title;
    }

    // Create FocusSession document
    const newSession = await FocusSessionModel.create({
      taskId: taskId || null,
      taskTitle: taskTitleSnapshot,
      mode,
      plannedMinutes: Math.round(parsedPlanned),
      actualSeconds: Math.round(parsedActual),
      status,
      startedAt: startDate,
      endedAt: endDate,
    });

    let updatedTodo = null;

    // If completed and task exists, increment focusTimeSpent atomically
    if (status === 'completed' && taskId && existingTodo) {
      const creditedMinutes = Math.max(1, Math.round(parsedActual / 60));
      try {
        updatedTodo = await TodoModel.findByIdAndUpdate(
          taskId,
          { $inc: { focusTimeSpent: creditedMinutes } },
          { new: true },
        );
      } catch (incError) {
        console.error('Failed to increment focusTimeSpent on Todo:', incError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Focus session created successfully.',
      data: {
        session: newSession,
        task: updatedTodo || existingTodo || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get Recent Focus Sessions
// @route   GET /api/focus/sessions
const getFocusSessions = async (req, res) => {
  try {
    let limit = Number(req.query.limit) || 10;
    if (limit < 1) limit = 10;
    if (limit > 50) limit = 50;

    const sessions = await FocusSessionModel.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: 'Focus sessions retrieved successfully.',
      data: sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get Focus Summary (Today & All-Time)
// @route   GET /api/focus/summary
const getFocusSummary = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const completedSessions = await FocusSessionModel.find({ status: 'completed' });

    let focusSecondsToday = 0;
    let completedSessionsToday = 0;
    let totalFocusSeconds = 0;
    let totalCompletedSessions = completedSessions.length;

    completedSessions.forEach((session) => {
      totalFocusSeconds += session.actualSeconds || 0;
      if (session.endedAt >= startOfToday && session.endedAt <= endOfToday) {
        focusSecondsToday += session.actualSeconds || 0;
        completedSessionsToday += 1;
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Focus summary retrieved successfully.',
      data: {
        focusSecondsToday,
        completedSessionsToday,
        totalFocusSeconds,
        totalCompletedSessions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

module.exports = {
  createFocusSession,
  getFocusSessions,
  getFocusSummary,
};
