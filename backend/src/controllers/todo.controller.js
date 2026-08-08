const TodoModel = require('../models/Todo');
const mongoose = require('mongoose');

// @desc    Create a new Todo
// @route   POST /api/todos
const createTodo = async (req, res) => {
  try {
    const { title, reminderTime, dueDate, priority, estimatedMinutes } = req.body;

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

    const newTodo = await TodoModel.create({
      title: title.trim(),
      dueDate: parsedDueDate,
      priority: parsedPriority,
      estimatedMinutes: parsedEstMinutes,
      reminderTime: parsedReminderTime,
      completed: false,
      reminderSent: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully.',
      data: newTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Get all Todos
// @route   GET /api/todos
const getTodos = async (req, res) => {
  try {
    const todos = await TodoModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: 'Todos retrieved successfully.',
      data: todos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Update a Todo
// @route   PATCH /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Todo ID format.',
      });
    }

    const existingTodo = await TodoModel.findById(id);
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
      // Set completedAt timestamp when transitioning to completed, clear it when uncompleted
      if (isCompleted && !existingTodo.completed) {
        updates.completedAt = new Date();
      } else if (!isCompleted && existingTodo.completed) {
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
        // Reset reminderSent when reminderTime is updated or cleared
        updates.reminderSent = false;
      }
    }

    const updatedTodo = await TodoModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Todo updated successfully.',
      data: updatedTodo,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

// @desc    Delete a Todo
// @route   DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Todo ID format.',
      });
    }

    const deletedTodo = await TodoModel.findByIdAndDelete(id);
    if (!deletedTodo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Todo deleted successfully.',
      data: { id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Server Error',
    });
  }
};

module.exports = {
  createTodo,
  getTodos,
  updateTodo,
  deleteTodo,
};
