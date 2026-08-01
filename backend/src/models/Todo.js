const mongoose = require('mongoose');

const ToDoSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true },
);

const ToDoModel = mongoose.model('ToDo', ToDoSchema);

module.exports = ToDoModel;
