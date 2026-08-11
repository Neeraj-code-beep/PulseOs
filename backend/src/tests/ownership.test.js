const mongoose = require('mongoose');
require('dotenv').config();
const UserModel = require('../models/User');
const TodoModel = require('../models/Todo');
const FocusSessionModel = require('../models/FocusSession');
const todoController = require('../controllers/todo.controller');
const focusController = require('../controllers/focus.controller');
const analyticsService = require('../services/analytics.service');

const runOwnershipTests = async () => {
  const mongoUri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pulseos_test';
  console.log('Connecting to DB for User Data Ownership test suite...');

  await mongoose.connect(mongoUri);
  console.log('Connected to DB for Data Ownership suite.');

  // Clean collections & sync indexes before running tests
  try {
    await UserModel.collection.dropIndexes();
  } catch {
    // ignore if collection didn't exist
  }
  await UserModel.syncIndexes();
  await UserModel.deleteMany({});
  await TodoModel.deleteMany({});
  await FocusSessionModel.deleteMany({});


  console.log('\n--- Running User Data Ownership Test Matrix (10-19) ---\n');

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
    // Setup Users A and B
    const userA = await UserModel.create({
      name: 'User A',
      email: 'usera@example.com',
      passwordHash: 'hash_a_12345678',
    });

    const userB = await UserModel.create({
      name: 'User B',
      email: 'userb@example.com',
      passwordHash: 'hash_b_12345678',
    });

    const reqA = { user: { userId: userA._id.toString() }, query: {} };
    const reqB = { user: { userId: userB._id.toString() }, query: {} };

    // 10. User A creates task
    const createReqA = {
      ...reqA,
      body: { title: 'User A Task', estimatedMinutes: 45, priority: 'high' },
    };
    const createResA = mockRes();
    await todoController.createTodo(createReqA, createResA);

    console.assert(createResA.statusCode === 201, `10 Fail: expected 201, got ${createResA.statusCode}`);
    const taskA = createResA.body.data;
    console.assert(taskA.userId.toString() === userA._id.toString(), '10 Fail: userId on task mismatch');
    console.log('PASS [10]: User A creates task with user ownership bound');

    // 11. User A can read task
    const getResA = mockRes();
    await todoController.getTodos(reqA, getResA);

    console.assert(getResA.statusCode === 200, `11 Fail: got ${getResA.statusCode}`);
    console.assert(getResA.body.data.length === 1, `11 Fail: expected 1 task for User A, got ${getResA.body.data.length}`);
    console.assert(getResA.body.data[0]._id.toString() === taskA._id.toString(), '11 Fail: task ID mismatch');
    console.log('PASS [11]: User A can read their own task');

    // 12. User B cannot read User A's task
    const getResB = mockRes();
    await todoController.getTodos(reqB, getResB);

    console.assert(getResB.statusCode === 200, `12 Fail: got ${getResB.statusCode}`);
    console.assert(getResB.body.data.length === 0, `12 Fail: User B received User A task (count: ${getResB.body.data.length})`);
    console.log('PASS [12]: User B cannot read User A task (isolated task list)');

    // 13. User B cannot update User A's task
    const updateReqB = {
      ...reqB,
      params: { id: taskA._id.toString() },
      body: { title: 'Hacked Title' },
    };
    const updateResB = mockRes();
    await todoController.updateTodo(updateReqB, updateResB);

    console.assert(updateResB.statusCode === 404, `13 Fail: expected 404 for unowned update, got ${updateResB.statusCode}`);
    console.log('PASS [13]: User B update on User A task returns 404 Not Found');

    // 14. User B cannot delete User A's task
    const deleteReqB = {
      ...reqB,
      params: { id: taskA._id.toString() },
    };
    const deleteResB = mockRes();
    await todoController.deleteTodo(deleteReqB, deleteResB);

    console.assert(deleteResB.statusCode === 404, `14 Fail: expected 404 for unowned delete, got ${deleteResB.statusCode}`);
    console.log('PASS [14]: User B delete on User A task returns 404 Not Found');

    // 15. User A creates focus session
    const now = new Date();
    const focusReqA = {
      ...reqA,
      body: {
        taskId: taskA._id.toString(),
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 1500,
        status: 'completed',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 1500000).toISOString(),
      },
    };
    const focusResA = mockRes();
    await focusController.createFocusSession(focusReqA, focusResA);

    console.assert(focusResA.statusCode === 201, `15 Fail: expected 201, got ${focusResA.statusCode}`);
    const sessionA = focusResA.body.data.session;
    console.assert(sessionA.userId.toString() === userA._id.toString(), '15 Fail: focus session userId mismatch');
    console.log('PASS [15]: User A creates focus session');

    // 16. User B cannot access User A's focus session history
    const focusGetResB = mockRes();
    await focusController.getFocusSessions(reqB, focusGetResB);

    console.assert(focusGetResB.statusCode === 200, `16 Fail: got ${focusGetResB.statusCode}`);
    console.assert(focusGetResB.body.data.length === 0, `16 Fail: User B accessed User A focus session`);
    console.log('PASS [16]: User B focus session history excludes User A sessions');

    // 17. User B cannot bind User A's task to a focus session
    const focusBindReqB = {
      ...reqB,
      body: {
        taskId: taskA._id.toString(),
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 1500,
        status: 'completed',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 1500000).toISOString(),
      },
    };
    const focusBindResB = mockRes();
    await focusController.createFocusSession(focusBindReqB, focusBindResB);

    console.assert(focusBindResB.statusCode === 404, `17 Fail: expected 404 when binding unowned task, got ${focusBindResB.statusCode}`);
    console.log('PASS [17]: User B cannot bind User A task to focus session');

    // 18. User A analytics exclude User B tasks
    // User B creates a completed task
    await TodoModel.create({
      userId: userB._id,
      title: 'User B Task',
      completed: true,
      completedAt: now,
      estimatedMinutes: 120,
    });

    const analyticsA = await analyticsService.getOverview(userA._id);
    const analyticsB = await analyticsService.getOverview(userB._id);

    console.assert(analyticsA.completedTasksToday === 0, `18 Fail: User A analytics included User B task (got ${analyticsA.completedTasksToday})`);
    console.assert(analyticsB.completedTasksToday === 1, `18 Fail: User B analytics missing task`);
    console.log('PASS [18]: User A analytics exclude User B tasks');

    // 19. User A analytics exclude User B focus sessions
    await FocusSessionModel.create({
      userId: userB._id,
      mode: 'pomodoro',
      plannedMinutes: 60,
      actualSeconds: 3600,
      status: 'completed',
      startedAt: now,
      endedAt: new Date(now.getTime() + 3600000),
    });

    const analyticsA_updated = await analyticsService.getOverview(userA._id);
    const analyticsB_updated = await analyticsService.getOverview(userB._id);

    console.assert(analyticsA_updated.focusTodayMinutes === 25, `19 Fail: User A got ${analyticsA_updated.focusTodayMinutes} instead of 25`);
    console.assert(analyticsB_updated.focusTodayMinutes === 60, `19 Fail: User B got ${analyticsB_updated.focusTodayMinutes} instead of 60`);
    console.log('PASS [19]: User A analytics exclude User B focus sessions');

    console.log('\n--- ALL USER DATA OWNERSHIP TESTS PASSED SUCCESSFULLY! ---\n');
  } finally {
    await UserModel.deleteMany({});
    await TodoModel.deleteMany({});
    await FocusSessionModel.deleteMany({});
    await mongoose.connection.close();
    console.log('Ownership test database connection closed.');
  }
};

runOwnershipTests().catch((err) => {
  console.error('OWNERSHIP TEST MATRIX FAILURE:', err);
  process.exit(1);
});
