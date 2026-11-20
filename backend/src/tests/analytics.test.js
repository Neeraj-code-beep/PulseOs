const assert = require('assert');
const mongoose = require('mongoose');
const { connectTestDb, disconnectTestDb, createTestTracker } = require('./testDbGuard');
const TodoModel = require('../models/Todo');
const FocusSessionModel = require('../models/FocusSession');
const analyticsService = require('../services/analytics.service');
const analyticsController = require('../controllers/analytics.controller');

const runTests = async () => {
  await connectTestDb();
  const tracker = createTestTracker();

  const testUserId = new mongoose.Types.ObjectId();
  tracker.trackUser(testUserId);
  const testUserReq = { user: { userId: testUserId.toString() } };

  console.log('\n--- Running Backend Analytics Test Matrix ---\n');

  let testError = null;
  try {
    // A. Empty database -> all metrics zero
    const emptyOverview = await analyticsService.getOverview(testUserId);
    assert(emptyOverview.focusTodayMinutes === 0, 'A1 Fail');
    assert(emptyOverview.focusWeekMinutes === 0, 'A2 Fail');
    assert(emptyOverview.completedTasksToday === 0, 'A3 Fail');
    assert(emptyOverview.completedTasksWeek === 0, 'A4 Fail');
    assert(emptyOverview.sessionsToday === 0, 'A5 Fail');
    assert(emptyOverview.sessionsWeek === 0, 'A6 Fail');
    assert(emptyOverview.averageSessionMinutes === 0, 'A7 Fail');
    assert(emptyOverview.totalFocusMinutes === 0, 'A8 Fail');
    console.log('PASS [A]: Empty database metrics all zero');

    // B. One completed focus session today -> focusTodayMinutes correct (30 min = 1800s)
    const now = new Date();
    await FocusSessionModel.create({
      userId: testUserId,
      mode: 'pomodoro',
      plannedMinutes: 30,
      actualSeconds: 1800,
      status: 'completed',
      startedAt: now,
      endedAt: new Date(now.getTime() + 1800000),
    });

    const bOverview = await analyticsService.getOverview(testUserId);
    assert(bOverview.focusTodayMinutes === 30, `B1 Fail: got ${bOverview.focusTodayMinutes}`);
    assert(bOverview.sessionsToday === 1, 'B2 Fail');
    console.log('PASS [B]: One completed focus session today');

    // C. Multiple sessions today -> summed correctly (+15 min = 900s)
    await FocusSessionModel.create({
      userId: testUserId,
      mode: 'custom',
      plannedMinutes: 15,
      actualSeconds: 900,
      status: 'completed',
      startedAt: now,
      endedAt: new Date(now.getTime() + 900000),
    });
    const cOverview = await analyticsService.getOverview(testUserId);
    assert(cOverview.focusTodayMinutes === 45, `C1 Fail: got ${cOverview.focusTodayMinutes}`);
    assert(cOverview.sessionsToday === 2, 'C2 Fail');
    console.log('PASS [C]: Multiple sessions today summed correctly (45m, 2 sessions)');

    // D. Cancelled session -> ignored
    await FocusSessionModel.create({
      userId: testUserId,
      mode: 'pomodoro',
      plannedMinutes: 25,
      actualSeconds: 600,
      status: 'cancelled',
      startedAt: now,
      endedAt: new Date(now.getTime() + 600000),
    });
    const dOverview = await analyticsService.getOverview(testUserId);
    assert(dOverview.focusTodayMinutes === 45, 'D1 Fail: cancelled session included');
    assert(dOverview.sessionsToday === 2, 'D2 Fail: cancelled session counted');
    console.log('PASS [D]: Cancelled session ignored');

    // E & F. Trend for 7 days with zero-activity days and date separation
    const trend7 = await analyticsService.getFocusTrend(testUserId, 7);
    assert(trend7.points.length === 7, `K Fail: 7 points expected, got ${trend7.points.length}`);
    const todayStr = analyticsService.formatLocalDateString(now);
    const todayPoint = trend7.points.find((p) => p.date === todayStr);
    assert(todayPoint && todayPoint.focusMinutes === 45, 'E/F Fail: today trend point missing or invalid');
    console.log('PASS [E, F, K]: Focus trend 7 days includes zero-activity days & correct today bucket');

    // L & M. Trend for 14 and 30 days
    const trend14 = await analyticsService.getFocusTrend(testUserId, 14);
    assert(trend14.points.length === 14, `L Fail: got ${trend14.points.length}`);
    const trend30 = await analyticsService.getFocusTrend(testUserId, 30);
    assert(trend30.points.length === 30, `M Fail: got ${trend30.points.length}`);
    console.log('PASS [L, M]: Focus trend 14 and 30 days return correct point counts');

    // N. Controller validation for invalid days (days=0, -1, 100, abc)
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

    const invalidReqs = [
      { ...testUserReq, query: { days: '0' } },
      { ...testUserReq, query: { days: '-1' } },
      { ...testUserReq, query: { days: '100' } },
      { ...testUserReq, query: { days: 'abc' } },
    ];
    for (const req of invalidReqs) {
      const res = mockRes();
      await analyticsController.getFocusTrend(req, res);
      assert(res.statusCode === 400, `N Fail for days=${req.query.days}: status code ${res.statusCode}`);
      assert(res.body.success === false, `N Fail for days=${req.query.days}`);
    }
    console.log('PASS [N]: Invalid days query parameters rejected with 400 Bad Request');

    // G, H, I. Completed task today, uncomplete task, historical task
    const todo = await TodoModel.create({
      userId: testUserId,
      title: 'Analytics Task',
      completed: false,
    });
    assert(todo.completedAt === null, 'H1 Fail: new todo completedAt not null');

    // Update completed: true
    const updated1 = await TodoModel.findByIdAndUpdate(
      todo._id,
      { completed: true, completedAt: new Date() },
      { new: true }
    );
    assert(updated1.completedAt !== null, 'G1 Fail: completedAt not set on completion');

    const gOverview = await analyticsService.getOverview(testUserId);
    assert(gOverview.completedTasksToday === 1, `G2 Fail: got ${gOverview.completedTasksToday}`);
    console.log('PASS [G]: Completed task today increments completedTasksToday');

    // Uncomplete task
    const updated2 = await TodoModel.findByIdAndUpdate(
      todo._id,
      { completed: false, completedAt: null },
      { new: true }
    );
    assert(updated2.completedAt === null, 'H2 Fail: completedAt not cleared');

    const hOverview = await analyticsService.getOverview(testUserId);
    assert(hOverview.completedTasksToday === 0, 'H3 Fail: uncompleted task still counted');
    console.log('PASS [H]: Uncomplete task clears completedAt and decrements today count');

    // Historical completed task (yesterday)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    await TodoModel.create({
      userId: testUserId,
      title: 'Yesterday Task',
      completed: true,
      completedAt: yesterday,
    });

    const iOverview = await analyticsService.getOverview(testUserId);
    assert(iOverview.completedTasksToday === 0, 'I Fail: yesterday completed task included in today count');
    console.log('PASS [I]: Completed task from previous day excluded from today metric');

    // O. Task performance with no estimates
    const perfO = await analyticsService.getTaskPerformance(testUserId);
    assert(perfO.plannedMinutes === 0, `O1 Fail: plannedMinutes = ${perfO.plannedMinutes}`);
    assert(perfO.plannedVsActualRatio === 0, `O2 Fail: ratio = ${perfO.plannedVsActualRatio}`);
    console.log('PASS [O]: Task performance with no estimates returns plannedMinutes 0');

    // P. Task performance with estimates + focus
    await TodoModel.create({
      userId: testUserId,
      title: 'Estimated Task',
      estimatedMinutes: 60,
      completed: true,
      completedAt: now,
    });

    const perfP = await analyticsService.getTaskPerformance(testUserId);
    assert(perfP.plannedMinutes === 60, `P1 Fail: plannedMinutes = ${perfP.plannedMinutes}`);
    assert(perfP.focusedMinutes === 45, `P2 Fail: focusedMinutes = ${perfP.focusedMinutes}`);
    assert(perfP.plannedVsActualRatio === 0.75, `P3 Fail: ratio = ${perfP.plannedVsActualRatio}`);
    console.log('PASS [P]: Task performance with estimates calculated correctly (planned 60m, focus 45m, ratio 0.75)');

    // J. Week boundary check
    const startOfWeek = analyticsService.getStartOfCurrentWeek();
    const startOfNextWeek = analyticsService.getStartOfNextWeek();
    assert(startOfWeek.getDay() === 1, 'J1 Fail: startOfWeek is not Monday');
    const diffDays = Math.round((startOfNextWeek - startOfWeek) / (1000 * 60 * 60 * 24));
    assert(diffDays === 7, 'J2 Fail: week boundary is not 7 days');
    console.log('PASS [J]: Week boundary is Monday 00:00 to Sunday 23:59:59 (7 days)');

    // Q. Dashboard Endpoint Success, User Ownership & Period Support (7, 14, 30 days)
    const dashRes7 = mockRes();
    await analyticsController.getDashboard({ ...testUserReq, query: { days: '7' } }, dashRes7);
    assert(dashRes7.statusCode === 200, `Q1 Fail: status code ${dashRes7.statusCode}`);
    assert(dashRes7.body.data.overview.focusTodayMinutes === 45, 'Q2 Fail: overview focusTodayMinutes');
    assert(dashRes7.body.data.trend.length === 7, `Q3 Fail: trend length ${dashRes7.body.data.trend.length}`);
    assert(dashRes7.body.data.recentSessions.length === 3, `Q4 Fail: recentSessions count ${dashRes7.body.data.recentSessions.length}`);

    const dashRes14 = mockRes();
    await analyticsController.getDashboard({ ...testUserReq, query: { days: '14' } }, dashRes14);
    assert(dashRes14.body.data.trend.length === 14, 'Q5 Fail: 14 days trend length');

    const dashRes30 = mockRes();
    await analyticsController.getDashboard({ ...testUserReq, query: { days: '30' } }, dashRes30);
    assert(dashRes30.body.data.trend.length === 30, 'Q6 Fail: 30 days trend length');
    console.log('PASS [Q]: Consolidated dashboard endpoint succeeds for 7, 14, 30 days');

    // R. Dashboard invalid days rejection (400 Bad Request)
    const invalidDashReqs = ['0', '-1', '100', 'abc'];
    for (const d of invalidDashReqs) {
      const res = mockRes();
      await analyticsController.getDashboard({ ...testUserReq, query: { days: d } }, res);
      assert(res.statusCode === 400, `R Fail for days=${d}: status ${res.statusCode}`);
      assert(res.body.success === false, `R Fail body for days=${d}`);
    }
    console.log('PASS [R]: Dashboard endpoint rejects invalid days with 400 Bad Request');

    // S. User Isolation test (User A cannot receive User B analytics in dashboard)
    const otherUserId = new mongoose.Types.ObjectId().toString();
    const otherUserReq = { user: { userId: otherUserId }, query: {} };
    const otherDashRes = mockRes();
    await analyticsController.getDashboard(otherUserReq, otherDashRes);
    assert(otherDashRes.statusCode === 200, `S1 Fail: got ${otherDashRes.statusCode}`);
    assert(otherDashRes.body && otherDashRes.body.data.overview.focusTodayMinutes === 0, 'S2 Fail: User B received User A focus time');
    assert(otherDashRes.body && otherDashRes.body.data.recentSessions.length === 0, 'S3 Fail: User B received User A recent sessions');
    console.log('PASS [S]: Dashboard endpoint enforces strict user-scoped data isolation');

    // T. Recent Sessions newest-first and bounded limit test
    const recentSess = await analyticsService.getRecentSessions(testUserId, 10);
    assert(recentSess.length === 3, `T1 Fail: expected 3 sessions, got ${recentSess.length}`);
    const timeFirst = new Date(recentSess[0].createdAt).getTime();
    const timeSecond = new Date(recentSess[1].createdAt).getTime();
    assert(timeFirst >= timeSecond, 'T2 Fail: recentSessions not newest first');
    console.log('PASS [T]: Recent sessions returned newest first and bounded correctly');

    console.log('\n--- ALL BACKEND ANALYTICS TESTS PASSED SUCCESSFULLY! ---\n');
  } catch (err) {
    testError = err;
  } finally {
    const cleanupErrors = [];
    try {
      // Clean up test data scoped to test user
      await tracker.cleanup({ TodoModel, FocusSessionModel });
    } catch (err) {
      cleanupErrors.push(err);
      console.error('[analytics.test] Error during tracker cleanup:', err.message);
    }
    try {
      await disconnectTestDb();
    } catch (err) {
      cleanupErrors.push(err);
      console.error('[analytics.test] Error during disconnect:', err.message);
    }
    if (testError) {
      if (cleanupErrors.length > 0) {
        console.error('[analytics.test] Additional errors during cleanup:', cleanupErrors);
      }
      throw testError;
    }
    if (cleanupErrors.length > 0) {
      throw cleanupErrors[0];
    }
    console.log('Database connection closed.');
  }
};

runTests().catch((err) => {
  console.error('TEST MATRIX ERROR:', err);
  process.exit(1);
});
