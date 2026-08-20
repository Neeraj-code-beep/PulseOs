const TodoModel = require('../models/Todo');
const mongoose = require('mongoose');

// Helper to validate and normalize tags array
const parseAndValidateTags = (tagsInput) => {
  if (tagsInput === undefined || tagsInput === null) return { valid: true, value: undefined };
  if (!Array.isArray(tagsInput)) {
    return { valid: false, message: 'Tags must be an array of strings.' };
  }

  const normalized = [];
  const seen = new Set();

  for (const item of tagsInput) {
    if (typeof item !== 'string') {
      return { valid: false, message: 'Tags must be an array of strings.' };
    }
    const clean = item.trim().toLowerCase();
    if (!clean) continue;
    if (clean.length > 30) {
      return { valid: false, message: 'Tag length cannot exceed 30 characters.' };
    }
    if (!seen.has(clean)) {
      seen.add(clean);
      normalized.push(clean);
    }
  }

  if (normalized.length > 5) {
    return { valid: false, message: 'Cannot specify more than 5 tags.' };
  }

  return { valid: true, value: normalized };
};

// Helper to validate subtasks for createTodo
const parseAndValidateSubtasksCreate = (subtasksInput) => {
  if (subtasksInput === undefined || subtasksInput === null) return { valid: true, value: undefined };
  if (!Array.isArray(subtasksInput)) {
    return { valid: false, message: 'Subtasks must be an array of objects.' };
  }

  const parsed = [];
  for (const item of subtasksInput) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, message: 'Subtasks must be an array of objects.' };
    }
    if (typeof item.title !== 'string' || !item.title.trim()) {
      return { valid: false, message: 'Subtask title is required and cannot be empty.' };
    }
    const title = item.title.trim();
    if (title.length > 300) {
      return { valid: false, message: 'Subtask title cannot exceed 300 characters.' };
    }
    const completed = Boolean(item.completed);
    let completedAt = null;
    if (completed) {
      completedAt = item.completedAt ? new Date(item.completedAt) : new Date();
      if (isNaN(completedAt.getTime())) completedAt = new Date();
    }
    parsed.push({ title, completed, completedAt });
  }

  return { valid: true, value: parsed };
};

// Helper to validate subtasks for updateTodo with state transition logic
const parseAndValidateSubtasksUpdate = (subtasksInput, existingSubtasks = []) => {
  if (subtasksInput === undefined) return { valid: true, value: undefined };
  if (subtasksInput === null) return { valid: true, value: [] };
  if (!Array.isArray(subtasksInput)) {
    return { valid: false, message: 'Subtasks must be an array of objects.' };
  }

  const existingMap = new Map();
  existingSubtasks.forEach((sub) => {
    if (sub && sub._id) {
      existingMap.set(sub._id.toString(), sub);
    }
  });

  const parsed = [];
  for (const item of subtasksInput) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, message: 'Subtasks must be an array of objects.' };
    }
    if (typeof item.title !== 'string' || !item.title.trim()) {
      return { valid: false, message: 'Subtask title is required and cannot be empty.' };
    }
    const title = item.title.trim();
    if (title.length > 300) {
      return { valid: false, message: 'Subtask title cannot exceed 300 characters.' };
    }

    const subId = (item._id || item.id) ? (item._id || item.id).toString() : null;
    const existingSub = subId ? existingMap.get(subId) : null;

    const isCompleted = Boolean(item.completed);
    let completedAt = null;

    if (isCompleted) {
      if (existingSub && existingSub.completed && existingSub.completedAt) {
        completedAt = existingSub.completedAt;
      } else {
        completedAt = new Date();
      }
    } else {
      completedAt = null;
    }

    const subObj = {
      title,
      completed: isCompleted,
      completedAt,
    };
    if (subId && mongoose.Types.ObjectId.isValid(subId)) {
      subObj._id = subId;
    }

    parsed.push(subObj);
  }

  return { valid: true, value: parsed };
};

// @desc    Create a new Todo (Scoped to authenticated user)
// @route   POST /api/todos
const createTodo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const { title, reminderTime, dueDate, priority, estimatedMinutes, tags, subtasks } = req.body || {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required and cannot be empty.',
      });
    }

    let parsedReminderTime = null;
    if (reminderTime) {
      const dateVal = new Date(reminderTime);
      if (isNaN(dateVal.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reminderTime date format.',
        });
      }
      parsedReminderTime = dateVal;
    }

    let parsedDueDate = null;
    if (dueDate) {
      const dateVal = new Date(dueDate);
      if (isNaN(dateVal.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dueDate format.',
        });
      }
      parsedDueDate = dateVal;
    }

    let parsedPriority = 'medium';
    if (priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be low, medium, or high.',
        });
      }
      parsedPriority = priority;
    }

    let parsedEstMinutes = null;
    if (estimatedMinutes !== undefined && estimatedMinutes !== null && estimatedMinutes !== '') {
      const num = Number(estimatedMinutes);
      if (isNaN(num) || num < 1) {
        return res.status(400).json({
          success: false,
          message: 'Estimated minutes must be a positive number.',
        });
      }
      parsedEstMinutes = Math.round(num);
    }

    const parsedTags = parseAndValidateTags(tags);
    if (!parsedTags.valid) {
      return res.status(400).json({
        success: false,
        message: parsedTags.message,
      });
    }

    const parsedSubtasks = parseAndValidateSubtasksCreate(subtasks);
    if (!parsedSubtasks.valid) {
      return res.status(400).json({
        success: false,
        message: parsedSubtasks.message,
      });
    }

    // Always derive userId strictly from authenticated JWT context
    const newTodo = await TodoModel.create({
      userId,
      title: title.trim(),
      dueDate: parsedDueDate,
      priority: parsedPriority,
      estimatedMinutes: parsedEstMinutes,
      reminderTime: parsedReminderTime,
      completed: false,
      reminderSent: false,
      tags: parsedTags.value || [],
      subtasks: parsedSubtasks.value || [],
    });

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully.',
      data: newTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
};

