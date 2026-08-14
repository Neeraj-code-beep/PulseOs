const mongoose = require('mongoose');

const ToDoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    estimatedMinutes: {
      type: Number,
      default: null,
      min: 1,
    },

    reminderTime: {
      type: Date,
      default: null,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    focusTimeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for user task completion metrics & analytics range queries
ToDoSchema.index({ userId: 1, completed: 1, completedAt: 1 });

// Compound index for background reminder scheduler scanning due unsent reminders
ToDoSchema.index({ reminderSent: 1, reminderTime: 1 });

const ToDoModel = mongoose.model('ToDo', ToDoSchema);

module.exports = ToDoModel;
