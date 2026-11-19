const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const TodoModel = require('../models/Todo');
const { createTodo, updateTodo } = require('../controllers/todo.controller');

// Helper to construct mock Express req/res
const createMockReqRes = ({ body = {}, params = {}, user = { userId: '507f1f77bcf86cd799439011' } } = {}) => {
  const req = {
    body,
    params,
    user,
  };
  let statusCode = 200;
  let jsonResponse = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(payload) {
      jsonResponse = payload;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getBody() {
      return jsonResponse;
    },
  };

  return { req, res };
};

const validObjectId = new mongoose.Types.ObjectId().toString();

test('1. PATCH with only dueDateFormatVersion: 2 cannot upgrade an existing legacy record', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Existing Legacy Task',
    dueDate: new Date('2026-11-19T18:30:00.000Z'),
    dueDateFormatVersion: null,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;

  let capturedUpdates = null;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async (query, updates) => {
    capturedUpdates = updates;
    return { ...existingDoc, ...updates };
  };

  try {
    const { req, res } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDateFormatVersion: 2 },
    });

    await updateTodo(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.ok(capturedUpdates, 'findOneAndUpdate was called');
    assert.equal(
      capturedUpdates.dueDateFormatVersion,
      undefined,
      'Standalone dueDateFormatVersion in req.body must be ignored and not present in updates'
    );
    assert.equal(capturedUpdates.dueDate, undefined, 'dueDate must be untouched in updates');
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('2. PATCH with version 999 or -1 cannot persist unsupported values', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Existing Task',
    dueDate: new Date('2026-11-20T00:00:00.000Z'),
    dueDateFormatVersion: 2,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;

  let capturedUpdates = null;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async (query, updates) => {
    capturedUpdates = updates;
    return { ...existingDoc, ...updates };
  };

  try {
    const { req, res } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDateFormatVersion: 999 },
    });

    await updateTodo(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.equal(
      capturedUpdates.dueDateFormatVersion,
      undefined,
      'Unsupported version 999 must be ignored by server controller'
    );
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('3. PATCH with an impossible dueDate returns HTTP 400', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Existing Task',
    dueDate: null,
    dueDateFormatVersion: null,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;
  let updateCalled = false;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async () => {
    updateCalled = true;
  };

  try {
    // 3a. Impossible date-only: 2026-02-31
    const { req: req1, res: res1 } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDate: '2026-02-31' },
    });
    await updateTodo(req1, res1);
    assert.equal(res1.getStatusCode(), 400);
    assert.match(res1.getBody().message, /Invalid dueDate/i);

    // 3b. Impossible ISO timestamp: 2026-02-31T00:00:00.000Z (must not roll over to March 3!)
    const { req: req2, res: res2 } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDate: '2026-02-31T00:00:00.000Z' },
    });
    await updateTodo(req2, res2);
    assert.equal(res2.getStatusCode(), 400);
    assert.match(res2.getBody().message, /Invalid dueDate/i);

    // 3c. Impossible month: 2026-99-99
    const { req: req3, res: res3 } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDate: '2026-99-99' },
    });
    await updateTodo(req3, res3);
    assert.equal(res3.getStatusCode(), 400);
    assert.match(res3.getBody().message, /Invalid dueDate/i);

    assert.equal(updateCalled, false, 'Database update must never be called for invalid dates');
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('4. PATCH with a valid date updates dueDate and server-derived provenance together', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Existing Task',
    dueDate: new Date('2026-11-19T18:30:00.000Z'),
    dueDateFormatVersion: null,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;

  let capturedUpdates = null;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async (query, updates) => {
    capturedUpdates = updates;
    return { ...existingDoc, ...updates };
  };

  try {
    // Deliberate update to canonical calendar date (date-only)
    const { req, res } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDate: '2026-11-25' },
    });

    await updateTodo(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.ok(capturedUpdates.dueDate instanceof Date);
    assert.equal(capturedUpdates.dueDate.toISOString(), '2026-11-25T00:00:00.000Z');
    assert.equal(capturedUpdates.dueDateFormatVersion, 2, 'Canonical date assigns provenance version 2');
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('5. PATCH with only a title preserves dueDate and provenance', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Original Title',
    dueDate: new Date('2026-11-19T18:30:00.000Z'),
    dueDateFormatVersion: null,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;

  let capturedUpdates = null;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async (query, updates) => {
    capturedUpdates = updates;
    return { ...existingDoc, ...updates };
  };

  try {
    const { req, res } = createMockReqRes({
      params: { id: validObjectId },
      body: { title: 'Updated Title Only' },
    });

    await updateTodo(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.equal(capturedUpdates.title, 'Updated Title Only');
    assert.equal(capturedUpdates.dueDate, undefined, 'dueDate omitted from updates to preserve stored value');
    assert.equal(
      capturedUpdates.dueDateFormatVersion,
      undefined,
      'dueDateFormatVersion omitted from updates to preserve stored value'
    );
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('6. Clearing dueDate clears provenance', async () => {
  const existingDoc = {
    _id: validObjectId,
    userId: '507f1f77bcf86cd799439011',
    title: 'Task with Date',
    dueDate: new Date('2026-11-20T00:00:00.000Z'),
    dueDateFormatVersion: 2,
  };

  const origFindOne = TodoModel.findOne;
  const origFindOneAndUpdate = TodoModel.findOneAndUpdate;

  let capturedUpdates = null;
  TodoModel.findOne = async () => existingDoc;
  TodoModel.findOneAndUpdate = async (query, updates) => {
    capturedUpdates = updates;
    return { ...existingDoc, ...updates };
  };

  try {
    const { req, res } = createMockReqRes({
      params: { id: validObjectId },
      body: { dueDate: null },
    });

    await updateTodo(req, res);

    assert.equal(res.getStatusCode(), 200);
    assert.equal(capturedUpdates.dueDate, null);
    assert.equal(capturedUpdates.dueDateFormatVersion, null);
  } finally {
    TodoModel.findOne = origFindOne;
    TodoModel.findOneAndUpdate = origFindOneAndUpdate;
  }
});

test('7. POST with an impossible date is rejected', async () => {
  const origCreate = TodoModel.create;
  let createCalled = false;
  TodoModel.create = async () => {
    createCalled = true;
  };

  try {
    // 7a. Impossible Feb 31 date-only
    const { req: req1, res: res1 } = createMockReqRes({
      body: { title: 'Impossible Date Task', dueDate: '2026-02-31' },
    });
    await createTodo(req1, res1);
    assert.equal(res1.getStatusCode(), 400);

    // 7b. Impossible Feb 31 ISO timestamp
    const { req: req2, res: res2 } = createMockReqRes({
      body: { title: 'Impossible ISO Task', dueDate: '2026-02-31T00:00:00.000Z' },
    });
    await createTodo(req2, res2);
    assert.equal(res2.getStatusCode(), 400);

    assert.equal(createCalled, false, 'TodoModel.create must not be called for invalid dates');
  } finally {
    TodoModel.create = origCreate;
  }
});

test('8. POST with a valid date creates the expected provenance', async () => {
  const origCreate = TodoModel.create;
  let capturedDoc = null;
  TodoModel.create = async (doc) => {
    capturedDoc = doc;
    return { _id: validObjectId, ...doc };
  };

  try {
    // Canonical UTC midnight creation
    const { req, res } = createMockReqRes({
      body: { title: 'Canonical New Task', dueDate: '2026-11-20T00:00:00.000Z' },
    });

    await createTodo(req, res);

    assert.equal(res.getStatusCode(), 201);
    assert.ok(capturedDoc);
    assert.equal(capturedDoc.dueDateFormatVersion, 2, 'Canonical creation assigns version 2');

    // Legacy offset timestamp: client attempting to pass dueDateFormatVersion: 2 is ignored
    const { req: req2, res: res2 } = createMockReqRes({
      body: {
        title: 'Legacy Offset Task',
        dueDate: '2026-11-19T18:30:00.000Z',
        dueDateFormatVersion: 2,
      },
    });

    await createTodo(req2, res2);

    assert.equal(res2.getStatusCode(), 201);
    assert.equal(
      capturedDoc.dueDateFormatVersion,
      null,
      'Non-midnight timestamp must derive provenance null even if client submits version 2'
    );
  } finally {
    TodoModel.create = origCreate;
  }
});