// @desc    Get all Todos for current authenticated user
// @route   GET /api/todos
const getTodos = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const todos = await TodoModel.find({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: 'Todos retrieved successfully.',
      data: todos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
};

// @desc    Update a Todo owned by current authenticated user
// @route   PATCH /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Todo ID format.',
      });
    }

    // Scope query by both taskId AND authenticated userId
    const existingTodo = await TodoModel.findOne({ _id: id, userId });
    if (!existingTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found.',
      });
    }

    const updates = {};

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title cannot be empty.',
        });
      }
      updates.title = req.body.title.trim();
    }

    if (req.body.completed !== undefined) {
      const isCompleted = Boolean(req.body.completed);
      updates.completed = isCompleted;
      if (isCompleted) {
        updates.completedAt = existingTodo.completedAt || new Date();
      } else {
        updates.completedAt = null;
      }
    }

    if (req.body.dueDate !== undefined) {
      if (req.body.dueDate === null || req.body.dueDate === '') {
        updates.dueDate = null;
      } else {
        const dateVal = new Date(req.body.dueDate);
        if (isNaN(dateVal.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid dueDate format.',
          });
        }
        updates.dueDate = dateVal;
      }
    }

    if (req.body.priority !== undefined) {
      if (!['low', 'medium', 'high'].includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: 'Priority must be low, medium, or high.',
        });
      }
      updates.priority = req.body.priority;
    }

    if (req.body.estimatedMinutes !== undefined) {
      if (req.body.estimatedMinutes === null || req.body.estimatedMinutes === '') {
        updates.estimatedMinutes = null;
      } else {
        const num = Number(req.body.estimatedMinutes);
        if (isNaN(num) || num < 1) {
          return res.status(400).json({
            success: false,
            message: 'Estimated minutes must be a positive number.',
          });
        }
        updates.estimatedMinutes = Math.round(num);
      }
    }

    if (req.body.reminderTime !== undefined) {
      if (req.body.reminderTime === null || req.body.reminderTime === '') {
        updates.reminderTime = null;
        updates.reminderSent = false;
      } else {
        const dateVal = new Date(req.body.reminderTime);
        if (isNaN(dateVal.getTime())) {
          return res.status(400).json({
            success: false,
            message: 'Invalid reminderTime date format.',
          });
        }
        updates.reminderTime = dateVal;
        updates.reminderSent = false;
      }
    }

    if (req.body.tags !== undefined) {
      const parsedTags = parseAndValidateTags(req.body.tags);
      if (!parsedTags.valid) {
        return res.status(400).json({
          success: false,
          message: parsedTags.message,
        });
      }
      updates.tags = parsedTags.value || [];
    }

    if (req.body.subtasks !== undefined) {
      const parsedSubtasks = parseAndValidateSubtasksUpdate(req.body.subtasks, existingTodo.subtasks);
      if (!parsedSubtasks.valid) {
        return res.status(400).json({
          success: false,
          message: parsedSubtasks.message,
        });
      }
      updates.subtasks = parsedSubtasks.value || [];
    }

    const updatedTodo = await TodoModel.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true }
    );

    // Emit realtime productivity:updated event to user room
    try {
      const { getIO } = require('../sockets/socket');
      getIO()
        .to(`user:${userId}`)
        .emit('productivity:updated', { type: updates.completed ? 'task_completed' : 'task_updated' });
    } catch {
      // Non-blocking socket emission fail-safe
    }

    return res.status(200).json({
      success: true,
      message: 'Todo updated successfully.',
      data: updatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
};

// @desc    Delete a Todo owned by current authenticated user
// @route   DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access.',
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Todo ID format.',
      });
    }

    const deletedTodo = await TodoModel.findOneAndDelete({ _id: id, userId });
    if (!deletedTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found.',
      });
    }

    // Emit realtime productivity:updated event to user room
    try {
      const { getIO } = require('../sockets/socket');
      getIO().to(`user:${userId}`).emit('productivity:updated', { type: 'task_deleted' });
    } catch {
      // Non-blocking socket emission fail-safe
    }

    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully.',
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred.',
    });
  }
};

module.exports = {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
};
