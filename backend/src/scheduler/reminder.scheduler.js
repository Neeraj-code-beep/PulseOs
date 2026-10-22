const cron = require('node-cron');
const TodoModel = require('../models/Todo');
const { getIO, getConnectedClientCount } = require('../sockets/socket');

/**
 * Process due reminders with duplicate protection & user-scoped emission.
 * @param {string} [specificUserId] - If provided, only process reminders for this user (used for reconnect catch-up).
 */
async function processDueReminders(specificUserId) {
  try {
    const connectedClients = getConnectedClientCount();
    if (connectedClients === 0) {
      return;
    }

    const now = new Date();

    // Build query for due reminders, optionally scoped to a specific user
    const query = {
      reminderTime: { $ne: null, $lte: now },
      reminderSent: false,
      completed: false,
    };
    if (specificUserId) {
      query.userId = specificUserId;
    }

    const candidateTodos = await TodoModel.find(query);

    if (!candidateTodos || candidateTodos.length === 0) {
      return;
    }

    const io = getIO();

    for (const todo of candidateTodos) {
      // Atomic duplicate protection claim
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

      // Only emit to the owning user's room (never broadcast globally)
      if (claimedTodo && claimedTodo.userId) {
        const userRoom = `user:${claimedTodo.userId.toString()}`;
        console.log(`Reminder emitted for todo: ${claimedTodo._id} -> room: ${userRoom}`);
        io.to(userRoom).emit('todo:reminder', {
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

let scheduledTask = null;

/**
 * Start reminder cron scheduler (runs once every minute).
 */
function startReminderScheduler() {
  if (scheduledTask) {
    return scheduledTask;
  }
  console.log('Reminder scheduler initialized (running every 1 minute)...');
  scheduledTask = cron.schedule('* * * * *', () => {
    processDueReminders();
  });
  return scheduledTask;
}

/**
 * Stop reminder cron scheduler cleanly.
 */
function stopReminderScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('Reminder scheduler stopped.');
  }
}

module.exports = {
  startReminderScheduler,
  stopReminderScheduler,
  processDueReminders,
};
