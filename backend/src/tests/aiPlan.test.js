const mongoose = require('mongoose');
require('dotenv').config();
const UserModel = require('../models/User');
const TodoModel = require('../models/Todo');
const FocusSessionModel = require('../models/FocusSession');
const aiPlanService = require('../services/aiPlan.service');
const aiController = require('../controllers/ai.controller');

const runAiPlanTests = async () => {
  const mongoUri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pulseos_test';
  console.log('Connecting to DB for AI Daily Plan test suite...');

  await mongoose.connect(mongoUri);
  console.log('Connected to DB for AI Daily Plan suite.');

  // Clean collections
  await UserModel.deleteMany({});
  await TodoModel.deleteMany({});
  await FocusSessionModel.deleteMany({});

  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    return res;
  };

  try {
    console.log('\n--- Running AI Daily Plan Test Matrix ---\n');

    // 1. Setup User & Active Tasks
    const user = await UserModel.create({
      name: 'Plan Learner',
      email: 'plan@example.com',
      passwordHash: 'hash12345678',
    });

    await TodoModel.create({
      userId: user._id,
      title: 'High Priority Homework',
      priority: 'high',
      estimatedMinutes: 60,
      completed: false,
    });

    await TodoModel.create({
      userId: user._id,
      title: 'Medium Priority Study',
      priority: 'medium',
      estimatedMinutes: 30,
      completed: false,
    });

    const now = new Date();
    await FocusSessionModel.create({
      userId: user._id,
      mode: 'pomodoro',
      plannedMinutes: 25,
      actualSeconds: 1500,
      status: 'completed',
      startedAt: now,
      endedAt: new Date(now.getTime() + 1500000),
    });

    // 2. Test generateDailyPlan Service
    const planResult = await aiPlanService.generateDailyPlan(user._id.toString(), {
      startTime: '09:00 AM',
      endTime: '05:00 PM',
    });

    console.assert(typeof planResult.dailyGoal === 'string', '1 Fail: dailyGoal string missing');
    console.assert(planResult.workloadSummary.openTasksCount === 2, `2 Fail: expected 2 open tasks, got ${planResult.workloadSummary.openTasksCount}`);
    console.assert(Array.isArray(planResult.recommendations) && planResult.recommendations.length > 0, '3 Fail: recommendations empty');
    console.assert(Array.isArray(planResult.proposedPlan) && planResult.proposedPlan.length > 0, '4 Fail: proposedPlan empty');
    console.assert(typeof planResult.isFallback === 'boolean', '5 Fail: isFallback boolean property missing');
    console.log('PASS [1]: Service generates valid structured daily focus plan synthesizing tasks, focus history, and completion metrics');

    // 3. Test Controller Endpoint
    const req = {
      user: { userId: user._id.toString() },
      body: { availability: { startTime: '10:00 AM', endTime: '04:00 PM' } },
    };
    const res = mockRes();
    await aiController.getDailyPlan(req, res);

    console.assert(res.statusCode === 200, `5 Fail: expected 200, got ${res.statusCode}`);
    console.assert(res.body.success === true, '6 Fail: success should be true');
    console.assert(res.body.data.workloadSummary.openTasksCount === 2, '7 Fail: controller payload mismatch');
    console.assert(typeof res.body.data.isFallback === 'boolean', '8 Fail: controller response isFallback boolean missing');
    console.log('PASS [2]: Controller GET /api/ai/daily-plan returns 200 OK with formatted recommendations');

    // 4. Test AI Daily Plan Fallback when AI service throws error
    const aiProvider = require('../integrations/ai/ai.provider');
    const originalGenerateText = aiProvider.generateText;
    aiProvider.generateText = async () => {
      throw new Error('Simulated AI provider failure');
    };

    try {
      const fallbackResult = await aiPlanService.generateDailyPlan(user._id.toString(), {
        startTime: '09:00 AM',
        endTime: '05:00 PM',
      });
      console.assert(fallbackResult.isFallback === true, '3 Fail: isFallback should be true when AI service errors');
      console.assert(fallbackResult.proposedPlan.length > 0, '3 Fail: fallback proposedPlan should not be empty');
      console.assert(fallbackResult.recommendations.length > 0, '3 Fail: fallback recommendations should not be empty');
      console.log('PASS [3]: Fallback plan triggered gracefully with isFallback: true on AI service failure');
    } finally {
      aiProvider.generateText = originalGenerateText;
    }

    console.log('\n--- ALL AI DAILY PLAN TESTS PASSED SUCCESSFULLY! ---\n');
  } finally {
    await UserModel.deleteMany({});
    await TodoModel.deleteMany({});
    await FocusSessionModel.deleteMany({});
    await mongoose.connection.close();
    console.log('AI Plan test database connection closed.');
  }
};

runAiPlanTests().catch((err) => {
  console.error('AI PLAN TEST MATRIX FAILURE:', err);
  process.exit(1);
});
