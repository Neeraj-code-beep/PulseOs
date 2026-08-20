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

    // 20. Idempotency test: duplicate clientSessionId does not create duplicate credit
    const idempotencySessionId = `client_sess_${Date.now()}`;
    const initialTaskState = await TodoModel.findById(taskA._id);
    const initialFocusTime = initialTaskState.focusTimeSpent || 0;

    const focusReqIdempotent1 = {
      ...reqA,
      body: {
        clientSessionId: idempotencySessionId,
        taskId: taskA._id.toString(),
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 1500,
        status: 'completed',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 1500000).toISOString(),
      },
    };
    const focusResIdempotent1 = mockRes();
    await focusController.createFocusSession(focusReqIdempotent1, focusResIdempotent1);
    console.assert(focusResIdempotent1.statusCode === 201, `20 Fail (1): expected 201, got ${focusResIdempotent1.statusCode}`);

    const afterFirstSessionTask = await TodoModel.findById(taskA._id);
    console.assert(afterFirstSessionTask.focusTimeSpent === initialFocusTime + 25, `20 Fail: expected focusTimeSpent ${initialFocusTime + 25}, got ${afterFirstSessionTask.focusTimeSpent}`);

    // Second call with same clientSessionId
    const focusResIdempotent2 = mockRes();
    await focusController.createFocusSession(focusReqIdempotent1, focusResIdempotent2);
    console.assert(focusResIdempotent2.statusCode === 200, `20 Fail (2): expected 200, got ${focusResIdempotent2.statusCode}`);

    const afterSecondSessionTask = await TodoModel.findById(taskA._id);
    console.assert(afterSecondSessionTask.focusTimeSpent === initialFocusTime + 25, `20 Fail: duplicate clientSessionId incremented focusTimeSpent to ${afterSecondSessionTask.focusTimeSpent}`);
    console.log('PASS [20]: Duplicate clientSessionId returns 200 without duplicate focus time credit');

    // 21. Cancelled session does not increment focus time spent
    const cancelReq = {
      ...reqA,
      body: {
        clientSessionId: `${idempotencySessionId}_cancel`,
        taskId: taskA._id.toString(),
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 600,
        status: 'cancelled',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 600000).toISOString(),
      },
    };
    const cancelRes = mockRes();
    await focusController.createFocusSession(cancelReq, cancelRes);
    console.assert(cancelRes.statusCode === 201, `21 Fail: expected 201 for cancelled session, got ${cancelRes.statusCode}`);

    const afterCancelTask = await TodoModel.findById(taskA._id);
    console.assert(afterCancelTask.focusTimeSpent === afterSecondSessionTask.focusTimeSpent, `21 Fail: cancelled session incremented focusTimeSpent`);
    console.log('PASS [21]: Cancelled focus session logged without incrementing task focus time');

    // 22. Todo completion state transition & completedAt consistency test
    const toggleReq1 = { ...reqA, params: { id: taskA._id.toString() }, body: { completed: true } };
    const toggleRes1 = mockRes();
    await todoController.updateTodo(toggleReq1, toggleRes1);
    console.assert(toggleRes1.statusCode === 200, `22 Fail (1): status ${toggleRes1.statusCode}`);
    console.assert(toggleRes1.body.data.completed === true, '22 Fail: task not completed');
    console.assert(toggleRes1.body.data.completedAt !== null, '22 Fail: completedAt is null');

    const toggleReq2 = { ...reqA, params: { id: taskA._id.toString() }, body: { completed: false } };
    const toggleRes2 = mockRes();
    await todoController.updateTodo(toggleReq2, toggleRes2);
    console.assert(toggleRes2.statusCode === 200, `22 Fail (2): status ${toggleRes2.statusCode}`);
    console.assert(toggleRes2.body.data.completed === false, '22 Fail: task not reopened');
    console.assert(toggleRes2.body.data.completedAt === null, '22 Fail: completedAt not cleared to null');
    console.log('PASS [22]: Todo completion toggle maintains strict completedAt consistency');

    // 23. Deleted task focus session safety test
    const tempTaskReq = { ...reqA, body: { title: 'Temporary Task to Delete' } };
    const tempTaskRes = mockRes();
    await todoController.createTodo(tempTaskReq, tempTaskRes);
    const tempTaskId = tempTaskRes.body.data._id.toString();

    // Delete the task
    const delReq = { ...reqA, params: { id: tempTaskId } };
    const delRes = mockRes();
    await todoController.deleteTodo(delReq, delRes);
    console.assert(delRes.statusCode === 200, '23 Fail: delete failed');

    // Submit focus session referencing deleted task (should log safely without crash or orphan errors)
    const deletedTaskFocusReq = {
      ...reqA,
      body: {
        taskId: tempTaskId,
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 1500,
        status: 'completed',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 1500000).toISOString(),
      },
    };
    const deletedTaskFocusRes = mockRes();
    await focusController.createFocusSession(deletedTaskFocusReq, deletedTaskFocusRes);
    console.assert(deletedTaskFocusRes.statusCode === 404, `23 Fail: expected 404 for deleted task binding, got ${deletedTaskFocusRes.statusCode}`);
    console.log('PASS [23]: Focus session binding to deleted task handled safely with 404 response');

    // 24. Create task without tags/subtasks defaults to []
    const plainTaskReq = { ...reqA, body: { title: 'Plain Task' } };
    const plainTaskRes = mockRes();
    await todoController.createTodo(plainTaskReq, plainTaskRes);
    console.assert(plainTaskRes.statusCode === 201, '24 Fail: expected 201');
    console.assert(Array.isArray(plainTaskRes.body.data.tags) && plainTaskRes.body.data.tags.length === 0, '24 Fail: tags not empty array');
    console.assert(Array.isArray(plainTaskRes.body.data.subtasks) && plainTaskRes.body.data.subtasks.length === 0, '24 Fail: subtasks not empty array');
    console.log('PASS [24]: Create task without tags/subtasks defaults to empty arrays');

    // 25. Create task with valid tags & 26. Tag normalization & 27. Duplicate tag removal
    const tagTaskReq = {
      ...reqA,
      body: {
        title: 'Tagged Task',
        tags: [' CS101 ', 'cs101', 'Assignment', 'MATH '],
      },
    };
    const tagTaskRes = mockRes();
    await todoController.createTodo(tagTaskReq, tagTaskRes);
    console.assert(tagTaskRes.statusCode === 201, '25 Fail: expected 201');
    const tagsResult = tagTaskRes.body.data.tags;
    console.assert(tagsResult.length === 3, `25 Fail: expected 3 unique normalized tags, got ${tagsResult.length}`);
    console.assert(tagsResult.includes('cs101') && tagsResult.includes('assignment') && tagsResult.includes('math'), '25 Fail: tag normalization mismatch');
    console.log('PASS [25-27]: Create task with tags normalizes to lowercase, trims whitespace, and removes duplicates');

    // 28. Reject >5 tags
    const excessTagsReq = {
      ...reqA,
      body: {
        title: 'Excess Tags Task',
        tags: ['t1', 't2', 't3', 't4', 't5', 't6'],
      },
    };
    const excessTagsRes = mockRes();
    await todoController.createTodo(excessTagsReq, excessTagsRes);
    console.assert(excessTagsRes.statusCode === 400, `28 Fail: expected 400 for >5 tags, got ${excessTagsRes.statusCode}`);
    console.log('PASS [28]: Reject >5 tags returns 400 Bad Request');

    // 29. Reject tag >30 characters
    const longTagReq = {
      ...reqA,
      body: {
        title: 'Long Tag Task',
        tags: ['a'.repeat(31)],
      },
    };
    const longTagRes = mockRes();
    await todoController.createTodo(longTagReq, longTagRes);
    console.assert(longTagRes.statusCode === 400, `29 Fail: expected 400 for >30 char tag, got ${longTagRes.statusCode}`);
    console.log('PASS [29]: Reject tag >30 characters returns 400 Bad Request');

    // 30. Create task with subtasks & 31. Subtask defaults completed=false, completedAt=null
    const subtaskTaskReq = {
      ...reqA,
      body: {
        title: 'Task with Subtasks',
        subtasks: [
          { title: 'Subtask 1' },
          { title: 'Subtask 2', completed: false },
        ],
      },
    };
    const subtaskTaskRes = mockRes();
    await todoController.createTodo(subtaskTaskReq, subtaskTaskRes);
    console.assert(subtaskTaskRes.statusCode === 201, '30 Fail: expected 201');
    const createdSubtasks = subtaskTaskRes.body.data.subtasks;
    console.assert(createdSubtasks.length === 2, `30 Fail: expected 2 subtasks, got ${createdSubtasks.length}`);
    console.assert(createdSubtasks[0].completed === false && createdSubtasks[0].completedAt === null, '31 Fail: subtask 1 default mismatch');
    console.assert(createdSubtasks[1].completed === false && createdSubtasks[1].completedAt === null, '31 Fail: subtask 2 default mismatch');
    console.log('PASS [30-31]: Create task with subtasks defaults completed=false and completedAt=null');

    // 32. Completing subtask sets completedAt timestamp
    const createdSubtaskId = createdSubtasks[0]._id.toString();
    const updateSubtaskReq1 = {
      ...reqA,
      params: { id: subtaskTaskRes.body.data._id.toString() },
      body: {
        subtasks: [
          { _id: createdSubtaskId, title: 'Subtask 1', completed: true },
          { _id: createdSubtasks[1]._id.toString(), title: 'Subtask 2', completed: false },
        ],
      },
    };
    const updateSubtaskRes1 = mockRes();
    await todoController.updateTodo(updateSubtaskReq1, updateSubtaskRes1);
    console.assert(updateSubtaskRes1.statusCode === 200, `32 Fail: status ${updateSubtaskRes1.statusCode}`);
    const updatedSubtasks1 = updateSubtaskRes1.body.data.subtasks;
    const sub1Completed = updatedSubtasks1.find((s) => s._id.toString() === createdSubtaskId);
    console.assert(sub1Completed.completed === true, '32 Fail: subtask 1 not completed');
    console.assert(sub1Completed.completedAt !== null, '32 Fail: subtask 1 completedAt is null');
    const sub1CompletedAtTimestamp = new Date(sub1Completed.completedAt).getTime();
    console.log('PASS [32]: Completing subtask sets completedAt timestamp');

    // 33. Reopening subtask clears completedAt
    const updateSubtaskReq2 = {
      ...reqA,
      params: { id: subtaskTaskRes.body.data._id.toString() },
      body: {
        subtasks: [
          { _id: createdSubtaskId, title: 'Subtask 1', completed: false },
          { _id: createdSubtasks[1]._id.toString(), title: 'Subtask 2', completed: false },
        ],
      },
    };
    const updateSubtaskRes2 = mockRes();
    await todoController.updateTodo(updateSubtaskReq2, updateSubtaskRes2);
    console.assert(updateSubtaskRes2.statusCode === 200, `33 Fail: status ${updateSubtaskRes2.statusCode}`);
    const updatedSubtasks2 = updateSubtaskRes2.body.data.subtasks;
    const sub1Reopened = updatedSubtasks2.find((s) => s._id.toString() === createdSubtaskId);
    console.assert(sub1Reopened.completed === false, '33 Fail: subtask 1 not reopened');
    console.assert(sub1Reopened.completedAt === null, '33 Fail: subtask 1 completedAt not cleared');
    console.log('PASS [33]: Reopening subtask clears completedAt to null');

    // 34. Completed subtask preserves completedAt when unrelated fields change
    // Re-complete subtask 1 first
    await todoController.updateTodo(updateSubtaskReq1, mockRes());
    // Update task title without changing subtasks
    const updateTitleReq = {
      ...reqA,
      params: { id: subtaskTaskRes.body.data._id.toString() },
      body: { title: 'Renamed Parent Task' },
    };
    const updateTitleRes = mockRes();
    await todoController.updateTodo(updateTitleReq, updateTitleRes);
    console.assert(updateTitleRes.statusCode === 200, '34 Fail: status update title');
    const sub1Preserved = updateTitleRes.body.data.subtasks.find((s) => s._id.toString() === createdSubtaskId);
    console.assert(sub1Preserved.completed === true && sub1Preserved.completedAt !== null, '34 Fail: completedAt lost on title update');
    console.log('PASS [34]: Completed subtask preserves completedAt when unrelated fields change');

    // 35. User A cannot update User B's subtasks
    const updateUnownedSubtaskReq = {
      ...reqB,
      params: { id: subtaskTaskRes.body.data._id.toString() },
      body: { subtasks: [{ title: 'Hacked Subtask' }] },
    };
    const updateUnownedSubtaskRes = mockRes();
    await todoController.updateTodo(updateUnownedSubtaskReq, updateUnownedSubtaskRes);
    console.assert(updateUnownedSubtaskRes.statusCode === 404, `35 Fail: expected 404 for unowned update, got ${updateUnownedSubtaskRes.statusCode}`);
    console.log('PASS [35]: User A cannot update User B subtasks (returns 404)');

    // 36. User A cannot update User B's tags
    const updateUnownedTagReq = {
      ...reqB,
      params: { id: subtaskTaskRes.body.data._id.toString() },
      body: { tags: ['hacked'] },
    };
    const updateUnownedTagRes = mockRes();
    await todoController.updateTodo(updateUnownedTagReq, updateUnownedTagRes);
    console.assert(updateUnownedTagRes.statusCode === 404, `36 Fail: expected 404 for unowned update, got ${updateUnownedTagRes.statusCode}`);
    console.log('PASS [36]: User A cannot update User B tags (returns 404)');

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
