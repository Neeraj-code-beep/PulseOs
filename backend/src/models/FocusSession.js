const mongoose = require('mongoose');

const FocusSessionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ToDo',
      default: null,
    },

    taskTitle: {
      type: String,
      default: null,
    },

    mode: {
      type: String,
      enum: ['pomodoro', 'custom'],
      required: true,
    },

    plannedMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    actualSeconds: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['completed', 'cancelled'],
      required: true,
    },

    startedAt: {
      type: Date,
      required: true,
    },

    endedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

const FocusSessionModel = mongoose.model('FocusSession', FocusSessionSchema);

module.exports = FocusSessionModel;
