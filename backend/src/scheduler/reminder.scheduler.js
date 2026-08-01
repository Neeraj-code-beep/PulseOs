const cron = require('node-cron');
const TodoModel = require('../models/Todo');
const { getIO, getConnectedClientCount } = require('../sockets/socket');

/**
 * Process due reminders with duplicate protection & zero-client safety check.
 */
async function processDueReminders() {
  try {
    const connectedClients = getConnectedClientCount();
    // Zero-client check: Do NOT claim or emit reminders if no clients are connected
    if (connectedClients === 0) {
      return;
    }

    const now = new Date();

    // Query due reminders: reminderTime != null, reminderTime <= now, reminderSent == false, completed == false
    const candidateTodos = await TodoModel.find({
      reminderTime: { $ne: null, $lte: now },
      reminderSent: false,
      completed: false,
    });

    if (!candidateTodos || candidateTodos.length === 0) {
      return;
    }

    const io = getIO();

    for (const todo of candidateTodos) {
      // Atomic duplicate protection claim: findOneAndUpdate with reminderSent: false
      const claimedTodo = await TodoModel.findOneAndUpdate(
        {
          _id: todo._id,
          reminderSent: false,
        },
        {
          $set: { reminderSent: true },
        },
        {
          new: true,
        },
      );

      // Only emit if atomic claim succeeded
      if (claimedTodo) {
        console.log(`Reminder emitted for todo: ${claimedTodo._id}`);
        io.emit('todo:reminder', {
          id: claimedTodo._id.toString(),
          title: claimedTodo.title,
          reminderTime: claimedTodo.reminderTime,
        });
      }
    }
  } catch (error) {
    console.error(`Reminder scheduler error: ${error.message}`);
  }
}

/**
 * Start reminder cron scheduler (runs once every minute).
 */
function startReminderScheduler() {
  console.log('Reminder scheduler initialized (running every 1 minute)...');
  cron.schedule('* * * * *', () => {
    processDueReminders();
  });
}

module.exports = {
  startReminderScheduler,
  processDueReminders,
};
