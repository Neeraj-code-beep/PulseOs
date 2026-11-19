const {
  validateTestUri,
  getTestMongoUri,
  sanitizeMongoUri,
  extractDatabaseName,
  createTestTracker,
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
