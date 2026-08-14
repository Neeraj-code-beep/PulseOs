const mongoose = require('mongoose');

const FocusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

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

// Compound index for user focus analytics trends and aggregated time metrics
FocusSessionSchema.index({ userId: 1, status: 1, startedAt: 1 });

const FocusSessionModel = mongoose.model('FocusSession', FocusSessionSchema);

module.exports = FocusSessionModel;
