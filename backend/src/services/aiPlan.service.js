const TodoModel = require('../models/Todo');
const analyticsService = require('./analytics.service');
const aiProvider = require('../integrations/ai/ai.provider');

/**
 * Builds AI Daily Planning and Recommendation Insights by synthesizing:
 * 1. Active Tasks (titles, priorities, due dates, estimates)
 * 2. Focus Session Metrics (7-day focus minutes, session average)
 * 3. Completion Patterns (completion rate, planned vs actual ratio)
 * 4. User Availability Window
 */
const generateDailyPlan = async (userId, availability = {}) => {
  // 1. Fetch user's active uncompleted tasks
  const activeTasks = await TodoModel.find({
    userId,
    completed: false,
  })
    .sort({ priority: -1, dueDate: 1, createdAt: -1 })
    .limit(10)
    .lean();

  // 2. Fetch user's productivity overview & performance metrics
  const overview = await analyticsService.getOverview(userId);
  const performance = await analyticsService.getTaskPerformance(userId);
  const trend = await analyticsService.getFocusTrend(userId, 7);

  // Default availability window
  const startTime = availability.startTime || '09:00 AM';
  const endTime = availability.endTime || '05:00 PM';

  // Format task summary for prompt
  const taskListText =
    activeTasks.length > 0
      ? activeTasks
          .map(
            (t, i) =>
              `${i + 1}. "${t.title}" (Priority: ${t.priority}, Est: ${t.estimatedMinutes || 'unspecified'}m, Due: ${
                t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'None'
              })`
          )
          .join('\n')
      : 'No active tasks.';

  const prompt = `You are PulseOS Assistant, a student productivity coach. Analyze the user's current productivity context and generate a realistic daily focus plan.

CURRENT PRODUCTIVITY METRICS:
- Today Focus Minutes: ${overview.focusTodayMinutes} min (${overview.sessionsToday} sessions)
- 7-Day Focus Minutes: ${overview.focusWeekMinutes} min
- Average Session Length: ${overview.averageSessionMinutes} min
- Overall Completion Rate: ${performance.completionRate}%
- Planned vs Actual Ratio: ${performance.plannedVsActualRatio}

ACTIVE TASKS TO ACCOMPLISH:
${taskListText}

USER AVAILABILITY WINDOW: ${startTime} to ${endTime}

INSTRUCTIONS:
1. Provide a concise, motivating daily goal (1 sentence).
2. Generate 2 to 3 practical productivity recommendations based on their completion patterns and workload.
3. Suggest a chronological focus schedule (2 to 4 focus blocks) fitting inside the availability window (${startTime} - ${endTime}).
4. Return strictly VALID JSON with NO markdown formatting, matching this exact structure:

{
  "dailyGoal": "string",
  "workloadSummary": {
    "openTasksCount": number,
    "totalEstimatedMinutes": number
  },
  "recommendations": [
    {
      "type": "string",
      "title": "string",
      "description": "string"
    }
  ],
  "proposedPlan": [
    {
      "timeSlot": "string",
      "action": "string",
      "taskTitle": "string"
    }
  ]
}`;

  try {
    const rawAiText = await aiProvider.generateText(prompt);

    // Clean potential code block wrapper
    let cleanJsonStr = rawAiText.trim();
    if (cleanJsonStr.startsWith('```')) {
      cleanJsonStr = cleanJsonStr.replace(/^```(json)?/, '').replace(/```$/, '').trim();
    }

    const parsed = JSON.parse(cleanJsonStr);

    // Ensure required fields exist
    return {
      dailyGoal: parsed.dailyGoal || 'Make steady progress on your top priorities today.',
      workloadSummary: {
        openTasksCount: activeTasks.length,
        totalEstimatedMinutes: activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0),
      },
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      proposedPlan: Array.isArray(parsed.proposedPlan) ? parsed.proposedPlan : [],
      isFallback: false,
    };
  } catch (err) {
    console.warn('AI Daily Plan generation failed, returning deterministic fallback plan:', err.message);

    // Fallback plan when AI API key is unconfigured or errors
    const fallbackPlan = activeTasks.slice(0, 3).map((t, idx) => ({
      timeSlot: idx === 0 ? '09:00 AM - 09:45 AM' : idx === 1 ? '10:00 AM - 10:45 AM' : '11:00 AM - 11:45 AM',
      action: `Focus Session ${idx + 1}`,
      taskTitle: t.title,
    }));

    return {
      dailyGoal: 'Focus on your highest priority task with structured study intervals.',
      workloadSummary: {
        openTasksCount: activeTasks.length,
        totalEstimatedMinutes: activeTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 30), 0),
      },
      recommendations: [
        {
          type: 'priority_focus',
          title: 'Tackle High Priority First',
          description: 'Start your morning with your most urgent task to build momentum.',
        },
        {
          type: 'break_pacing',
          title: 'Maintain 5-Minute Rest Breaks',
          description: 'Step away between focus sessions to preserve mental sharpness.',
        },
      ],
      proposedPlan:
        fallbackPlan.length > 0
          ? fallbackPlan
          : [
              {
                timeSlot: `${startTime} - ${startTime.replace(':00', ':45')}`,
                action: 'Focus Session 1',
                taskTitle: 'Primary Focus Task',
              },
            ],
      isFallback: true,
    };
  }
};

module.exports = {
  generateDailyPlan,
};
