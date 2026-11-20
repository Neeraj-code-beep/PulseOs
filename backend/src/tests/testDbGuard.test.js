const mongoose = require('mongoose');
const {
  validateTestUri,
  parseMongoUri,
  getTestMongoUri,
  connectTestDb,
  disconnectTestDb,
  sanitizeMongoUri,
  extractDatabaseName,
  createTestTracker,
  getGuardConnectionState,
  _setGuardConnectionStateForTesting,
} = require('./testDbGuard');

async function runGuardSafetyTests() {
  console.log('--- RUNNING DATABASE SAFETY & TEST ISOLATION GUARD TEST MATRIX ---');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`PASS [${total}]: ${message}`);
      passed++;
    } else {
      console.error(`FAIL [${total}]: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. Missing MONGO_TEST_URL throws immediate fatal configuration error
  const originalEnvTest = process.env.MONGO_TEST_URL;
  const originalEnvUri = process.env.MONGO_TEST_URI;
  const originalEnvProd = process.env.MONGO_URL;

  delete process.env.MONGO_TEST_URL;
  delete process.env.MONGO_TEST_URI;
  process.env.MONGO_URL = 'mongodb://127.0.0.1:27017/pulseos_production';

  try {
    let threw = false;
    try {
      getTestMongoUri();
    } catch (err) {
      threw = true;
      assert(
        err.message.includes('FATAL CONFIGURATION ERROR') &&
        err.message.includes('MONGO_TEST_URL'),
        'Missing MONGO_TEST_URL throws fatal error and does not silently fall back to MONGO_URL'
      );
    }
    assert(threw, 'getTestMongoUri threw when MONGO_TEST_URL was absent');
  } finally {
    if (originalEnvTest) process.env.MONGO_TEST_URL = originalEnvTest;
    if (originalEnvUri) process.env.MONGO_TEST_URI = originalEnvUri;
    if (originalEnvProd) process.env.MONGO_URL = originalEnvProd;
  }

  // 2. Atlas SRV URLs (mongodb+srv://) are strictly rejected
  try {
    let srvRejected = false;
    try {
      validateTestUri('mongodb+srv://user:pass@cluster0.qb8apde.mongodb.net/pulseos_test');
    } catch (err) {
      srvRejected = true;
      assert(
        err.message.includes('Refusing to run tests against MongoDB Atlas SRV URI'),
        'Atlas SRV URI (mongodb+srv://) is rejected immediately'
      );
    }
    assert(srvRejected, 'validateTestUri threw for mongodb+srv://');
  } catch (err) {
    assert(false, `Unexpected failure: ${err.message}`);
  }

  // 3. Remote Atlas host signatures (.mongodb.net, cluster0) rejected even with mongodb://
  try {
    let remoteHostRejected = false;
    try {
      validateTestUri('mongodb://user:pass@cluster0.qb8apde.mongodb.net:27017/pulseos_test');
    } catch (err) {
      remoteHostRejected = true;
      assert(
        err.message.includes('Refusing to run tests against remote cluster'),
        'Remote Atlas cluster host (.mongodb.net) is rejected even under mongodb:// protocol'
      );
    }
    assert(remoteHostRejected, 'validateTestUri threw for remote cluster host');
  } catch (err) {
    assert(false, `Unexpected failure: ${err.message}`);
  }

  // 4. Production database names ('pulseos', 'production', 'admin') are strictly rejected
  const forbidden = ['pulseos', 'production', 'prod', 'admin', 'main'];
  for (const db of forbidden) {
    let forbiddenRejected = false;
    try {
      validateTestUri(`mongodb://127.0.0.1:27017/${db}`);
    } catch (err) {
      forbiddenRejected = true;
      assert(
        err.message.includes('Refusing to run tests against production database name'),
        `Production database name "${db}" is explicitly rejected`
      );
    }
    assert(forbiddenRejected, `validateTestUri threw for forbidden db "${db}"`);
  }

  // 5. Database name without test suffix or designation is rejected
  try {
    let unapprovedRejected = false;
    try {
      validateTestUri('mongodb://127.0.0.1:27017/student_workload');
    } catch (err) {
      unapprovedRejected = true;
      assert(
        err.message.includes('is not designated for testing'),
        'Arbitrary non-test database name without _test suffix is rejected'
      );
    }
    assert(unapprovedRejected, 'validateTestUri threw for non-test db name');
  } catch (err) {
    assert(false, `Unexpected failure: ${err.message}`);
  }

  // 6. Valid local test database URIs are accepted
  const validTestUris = [
    'mongodb://127.0.0.1:27017/pulseos_test',
    'mongodb://localhost:27017/app_test',
    'mongodb://127.0.0.1:27017/test_pulseos',
    'mongodb://localhost:27017/pulseos-test?authSource=admin',
  ];
  for (const uri of validTestUris) {
    try {
      const result = validateTestUri(uri);
      assert(result.safe === true && Boolean(result.dbName), `Valid local test URI accepted: ${uri}`);
    } catch (err) {
      assert(false, `Valid URI was rejected unexpectedly (${uri}): ${err.message}`);
    }
  }

  // 7. Credentials in URIs are sanitized/redacted
  const sensitiveUri = 'mongodb://app_user:SuperSecretPassword123@127.0.0.1:27017/pulseos_test';
  const sanitized = sanitizeMongoUri(sensitiveUri);
  assert(
    !sanitized.includes('SuperSecretPassword123') &&
    sanitized.includes('//***:***@127.0.0.1:27017/pulseos_test'),
    'Sensitive credentials are fully redacted by sanitizeMongoUri'
  );

  // 8. extractDatabaseName accurately parses database names even with query parameters
  const db1 = extractDatabaseName('mongodb://127.0.0.1:27017/pulseos_test');
  const db2 = extractDatabaseName('mongodb://127.0.0.1:27017/pulseos_test?retryWrites=true&w=majority');
  assert(db1 === 'pulseos_test', 'extractDatabaseName extracts simple name');
  assert(db2 === 'pulseos_test', 'extractDatabaseName strips query parameters');

  // 9. Scoped Test Tracker cleans only tracked documents and avoids collection-wide deletion
  const deletedQueries = [];
  const mockTodoModel = {
    deleteMany: async (query) => {
      deletedQueries.push({ model: 'Todo', query });
    },
  };
  const mockUserModel = {
    deleteMany: async (query) => {
      deletedQueries.push({ model: 'User', query });
    },
  };

  const tracker = createTestTracker();
  tracker.trackUser({ _id: 'user_123', email: 'test1@example.com' });
  tracker.trackTodo({ _id: 'todo_456' });

  await tracker.cleanup({ UserModel: mockUserModel, TodoModel: mockTodoModel });

  assert(
    deletedQueries.length === 2,
    'Tracker executes exactly scoped queries for tracked models'
  );
  assert(
    deletedQueries.some((q) => q.model === 'Todo' && JSON.stringify(q.query).includes('todo_456')),
    'Tracker scopes Todo deletion to tracked task IDs'
  );
  assert(
    deletedQueries.some((q) => q.model === 'User' && JSON.stringify(q.query).includes('user_123')),
    'Tracker scopes User deletion to tracked user ID and email'
  );

  // 10. URL-encoded attempts to bypass cloud hostname checks are rejected
  const encodedCloudUris = [
    'mongodb://cluster0%2emongodb%2enet/pulseos_test',
    'mongodb://%63%6c%75%73%74%65%72%30%2e%71%62%38%61%70%64%65%2e%6d%6f%6e%67%6f%64%62%2e%6e%65%74/pulseos_test',
    'mongodb://user:pass@some%2emongodb%2enet:27017/pulseos_test',
    'mongodb://cluster0%2emongodb%2enet:27017/pulseos_test?authSource=admin',
  ];
  for (const uri of encodedCloudUris) {
    let encodedRejected = false;
    try {
      validateTestUri(uri);
    } catch (err) {
      encodedRejected = true;
      assert(
        err.message.includes('Refusing to run tests against remote cluster') ||
        err.message.includes('is not an approved test database host'),
        `URL-encoded cloud hostname rejected: ${uri}`
      );
    }
    assert(encodedRejected, `validateTestUri threw for URL-encoded URI: ${uri}`);
  }

  // 11. Arbitrary remote IP addresses and external hostnames are rejected
  const arbitraryRemoteUris = [
    'mongodb://54.210.12.34:27017/pulseos_test',
    'mongodb://192.168.1.100:27017/pulseos_test',
    'mongodb://10.0.0.5:27017/pulseos_test',
    'mongodb://my-production-server.com:27017/pulseos_test',
    'mongodb://remote-db.company.internal:27017/pulseos_test',
  ];
  for (const uri of arbitraryRemoteUris) {
    let remoteRejected = false;
    try {
      validateTestUri(uri);
    } catch (err) {
      remoteRejected = true;
      assert(
        err.message.includes('is not an approved test database host'),
        `Arbitrary remote host/IP rejected: ${uri}`
      );
    }
    assert(remoteRejected, `validateTestUri threw for arbitrary remote URI: ${uri}`);
  }

  // 12. Approved local and container test database hosts are accepted
  const approvedHostUris = [
    'mongodb://localhost:27017/pulseos_test',
    'mongodb://127.0.0.1:27017/pulseos_test',
    'mongodb://[::1]:27017/pulseos_test',
    'mongodb://test-db:27017/pulseos_test',
    'mongodb://mongo:27017/pulseos_test',
    'mongodb://mongodb:27017/pulseos_test',
    'mongodb://test-mongo:27017/pulseos_test',
    'mongodb://local-mongo:27017/pulseos_test',
    'mongodb://host.docker.internal:27017/pulseos_test',
  ];
  for (const uri of approvedHostUris) {
    try {
      const res = validateTestUri(uri);
      assert(res.safe === true, `Approved host accepted: ${uri}`);
    } catch (err) {
      assert(false, `Approved host was rejected unexpectedly (${uri}): ${err.message}`);
    }
  }

  // 13. Registration cleanup succeeds when controller throws after user creation
  const preTrackedQueries = [];
  const mockUserModelPreTrack = {
    deleteMany: async (query) => {
      preTrackedQueries.push({ model: 'User', query });
    },
  };

  const regTracker = createTestTracker();
  const candidateEmail = 'failed_reg@example.com';

  // Pre-track user email before simulated registration
  regTracker.trackUser({ email: candidateEmail });

  try {
    // Simulate user creation followed by a controller exception (e.g. JWT failure)
    throw new Error('Simulated controller crash after user creation');
  } catch (err) {
    // Error caught in caller/suite
  } finally {
    await regTracker.cleanup({ UserModel: mockUserModelPreTrack });
  }

  assert(
    preTrackedQueries.length === 1,
    'Pre-tracked registration cleanup executed deleteMany on UserModel'
  );
  assert(
    preTrackedQueries.some(
      (q) =>
        q.model === 'User' &&
        JSON.stringify(q.query).includes(candidateEmail)
    ),
    'Pre-tracked registration cleanup removed user by candidate email after controller throw'
  );

  // 14. Empty and whitespace URIs are strictly rejected
  const emptyInputs = ['', '   ', null, undefined];
  for (const input of emptyInputs) {
    let emptyRejected = false;
    try {
      validateTestUri(input);
    } catch (err) {
      emptyRejected = true;
      assert(
        err.message.includes('Missing test database URI'),
        `Empty URI input (${input}) rejected with missing test database URI error`
      );
    }
    assert(emptyRejected, `validateTestUri threw for empty input: "${input}"`);
  }

  // 15. Malformed protocols, invalid ports, multiple slashes, and ambiguous query strings are rejected
  const malformedInputs = [
    { uri: 'http://127.0.0.1:27017/pulseos_test', expectedError: 'must begin with "mongodb://"' },
    { uri: 'mongodb://', expectedError: 'Missing host and database' },
    { uri: 'mongodb://127.0.0.1:27017', expectedError: 'No database name specified' },
    { uri: 'mongodb://127.0.0.1:27017/', expectedError: 'No database name specified' },
    { uri: 'mongodb://127.0.0.1:27017/db/extra', expectedError: 'multiple slashes' },
    { uri: 'mongodb://127.0.0.1:99999/pulseos_test', expectedError: 'Invalid port' },
    { uri: 'mongodb://127.0.0.1:-5/pulseos_test', expectedError: 'Invalid port' },
    { uri: 'mongodb://127.0.0.1:27017/pulseos_test?q1=1?q2=2', expectedError: 'Multiple query specifiers' },
  ];
  for (const item of malformedInputs) {
    let threw = false;
    try {
      validateTestUri(item.uri);
    } catch (err) {
      threw = true;
      assert(
        err.message.includes(item.expectedError),
        `Malformed URI "${item.uri}" rejected with expected error: "${item.expectedError}"`
      );
    }
    assert(threw, `validateTestUri threw for malformed URI: "${item.uri}"`);
  }

  // 16. Safe disconnect when no connection was established
  try {
    _setGuardConnectionStateForTesting(false, null, null);
    await disconnectTestDb();
    assert(true, 'disconnectTestDb completes safely when no connection exists');
  } catch (err) {
    assert(false, `disconnectTestDb failed unexpectedly when disconnected: ${err.message}`);
  }

  // 17. Disconnect refuses to disconnect connections that testDbGuard does not own
  const originalConnection = mongoose.connection;
  try {
    // Mock an active connection not owned by guard
    const mockUnownedConn = { readyState: 1, name: 'foreign_db', close: async () => {} };
    Object.defineProperty(mongoose, 'connection', { value: mockUnownedConn, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);

    let closeCalled = false;
    mockUnownedConn.close = async () => { closeCalled = true; };

    await disconnectTestDb();
    assert(closeCalled === false, 'disconnectTestDb refuses to close connection not owned by testDbGuard');
  } finally {
    Object.defineProperty(mongoose, 'connection', { value: originalConnection, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);
  }

  // 18. Connecting when unowned active connection exists fails safely
  const originalEnvUrl = process.env.MONGO_TEST_URL;
  process.env.MONGO_TEST_URL = 'mongodb://127.0.0.1:27017/pulseos_test';
  try {
    const mockForeignConn = { readyState: 1, name: 'some_active_db' };
    Object.defineProperty(mongoose, 'connection', { value: mockForeignConn, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);

    let rejectedUnowned = false;
    try {
      await connectTestDb();
    } catch (err) {
      rejectedUnowned = true;
      assert(
        err.message.includes('Existing active Mongoose connection') &&
        err.message.includes('was not established by testDbGuard'),
        'Existing unowned active connection safely rejected to prevent cross-connection pollution'
      );
    }
    assert(rejectedUnowned, 'connectTestDb threw for unowned active connection');
  } finally {
    Object.defineProperty(mongoose, 'connection', { value: originalConnection, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);
    if (originalEnvUrl) process.env.MONGO_TEST_URL = originalEnvUrl;
  }

  // 19. Connecting when guard-owned connection points to mismatched database throws
  try {
    const mockMismatchedConn = { readyState: 1, name: 'other_test_db' };
    Object.defineProperty(mongoose, 'connection', { value: mockMismatchedConn, configurable: true });
    _setGuardConnectionStateForTesting(true, 'other_test_db', 'mongodb://127.0.0.1:27017/other_test_db');

    let rejectedMismatch = false;
    try {
      await connectTestDb();
    } catch (err) {
      rejectedMismatch = true;
      assert(
        err.message.includes('Connection target mismatch') &&
        err.message.includes('other_test_db'),
        'Guard-owned connection target mismatch is safely rejected'
      );
    }
    assert(rejectedMismatch, 'connectTestDb threw for target database mismatch');
  } finally {
    Object.defineProperty(mongoose, 'connection', { value: originalConnection, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);
    if (originalEnvUrl) process.env.MONGO_TEST_URL = originalEnvUrl;
  }

  // 20. Connecting when guard-owned connection points to identical database reuses connection
  try {
    const mockMatchingConn = { readyState: 1, name: 'pulseos_test' };
    Object.defineProperty(mongoose, 'connection', { value: mockMatchingConn, configurable: true });
    _setGuardConnectionStateForTesting(true, 'pulseos_test', 'mongodb://127.0.0.1:27017/pulseos_test');

    const reusedConn = await connectTestDb();
    assert(reusedConn === mockMatchingConn, 'connectTestDb cleanly reuses existing guard-owned connection to same test DB');
    const state = getGuardConnectionState();
    assert(state.isGuardOwnedConnection === true && state.guardConnectedDbName === 'pulseos_test', 'Guard connection state preserved on reuse');
  } finally {
    Object.defineProperty(mongoose, 'connection', { value: originalConnection, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);
    if (originalEnvUrl) process.env.MONGO_TEST_URL = originalEnvUrl;
  }

  // 21. Failed connection attempt cleanly resets state and does not leave false ownership
  const originalConnect = mongoose.connect;
  try {
    const mockFailingConn = { readyState: 0, name: null, close: async () => {} };
    Object.defineProperty(mongoose, 'connection', { value: mockFailingConn, configurable: true });
    mongoose.connect = async () => {
      throw new Error('Simulated network connection failure');
    };
    _setGuardConnectionStateForTesting(false, null, null);

    let connectFailed = false;
    try {
      await connectTestDb();
    } catch (err) {
      connectFailed = true;
      assert(err.message.includes('Simulated network connection failure'), 'Connect failure rethrows original error');
    }
    assert(connectFailed, 'connectTestDb threw for failed connection');
    const failureState = getGuardConnectionState();
    assert(failureState.isGuardOwnedConnection === false, 'Failed connection leaves isGuardOwnedConnection as false');
    assert(failureState.guardConnectedDbName === null, 'Failed connection leaves guardConnectedDbName as null');
  } finally {
    mongoose.connect = originalConnect;
    Object.defineProperty(mongoose, 'connection', { value: originalConnection, configurable: true });
    _setGuardConnectionStateForTesting(false, null, null);
    if (originalEnvUrl) process.env.MONGO_TEST_URL = originalEnvUrl;
  }

  // 22. Empty tracker cleanup performs no queries
  const emptyCleanQueries = [];
  const mockCleanModel = {
    deleteMany: async (query) => {
      emptyCleanQueries.push(query);
    },
  };
  const emptyTracker = createTestTracker();
  await emptyTracker.cleanup({ UserModel: mockCleanModel, TodoModel: mockCleanModel, FocusSessionModel: mockCleanModel });
  assert(emptyCleanQueries.length === 0, 'Empty tracker cleanup executes zero delete queries');

  // 23. Cleanup executes reliably and scoped after test assertion failure
  const failCleanQueries = [];
  const mockFailModel = {
    deleteMany: async (query) => {
      failCleanQueries.push(query);
    },
  };
  const failureTracker = createTestTracker();
  failureTracker.trackTodo({ _id: 'todo_fail_test_789' });

  let simulatedTestError = null;
  try {
    // Simulate test failure
    throw new Error('Deliberate assertion failure in test body');
  } catch (err) {
    simulatedTestError = err;
  } finally {
    await failureTracker.cleanup({ TodoModel: mockFailModel });
  }

  assert(simulatedTestError !== null, 'Simulated test failure was captured');
  assert(failCleanQueries.length === 1, 'Tracker cleanup executed despite simulated test failure');
  assert(
    JSON.stringify(failCleanQueries[0]).includes('todo_fail_test_789'),
    'Tracker cleanup scoped to tracked document ID after test failure'
  );

  console.log(`\nDATABASE SAFETY GUARD TEST RESULT: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('--- ALL TEST DATABASE SAFETY & ISOLATION TESTS PASSED ---\n');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runGuardSafetyTests().catch((err) => {
  console.error('TEST DB GUARD SUITE FAILURE:', err);
  process.exit(1);
});
