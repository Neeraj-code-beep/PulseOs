const mongoose = require('mongoose');

const ToDoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    remainderTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const ToDoModel = mongoose.model('ToDo', ToDoSchema);

module.exports = ToDoModel;
