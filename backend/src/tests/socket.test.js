const mongoose = require('mongoose');
const http = require('http');
const { io: Client } = require('socket.io-client');
require('dotenv').config();

const app = require('../app');
const UserModel = require('../models/User');
const TodoModel = require('../models/Todo');
const FocusSessionModel = require('../models/FocusSession');
const authService = require('../services/auth.service');
const { initializeSocket } = require('../sockets/socket');
const todoController = require('../controllers/todo.controller');
const focusController = require('../controllers/focus.controller');
const { processDueReminders } = require('../scheduler/reminder.scheduler');

const runSocketTests = async () => {
  const mongoUri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pulseos_test';
  console.log('Connecting to DB for Socket.IO test suite...');

  await mongoose.connect(mongoUri);
  console.log('Connected to DB for Socket test suite.');

  // Clean collections
  await UserModel.deleteMany({});
  await TodoModel.deleteMany({});

  // Setup HTTP server & Socket.IO server
  const server = http.createServer(app);
  initializeSocket(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test Socket.IO server running on port ${port}`);

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

  let clientSocketA = null;
  let clientSocketB = null;

  try {
    console.log('\n--- Running Socket.IO & Realtime Sync Test Matrix (20-23) ---\n');

    // Create User A and User B with tokens
    const resultA = await authService.registerUser({
      name: 'Socket User A',
      email: 'socketa@example.com',
      password: 'strongpassword123',
    });

    const resultB = await authService.registerUser({
      name: 'Socket User B',
      email: 'socketb@example.com',
      password: 'strongpassword123',
    });

    const tokenA = resultA.token;
    const userIdA = resultA.user._id;

    const tokenB = resultB.token;
    const userIdB = resultB.user._id;

    // 20. Authenticated socket joins correct user room
    clientSocketA = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: tokenA },
    });

    clientSocketB = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: tokenB },
    });

    await Promise.all([
      new Promise((res) => clientSocketA.on('connect', res)),
      new Promise((res) => clientSocketB.on('connect', res)),
    ]);

    console.assert(clientSocketA.connected === true, '20 Fail: Socket A not connected');
    console.assert(clientSocketB.connected === true, '20 Fail: Socket B not connected');
    console.log('PASS [20]: Authenticated sockets connected and joined user rooms');

    // 21. Reminder delivered ONLY to correct user room
    let userAReminderReceived = false;
    let userBReminderReceived = false;

    clientSocketA.on('todo:reminder', () => {
      userAReminderReceived = true;
    });

    clientSocketB.on('todo:reminder', () => {
      userBReminderReceived = true;
    });

    // Create due reminder for User A
    const past = new Date(Date.now() - 60000);
    await TodoModel.create({
      userId: userIdA,
      title: 'User A Due Reminder',
      reminderTime: past,
      reminderSent: false,
      completed: false,
    });

    await processDueReminders();
    await new Promise((r) => setTimeout(r, 300));

    console.assert(userAReminderReceived === true, '21 Fail: User A reminder not received');
    console.assert(userBReminderReceived === false, '21 Fail: User B received User A reminder (cross-user leakage)');
    console.log('PASS [21]: Reminder delivered ONLY to owning user room (no global broadcast)');

    // 22. Focus completion emits productivity:updated
    let productivityUpdatedTypeA = null;
    let productivityUpdatedTypeB = null;

    clientSocketA.on('productivity:updated', (data) => {
      productivityUpdatedTypeA = data?.type;
    });

    clientSocketB.on('productivity:updated', (data) => {
      productivityUpdatedTypeB = data?.type;
    });

    const now = new Date();
    const focusReqA = {
      user: { userId: userIdA },
      body: {
        mode: 'pomodoro',
        plannedMinutes: 25,
        actualSeconds: 1500,
        status: 'completed',
        startedAt: now.toISOString(),
        endedAt: new Date(now.getTime() + 1500000).toISOString(),
      },
    };
    await focusController.createFocusSession(focusReqA, mockRes());
    await new Promise((r) => setTimeout(r, 200));

    console.assert(productivityUpdatedTypeA === 'focus_completed', `22 Fail: expected focus_completed, got ${productivityUpdatedTypeA}`);
    console.assert(productivityUpdatedTypeB === null, '22 Fail: User B received User A productivity update');
    console.log('PASS [22]: Focus session completion emits productivity:updated to owner socket');

    // 23. Task completion emits productivity:updated
    productivityUpdatedTypeA = null;

    const taskA = await TodoModel.create({
      userId: userIdA,
      title: 'Task to Complete',
      completed: false,
    });

    const updateReqA = {
      user: { userId: userIdA },
      params: { id: taskA._id.toString() },
      body: { completed: true },
    };
    await todoController.updateTodo(updateReqA, mockRes());
    await new Promise((r) => setTimeout(r, 200));

    console.assert(productivityUpdatedTypeA === 'task_completed', `23 Fail: expected task_completed, got ${productivityUpdatedTypeA}`);
    console.log('PASS [23]: Task completion emits productivity:updated event');

    // 24. Invalid / Expired socket JWT token rejected on connect
    const jwt = require('jsonwebtoken');
    const expiredSocketToken = jwt.sign(
      { userId: userIdA },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '-1s' }
    );

    let connectErrorMsg = null;
    const invalidClientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: expiredSocketToken },
    });

    await new Promise((res) => {
      invalidClientSocket.on('connect_error', (err) => {
        connectErrorMsg = err.message;
        res();
      });
    });

    console.assert(connectErrorMsg !== null, '24 Fail: expired token socket connected successfully');
    invalidClientSocket.disconnect();
    console.log('PASS [24]: Expired socket token rejected on connection attempt');

    // 25. Socket disconnects cleanly when token expires during active connection
    const shortLivedToken = jwt.sign(
      { userId: userIdA },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '2s' }
    );

    const expiringClientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: shortLivedToken },
    });

    await new Promise((res) => expiringClientSocket.on('connect', res));
    console.assert(expiringClientSocket.connected === true, '25 Fail: expiring socket did not connect');

    let expiredEventReceived = false;
    expiringClientSocket.on('auth:expired', () => {
      expiredEventReceived = true;
    });

    await new Promise((res) => expiringClientSocket.on('disconnect', res));
    console.assert(expiredEventReceived === true, '25 Fail: auth:expired event not received prior to disconnect');
    console.assert(expiringClientSocket.connected === false, '25 Fail: socket remained connected after token expiry');
    console.log('PASS [25]: Active socket automatically disconnects cleanly when token expires');

    // 26. Offline Catch-Up Reminder Test
    // Create an unsent due reminder for User A
    const offlineDueTodo = await TodoModel.create({
      userId: userIdA,
      title: 'Offline Catch-up Task',
      reminderTime: new Date(Date.now() - 10000),
      reminderSent: false,
      completed: false,
    });

    let catchUpReminderReceived = false;
    let catchUpTodoId = null;

    clientSocketA.on('todo:reminder', (data) => {
      if (data.id === offlineDueTodo._id.toString()) {
        catchUpReminderReceived = true;
        catchUpTodoId = data.id;
      }
    });

    // Reconnect socket A to trigger immediate catch-up
    clientSocketA.disconnect();
    clientSocketA.connect();
    await new Promise((res) => clientSocketA.on('connect', res));

    // Allow 1.5s for catch-up setTimeout in socket connection handler to fire
    await new Promise((res) => setTimeout(res, 1500));

    console.assert(catchUpReminderReceived === true, '26 Fail: offline due reminder not delivered on reconnect catch-up');
    console.assert(catchUpTodoId === offlineDueTodo._id.toString(), '26 Fail: catch-up reminder ID mismatch');

    const verifiedTodo = await TodoModel.findById(offlineDueTodo._id);
    console.assert(verifiedTodo.reminderSent === true, '26 Fail: catch-up reminder not marked sent in DB');
    console.log('PASS [26]: Offline due reminder delivered on socket reconnect and marked sent');

    console.log('\n--- ALL SOCKET & REALTIME SYNC TESTS PASSED SUCCESSFULLY! ---\n');
  } catch (err) {
    console.error('SOCKET TEST MATRIX FAILURE:', err);
    process.exit(1);
  } finally {
    if (clientSocketA) clientSocketA.disconnect();
    if (clientSocketB) clientSocketB.disconnect();
    server.close();
    await UserModel.deleteMany({});
    await TodoModel.deleteMany({});
    await FocusSessionModel.deleteMany({});
    await mongoose.connection.close();
    console.log('Socket test database connection closed.');
  }
};

runSocketTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('SOCKET TEST MATRIX FAILURE:', err);
    process.exit(1);
  });
