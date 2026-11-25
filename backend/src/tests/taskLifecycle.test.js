const assert = require('assert');
const http = require('http');
const mongoose = require('mongoose');
const { io: Client } = require('socket.io-client');

const app = require('../app');
const UserModel = require('../models/User');
const TodoModel = require('../models/Todo');
const authService = require('../services/auth.service');
const todoController = require('../controllers/todo.controller');
const { initializeSocket } = require('../sockets/socket');
const { processDueReminders } = require('../scheduler/reminder.scheduler');
const { connectTestDb, disconnectTestDb, createTestTracker } = require('./testDbGuard');

// Ensure a safe JWT secret exists for isolated testing if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_pulseos_1234567890';
}

const runTaskLifecycleTests = async () => {
  console.log('--- RUNNING COMPLETE TASK LIFECYCLE INTEGRATION TEST SUITE ---');
  await connectTestDb();
  const tracker = createTestTracker();

  let server = null;
  let clientSocketA = null;
  let clientSocketB = null;

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

  let passed = 0;
  let total = 0;

  function testAssert(condition, message) {
    total++;
    if (condition) {
      console.log(`PASS [${total}]: ${message}`);
      passed++;
    } else {
      console.error(`FAIL [${total}]: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // Setup Users A and B
    // -------------------------------------------------------------
    const emailA = `lifecycle-a-${Date.now()}@example.com`;
    const emailB = `lifecycle-b-${Date.now()}@example.com`;
    tracker.trackUser({ email: emailA });
    tracker.trackUser({ email: emailB });

    const userARes = await authService.registerUser({
      name: 'Lifecycle User A',
      email: emailA,
      password: 'password123',
    });
    tracker.trackUser(userARes.user);

    const userBRes = await authService.registerUser({
      name: 'Lifecycle User B',
      email: emailB,
      password: 'password123',
    });
    tracker.trackUser(userBRes.user);

    const userAId = userARes.user._id.toString();
    const userBId = userBRes.user._id.toString();

    const reqA = (body = {}, params = {}, query = {}) => ({
      user: { userId: userAId },
      body,
      params,
      query,
    });

    const reqB = (body = {}, params = {}, query = {}) => ({
      user: { userId: userBId },
      body,
      params,
      query,
    });

    // -------------------------------------------------------------
    // 1. Task Creation (POST /api/todos)
    // -------------------------------------------------------------
    console.log('\n--- Phase 1: Task Creation ---');
    const createReq = reqA({
      title: 'Complete Math Assignment',
      dueDate: '2099-12-01',
      priority: 'high',
      estimatedMinutes: 60,
      tags: ['Math', 'Homework', 'MATH'], // Test case normalization & dedup
      subtasks: [
        { title: 'Read Chapter 4' },
        { title: 'Solve Exercises 1-10' },
      ],
      reminderTime: new Date(Date.now() + 86400000).toISOString(),
    });
    const createRes = mockRes();
    await todoController.createTodo(createReq, createRes);

    testAssert(createRes.statusCode === 201, 'Task created with HTTP 201');
    testAssert(createRes.body.success === true, 'Task creation response indicates success');
    testAssert(createRes.body.data && createRes.body.data._id, 'Task creation returns document with _id');
    const taskId = createRes.body.data._id.toString();
    tracker.trackTodo(taskId);

    // Verify database persistence
    const savedTask = await TodoModel.findById(taskId);
    testAssert(savedTask !== null, 'Task document successfully persisted in MongoDB');
    testAssert(savedTask.userId.toString() === userAId, 'Task correctly bound to User A userId');
    testAssert(savedTask.title === 'Complete Math Assignment', 'Task title persisted correctly');
    testAssert(savedTask.completed === false, 'Default completed is false');
    testAssert(savedTask.completedAt === null, 'Default completedAt is null');
    testAssert(savedTask.focusTimeSpent === 0, 'Default focusTimeSpent is 0');
    testAssert(savedTask.reminderSent === false, 'Default reminderSent is false');
    testAssert(savedTask.dueDateFormatVersion === 2, 'Canonical date-only input assigns dueDateFormatVersion: 2');
    testAssert(savedTask.tags.length === 2 && savedTask.tags.includes('math') && savedTask.tags.includes('homework'), 'Tags normalized and deduplicated');
    testAssert(savedTask.subtasks.length === 2, 'Subtasks persisted with expected count');
    testAssert(savedTask.subtasks[0].completed === false && savedTask.subtasks[0].completedAt === null, 'Subtask defaults completed: false and completedAt: null');

    // -------------------------------------------------------------
    // 2. Task Retrieval & User Isolation (GET /api/todos)
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Task Retrieval & User Isolation ---');
    const getResA = mockRes();
    await todoController.getTodos(reqA(), getResA);
    testAssert(getResA.statusCode === 200, 'User A fetches tasks with HTTP 200');
    testAssert(Array.isArray(getResA.body.data), 'User A receives tasks array');
    const foundInA = getResA.body.data.find((t) => t._id.toString() === taskId);
    testAssert(foundInA !== undefined, 'User A receives the created task');

    const getResB = mockRes();
    await todoController.getTodos(reqB(), getResB);
    testAssert(getResB.statusCode === 200, 'User B fetches tasks with HTTP 200');
    const foundInB = getResB.body.data.find((t) => t._id.toString() === taskId);
    testAssert(foundInB === undefined, 'User B task list strictly excludes User A task');

    // -------------------------------------------------------------
    // 3. Task Update & Field Preservation (PATCH /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Task Update & Field Preservation ---');
    const updateRes = mockRes();
    await todoController.updateTodo(
      reqA({ title: 'Complete Advanced Math Assignment', priority: 'medium', estimatedMinutes: 90 }, { id: taskId }),
      updateRes
    );
    testAssert(updateRes.statusCode === 200, 'User A updates task with HTTP 200');
    testAssert(updateRes.body.data.title === 'Complete Advanced Math Assignment', 'Updated title returned in response');
    testAssert(updateRes.body.data.priority === 'medium', 'Updated priority returned in response');
    testAssert(updateRes.body.data.estimatedMinutes === 90, 'Updated estimatedMinutes returned in response');

    // Verify unmentioned fields are preserved in MongoDB
    const postUpdateTask = await TodoModel.findById(taskId);
    testAssert(postUpdateTask.title === 'Complete Advanced Math Assignment', 'Title updated in database');
    testAssert(postUpdateTask.dueDateFormatVersion === 2, 'dueDateFormatVersion preserved on title/priority update');
    testAssert(postUpdateTask.dueDate !== null, 'dueDate preserved when not included in update');
    testAssert(postUpdateTask.tags.length === 2, 'Tags preserved when not included in update');
    testAssert(postUpdateTask.subtasks.length === 2, 'Subtasks preserved when not included in update');

    // -------------------------------------------------------------
    // 4. Reschedule & Provenance Derivation (PATCH /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Reschedule & Provenance Derivation ---');
    // A. Canonical UTC midnight ISO string
    const rescheduleRes = mockRes();
    await todoController.updateTodo(
      reqA({ dueDate: '2099-12-25T00:00:00.000Z' }, { id: taskId }),
      rescheduleRes
    );
    testAssert(rescheduleRes.statusCode === 200, 'Reschedule with UTC midnight timestamp succeeds');
    testAssert(rescheduleRes.body.data.dueDateFormatVersion === 2, 'Server correctly derives dueDateFormatVersion: 2');

    // B. Client cannot forge dueDateFormatVersion
    const forgeRes = mockRes();
    await todoController.updateTodo(
      reqA({ dueDate: '2099-12-25T14:30:00.000Z', dueDateFormatVersion: 2 }, { id: taskId }),
      forgeRes
    );
    testAssert(forgeRes.statusCode === 200, 'Non-midnight update processed');
    testAssert(forgeRes.body.data.dueDateFormatVersion === null, 'Server overrides client dueDateFormatVersion to null for non-midnight date');

    // C. Invalid calendar date rejected
    const invalidDateRes = mockRes();
    await todoController.updateTodo(
      reqA({ dueDate: '2099-02-31' }, { id: taskId }),
      invalidDateRes
    );
    testAssert(invalidDateRes.statusCode === 400, 'Impossible calendar date (Feb 31) rejected with HTTP 400');

    // D. Clearing due date clears provenance
    const clearDateRes = mockRes();
    await todoController.updateTodo(
      reqA({ dueDate: null }, { id: taskId }),
      clearDateRes
    );
    testAssert(clearDateRes.statusCode === 200, 'Clearing due date with null returns HTTP 200');
    testAssert(clearDateRes.body.data.dueDate === null, 'dueDate set to null in response');
    testAssert(clearDateRes.body.data.dueDateFormatVersion === null, 'dueDateFormatVersion cleared to null');

    // -------------------------------------------------------------
    // 5. Task Completion & Timestamp Preservation (PATCH /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 5: Task Completion & Idempotency ---');
    const completeRes = mockRes();
    await todoController.updateTodo(
      reqA({ completed: true }, { id: taskId }),
      completeRes
    );
    testAssert(completeRes.statusCode === 200, 'Mark task complete returns HTTP 200');
    testAssert(completeRes.body.data.completed === true, 'Task completed flag is true');
    testAssert(completeRes.body.data.completedAt !== null, 'completedAt timestamp is recorded');
    const firstCompletedAt = new Date(completeRes.body.data.completedAt).getTime();

    // Idempotent repeated completion preserves original completedAt
    await new Promise((r) => setTimeout(r, 20));
    const repeatCompleteRes = mockRes();
    await todoController.updateTodo(
      reqA({ completed: true }, { id: taskId }),
      repeatCompleteRes
    );
    testAssert(repeatCompleteRes.statusCode === 200, 'Repeated complete returns HTTP 200');
    const secondCompletedAt = new Date(repeatCompleteRes.body.data.completedAt).getTime();
    testAssert(firstCompletedAt === secondCompletedAt, 'Repeated complete call preserves original completedAt timestamp');

    // -------------------------------------------------------------
    // 6. Task Reopening (PATCH /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 6: Task Reopening ---');
    const reopenRes = mockRes();
    await todoController.updateTodo(
      reqA({ completed: false }, { id: taskId }),
      reopenRes
    );
    testAssert(reopenRes.statusCode === 200, 'Reopen task returns HTTP 200');
    testAssert(reopenRes.body.data.completed === false, 'Task completed flag is false');
    testAssert(reopenRes.body.data.completedAt === null, 'completedAt is cleared to null upon reopening');

    const reopenedInDb = await TodoModel.findById(taskId);
    testAssert(reopenedInDb.completed === false && reopenedInDb.completedAt === null, 'Reopened state persisted in database');

    // -------------------------------------------------------------
    // 7. Subtasks State Transitions (PATCH /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 7: Subtask State Transitions ---');
    const subtask0Id = postUpdateTask.subtasks[0]._id.toString();
    const subtask1Id = postUpdateTask.subtasks[1]._id.toString();

    // Complete subtask 0
    const subUpdateRes = mockRes();
    await todoController.updateTodo(
      reqA({
        subtasks: [
          { _id: subtask0Id, title: 'Read Chapter 4', completed: true },
          { _id: subtask1Id, title: 'Solve Exercises 1-10', completed: false },
        ],
      }, { id: taskId }),
      subUpdateRes
    );
    testAssert(subUpdateRes.statusCode === 200, 'Subtask completion returns HTTP 200');
    const updatedSub0 = subUpdateRes.body.data.subtasks.find((s) => s._id.toString() === subtask0Id);
    testAssert(updatedSub0.completed === true && updatedSub0.completedAt !== null, 'Completed subtask receives completedAt timestamp');

    // Reopen subtask 0
    const subReopenRes = mockRes();
    await todoController.updateTodo(
      reqA({
        subtasks: [
          { _id: subtask0Id, title: 'Read Chapter 4', completed: false },
          { _id: subtask1Id, title: 'Solve Exercises 1-10', completed: false },
        ],
      }, { id: taskId }),
      subReopenRes
    );
    testAssert(subReopenRes.statusCode === 200, 'Subtask reopen returns HTTP 200');
    const reopenedSub0 = subReopenRes.body.data.subtasks.find((s) => s._id.toString() === subtask0Id);
    testAssert(reopenedSub0.completed === false && reopenedSub0.completedAt === null, 'Reopened subtask completedAt cleared to null');

    // -------------------------------------------------------------
    // 8. Validation & Error Responses
    // -------------------------------------------------------------
    console.log('\n--- Phase 8: Validation & Error Handling ---');
    // A. Empty title
    const emptyTitleRes = mockRes();
    await todoController.createTodo(reqA({ title: '   ' }), emptyTitleRes);
    testAssert(emptyTitleRes.statusCode === 400, 'Empty title on create returns HTTP 400');

    // B. Invalid priority
    const badPriorityRes = mockRes();
    await todoController.createTodo(reqA({ title: 'Valid Title', priority: 'urgent' }), badPriorityRes);
    testAssert(badPriorityRes.statusCode === 400, 'Invalid priority value returns HTTP 400');

    // C. Invalid estimatedMinutes
    const badMinutesRes = mockRes();
    await todoController.createTodo(reqA({ title: 'Valid Title', estimatedMinutes: -5 }), badMinutesRes);
    testAssert(badMinutesRes.statusCode === 400, 'Negative estimatedMinutes returns HTTP 400');

    // D. Invalid Todo ID format
    const badIdRes = mockRes();
    await todoController.updateTodo(reqA({ title: 'New' }, { id: 'invalid-id-format' }), badIdRes);
    testAssert(badIdRes.statusCode === 400, 'Malformed ObjectId on update returns HTTP 400');

    // E. Nonexistent Todo ID
    const fakeId = new mongoose.Types.ObjectId().toString();
    const notFoundRes = mockRes();
    await todoController.updateTodo(reqA({ title: 'New' }, { id: fakeId }), notFoundRes);
    testAssert(notFoundRes.statusCode === 404, 'Nonexistent Todo ID returns HTTP 404');

    // F. Cross-user modification blocked
    const crossUpdateRes = mockRes();
    await todoController.updateTodo(reqB({ title: 'Hacked Title' }, { id: taskId }), crossUpdateRes);
    testAssert(crossUpdateRes.statusCode === 404, 'User B cannot update User A task (HTTP 404)');

    const crossDeleteRes = mockRes();
    await todoController.deleteTodo(reqB({}, { id: taskId }), crossDeleteRes);
    testAssert(crossDeleteRes.statusCode === 404, 'User B cannot delete User A task (HTTP 404)');

    // G. Unauthenticated request
    const noAuthRes = mockRes();
    await todoController.createTodo({ body: { title: 'Test' } }, noAuthRes);
    testAssert(noAuthRes.statusCode === 401, 'Request without authenticated user returns HTTP 401');

    // -------------------------------------------------------------
    // 9. Multi-User Independence & Identical Titles
    // -------------------------------------------------------------
    console.log('\n--- Phase 9: Multi-User Independence ---');
    const taskTitle = 'Shared Course Reading';

    const userATaskRes = mockRes();
    await todoController.createTodo(reqA({ title: taskTitle }), userATaskRes);
    const userATaskId = userATaskRes.body.data._id.toString();
    tracker.trackTodo(userATaskId);

    const userBTaskRes = mockRes();
    await todoController.createTodo(reqB({ title: taskTitle }), userBTaskRes);
    const userBTaskId = userBTaskRes.body.data._id.toString();
    tracker.trackTodo(userBTaskId);

    testAssert(userATaskId !== userBTaskId, 'Users A and B can create distinct tasks with identical titles');

    // Complete User A's task
    await todoController.updateTodo(reqA({ completed: true }, { id: userATaskId }), mockRes());

    // Verify User B's task is still active and incomplete
    const userBTaskDb = await TodoModel.findById(userBTaskId);
    testAssert(userBTaskDb.completed === false, 'User B task remains incomplete when User A completes identical task');

    // Delete User A's task
    await todoController.deleteTodo(reqA({}, { id: userATaskId }), mockRes());

    // Verify User B's task still exists
    const userBTaskDbAfter = await TodoModel.findById(userBTaskId);
    testAssert(userBTaskDbAfter !== null, 'User B task is not affected by User A task deletion');

    // -------------------------------------------------------------
    // 10. Real-Time Socket Events & Reminder Integration
    // -------------------------------------------------------------
    console.log('\n--- Phase 10: Real-Time Sockets & Reminders ---');
    server = http.createServer(app);
    initializeSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;

    const tokenA = userARes.token;
    const tokenB = userBRes.token;

    clientSocketA = Client(`http://127.0.0.1:${port}`, {
      auth: { token: tokenA },
      transports: ['websocket'],
    });
    clientSocketB = Client(`http://127.0.0.1:${port}`, {
      auth: { token: tokenB },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((res) => clientSocketA.on('connect', res)),
      new Promise((res) => clientSocketB.on('connect', res)),
    ]);
    testAssert(clientSocketA.connected && clientSocketB.connected, 'Socket clients A and B successfully authenticated and connected');

    // Track real-time events
    let socketAProductivityEvents = [];
    let socketBProductivityEvents = [];
    let socketAReminders = [];
    let socketBReminders = [];

    clientSocketA.on('productivity:updated', (data) => socketAProductivityEvents.push(data));
    clientSocketB.on('productivity:updated', (data) => socketBProductivityEvents.push(data));
    clientSocketA.on('todo:reminder', (data) => socketAReminders.push(data));
    clientSocketB.on('todo:reminder', (data) => socketBReminders.push(data));

    // A. Task update emits productivity:updated ONLY to user A's room
    await todoController.updateTodo(reqA({ priority: 'low' }, { id: taskId }), mockRes());
    await new Promise((r) => setTimeout(r, 100));

    testAssert(socketAProductivityEvents.some((e) => e.type === 'task_updated'), 'User A socket received productivity:updated event');
    testAssert(socketBProductivityEvents.length === 0, 'User B socket received NO productivity events from User A activity');

    // B. Scheduled Due Reminder delivery to user room
    const pastReminder = new Date(Date.now() - 5000);
    const reminderTodo = await TodoModel.create({
      userId: userAId,
      title: 'Urgent Exam Reminder',
      reminderTime: pastReminder,
      reminderSent: false,
      completed: false,
    });
    tracker.trackTodo(reminderTodo._id.toString());

    await processDueReminders(userAId);
    await new Promise((r) => setTimeout(r, 100));

    testAssert(socketAReminders.some((r) => r.id === reminderTodo._id.toString()), 'User A socket received due reminder payload');
    testAssert(socketBReminders.length === 0, 'User B socket received NO reminders intended for User A');

    // Verify reminder marked sent in DB
    const updatedReminderTodo = await TodoModel.findById(reminderTodo._id);
    testAssert(updatedReminderTodo.reminderSent === true, 'Reminder marked reminderSent: true in database');

    // Calling processDueReminders again does not emit duplicate
    const prevReminderCount = socketAReminders.length;
    await processDueReminders(userAId);
    await new Promise((r) => setTimeout(r, 100));
    testAssert(socketAReminders.length === prevReminderCount, 'processDueReminders prevents duplicate emissions (atomic claim)');

    // -------------------------------------------------------------
    // 11. Task Deletion (DELETE /api/todos/:id)
    // -------------------------------------------------------------
    console.log('\n--- Phase 11: Task Deletion ---');
    const deleteRes = mockRes();
    await todoController.deleteTodo(reqA({}, { id: taskId }), deleteRes);

    testAssert(deleteRes.statusCode === 200, 'User A deletes task with HTTP 200');
    testAssert(deleteRes.body.success === true, 'Delete response indicates success');
    testAssert(deleteRes.body.data.id === taskId, 'Delete response returns deleted task ID');

    // Verify document permanently deleted from DB
    const deletedInDb = await TodoModel.findById(taskId);
    testAssert(deletedInDb === null, 'Task document no longer exists in MongoDB');

    // Deleting again returns 404
    const repeatDeleteRes = mockRes();
    await todoController.deleteTodo(reqA({}, { id: taskId }), repeatDeleteRes);
    testAssert(repeatDeleteRes.statusCode === 404, 'Repeated delete on already deleted task returns HTTP 404');

    // Verify task_deleted socket event was emitted to User A
    await new Promise((r) => setTimeout(r, 100));
    testAssert(socketAProductivityEvents.some((e) => e.type === 'task_deleted'), 'User A socket received task_deleted event');

    console.log(`\n======================================================`);
    console.log(`TASK LIFECYCLE TEST RESULT: ${passed}/${total} assertions passed.`);
    console.log(`======================================================\n`);
  } finally {
    if (clientSocketA) clientSocketA.disconnect();
    if (clientSocketB) clientSocketB.disconnect();
    if (server) server.close();
    await tracker.cleanup({ UserModel, TodoModel });
    await disconnectTestDb();
    console.log('Task lifecycle test database connection and resources closed cleanly.');
  }
};

runTaskLifecycleTests().catch((err) => {
  console.error('TASK LIFECYCLE SUITE FAILURE:', err);
  process.exit(1);
});
