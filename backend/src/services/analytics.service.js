const TodoModel = require('../models/Todo');
const FocusSessionModel = require('../models/FocusSession');

/**
 * Returns the start of today (00:00:00.000) in local server timezone.
 */
const getStartOfToday = (now = new Date()) => {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Returns the start of tomorrow (00:00:00.000) in local server timezone.
 */
const getStartOfTomorrow = (now = new Date()) => {
  const date = getStartOfToday(now);
  date.setDate(date.getDate() + 1);
  return date;
};

/**
 * Returns the start of the current local calendar week (Monday 00:00:00.000).
 */
const getStartOfCurrentWeek = (now = new Date()) => {
  const date = getStartOfToday(now);
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date;
};

/**
 * Returns the start of next week (Monday 00:00:00.000).
 */
const getStartOfNextWeek = (now = new Date()) => {
  const date = getStartOfCurrentWeek(now);
  date.setDate(date.getDate() + 7);
  return date;
};

/**
 * Formats a Date object to YYYY-MM-DD in local server timezone.
 */
const formatLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets overview productivity metrics using FocusSession and Todo data.
 */
const getOverview = async () => {
  const startOfToday = getStartOfToday();
  const startOfTomorrow = getStartOfTomorrow();
  const startOfWeek = getStartOfCurrentWeek();
  const startOfNextWeek = getStartOfNextWeek();

  // Aggregate FocusSession metrics for Today, This Week, and All-Time
  const [focusStats] = await FocusSessionModel.aggregate([
    {
      $facet: {
        today: [
          {
            $match: {
              status: 'completed',
              startedAt: { $gte: startOfToday, $lt: startOfTomorrow },
            },
          },
          {
            $group: {
              _id: null,
              totalSeconds: { $sum: '$actualSeconds' },
              sessionCount: { $sum: 1 },
            },
          },
        ],
        week: [
          {
            $match: {
              status: 'completed',
              startedAt: { $gte: startOfWeek, $lt: startOfNextWeek },
            },
          },
          {
            $group: {
              _id: null,
              totalSeconds: { $sum: '$actualSeconds' },
              sessionCount: { $sum: 1 },
            },
          },
        ],
        allTime: [
          {
            $match: {
              status: 'completed',
            },
          },
          {
            $group: {
              _id: null,
              totalSeconds: { $sum: '$actualSeconds' },
              sessionCount: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const todayStats = focusStats.today[0] || { totalSeconds: 0, sessionCount: 0 };
  const weekStats = focusStats.week[0] || { totalSeconds: 0, sessionCount: 0 };
  const allTimeStats = focusStats.allTime[0] || { totalSeconds: 0, sessionCount: 0 };

  // Count completed tasks for today and this week using completedAt
  const completedTasksToday = await TodoModel.countDocuments({
    completed: true,
    completedAt: { $gte: startOfToday, $lt: startOfTomorrow },
  });

  const completedTasksWeek = await TodoModel.countDocuments({
    completed: true,
    completedAt: { $gte: startOfWeek, $lt: startOfNextWeek },
  });

  // Calculate session metrics and round durations
  const focusTodayMinutes = Math.round(todayStats.totalSeconds / 60);
  const focusWeekMinutes = Math.round(weekStats.totalSeconds / 60);
  const totalFocusMinutes = Math.round(allTimeStats.totalSeconds / 60);
  const averageSessionMinutes =
    allTimeStats.sessionCount > 0
      ? Math.round(allTimeStats.totalSeconds / allTimeStats.sessionCount / 60)
      : 0;

  return {
    focusTodayMinutes,
    focusWeekMinutes,
    completedTasksToday,
    completedTasksWeek,
    sessionsToday: todayStats.sessionCount,
    sessionsWeek: weekStats.sessionCount,
    averageSessionMinutes,
    totalFocusMinutes,
  };
};

/**
 * Gets daily focus session trends for the specified number of days (7, 14, or 30).
 */
const getFocusTrend = async (days) => {
  const startOfToday = getStartOfToday();
  const startOfTomorrow = getStartOfTomorrow();

  // Calculate start boundary for past N days (including today)
  const startOfRange = new Date(startOfToday);
  startOfRange.setDate(startOfRange.getDate() - (days - 1));

  // Query completed sessions within range
  const sessions = await FocusSessionModel.find({
    status: 'completed',
    startedAt: { $gte: startOfRange, $lt: startOfTomorrow },
  }).lean();

  // Map aggregated totals by local calendar date YYYY-MM-DD
  const dailyMap = {};
  sessions.forEach((session) => {
    const sessionDateStr = formatLocalDateString(new Date(session.startedAt));
    if (!dailyMap[sessionDateStr]) {
      dailyMap[sessionDateStr] = { totalSeconds: 0, sessions: 0 };
    }
    dailyMap[sessionDateStr].totalSeconds += session.actualSeconds || 0;
    dailyMap[sessionDateStr].sessions += 1;
  });

  // Build sequential daily points from startOfRange to startOfToday
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const points = [];
  const curr = new Date(startOfRange);

  while (curr <= startOfToday) {
    const dateStr = formatLocalDateString(curr);
    const dayLabel = dayNames[curr.getDay()];
    const entry = dailyMap[dateStr] || { totalSeconds: 0, sessions: 0 };

    points.push({
      date: dateStr,
      label: dayLabel,
      focusMinutes: Math.round(entry.totalSeconds / 60),
      sessions: entry.sessions,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return {
    days,
    points,
  };
};

/**
 * Gets overall task performance and focus completion metrics.
 */
const getTaskPerformance = async () => {
  // Sum estimated minutes for all tasks with planned estimatedMinutes
  const plannedAggregate = await TodoModel.aggregate([
    {
      $match: {
        estimatedMinutes: { $ne: null, $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        totalPlannedMinutes: { $sum: '$estimatedMinutes' },
      },
    },
  ]);

  const plannedMinutes = plannedAggregate[0]?.totalPlannedMinutes || 0;

  // Sum total focused minutes across all completed focus sessions
  const focusAggregate = await FocusSessionModel.aggregate([
    {
      $match: {
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        totalSeconds: { $sum: '$actualSeconds' },
      },
    },
  ]);

  const totalFocusSeconds = focusAggregate[0]?.totalSeconds || 0;
  const focusedMinutes = Math.round(totalFocusSeconds / 60);

  // Calculate task completion rate
  const totalTasks = await TodoModel.countDocuments();
  const completedTasks = await TodoModel.countDocuments({ completed: true });

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate planned vs actual ratio rounded to 2 decimal places
  const plannedVsActualRatio =
    plannedMinutes > 0 ? Math.round((focusedMinutes / plannedMinutes) * 100) / 100 : 0;

  return {
    plannedMinutes,
    focusedMinutes,
    completionRate,
    plannedVsActualRatio,
  };
};

module.exports = {
  getStartOfToday,
  getStartOfTomorrow,
  getStartOfCurrentWeek,
  getStartOfNextWeek,
  formatLocalDateString,
  getOverview,
  getFocusTrend,
  getTaskPerformance,
};
