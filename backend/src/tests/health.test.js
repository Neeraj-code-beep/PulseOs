const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const { healthCheck } = require('../routes/HealthRoutes');
const { createShutdownHandler } = require('../../server');

async function runHealthAndShutdownTests() {
  console.log('--- RUNNING HEALTH ENDPOINT & GRACEFUL SHUTDOWN TEST MATRIX ---');

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

  function request(server, reqPath) {
    return new Promise((resolve, reject) => {
      const port = server.address().port;
      http
        .get(`http://127.0.0.1:${port}${reqPath}`, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch {
              json = data;
            }
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: json,
              raw: data,
            });
          });
        })
        .on('error', reject);
    });
  }

  // --- PART 1: HEALTH ENDPOINT TESTS (ISOLATED HTTP SERVER) ---
  console.log('\n--- Section 1: Health & Readiness Endpoint ---');
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));

  try {
    // 1. Database unavailable (readyState === 0) returns HTTP 503
    const res503 = await request(testServer, '/api/health');
    assert(
      res503.status === 503,
      `GET /api/health returns HTTP 503 when database is disconnected (got ${res503.status})`
    );

    // 2. Standard JSON response contract on 503
    assert(
      res503.body &&
      res503.body.success === false &&
      res503.body.message.includes('database is not ready') &&
      res503.body.data &&
      res503.body.data.status === 'degraded' &&
      res503.body.data.checks.process === 'alive' &&
      res503.body.data.checks.database === 'disconnected',
      'GET /api/health returns standard contract with process:alive and database:disconnected'
    );

    // 3. /health top-level alias returns identical behavior
    const resAlias = await request(testServer, '/health');
    assert(
      resAlias.status === 503 && resAlias.body.data.status === 'degraded',
      'GET /health top-level alias functions identically for infrastructure probes'
    );

    // 4. No sensitive information leaked in health response
    const sensitiveTerms = ['mongodb://', 'password', 'secret', 'MONGO_URL', 'stack', 'node_modules'];
    const leaksSensitive = sensitiveTerms.some((term) => res503.raw.includes(term));
    assert(
      !leaksSensitive,
      'Health check response contains no credentials, DB URLs, secrets, or internal paths'
    );

    // 5. Security headers applied by Helmet to health endpoint
    assert(
      res503.headers['x-content-type-options'] === 'nosniff' &&
      res503.headers['x-frame-options'] === 'SAMEORIGIN' &&
      res503.headers['cross-origin-resource-policy'] === 'cross-origin' &&
      res503.headers['x-powered-by'] === undefined,
      'Health endpoint inherits full Helmet security headers and strips X-Powered-By'
    );

    // 6. Healthy database state returns HTTP 200
    // Test the healthCheck handler with a mocked readyState of 1 (connected)
    const originalReadyState = mongoose.connection.readyState;
    Object.defineProperty(mongoose.connection, 'readyState', {
      value: 1,
      configurable: true,
      writable: true,
    });

    try {
      const mockRes = {
        statusCode: null,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          return this;
        },
      };

      healthCheck({}, mockRes);

      assert(
        mockRes.statusCode === 200,
        `GET /api/health returns HTTP 200 when database readyState is 1 (connected)`
      );

      assert(
        mockRes.body &&
        mockRes.body.success === true &&
        mockRes.body.data.status === 'healthy' &&
        mockRes.body.data.checks.database === 'connected' &&
        mockRes.body.data.checks.process === 'alive' &&
        typeof mockRes.body.data.uptime === 'number' &&
        typeof mockRes.body.data.timestamp === 'string',
        'Healthy response conforms to { success: true, message, data: { status: "healthy", checks } }'
      );
    } finally {
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        configurable: true,
        writable: true,
      });
    }
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }

  // --- PART 2: GRACEFUL SHUTDOWN HANDLER COORDINATION ---
  console.log('\n--- Section 2: Graceful Shutdown Coordination ---');

  // 7. Verify shutdown sequence calls components in correct order on SIGTERM
  const callOrder = [];
  let exitCodeReceived = null;

  const mockServer = {
    listening: true,
    close(cb) {
      callOrder.push('httpServerClosed');
      cb();
    },
  };

  const sigtermHandler = createShutdownHandler({
    server: mockServer,
    stopSchedulerFn: () => callOrder.push('schedulerStopped'),
    closeSocketFn: async () => callOrder.push('socketClosed'),
    disconnectDbFn: async () => callOrder.push('dbClosed'),
    exitFn: (code) => {
      exitCodeReceived = code;
    },
    timeoutMs: 1000,
  });

  await sigtermHandler('SIGTERM');

  assert(
    callOrder.join('->') === 'schedulerStopped->httpServerClosed->socketClosed->dbClosed',
    'Shutdown coordinates cleanup in correct sequence: scheduler -> HTTP server -> Socket.IO -> MongoDB'
  );

  // 8. Normal shutdown exits with code 0
  assert(
    exitCodeReceived === 0,
    `Graceful shutdown exits cleanly with status code 0 (got ${exitCodeReceived})`
  );

  // 9. Shutdown handler is idempotent (subsequent signals ignored)
  await sigtermHandler('SIGINT');
  assert(
    callOrder.length === 4,
    'Duplicate shutdown signal (SIGINT after SIGTERM) is ignored without re-executing cleanup'
  );

  // 10. Verify SIGINT also initiates graceful shutdown on a fresh handler
  const sigintCalls = [];
  let sigintExitCode = null;
  const sigintHandler = createShutdownHandler({
    server: {
      listening: true,
      close(cb) {
        sigintCalls.push('httpClosed');
        cb();
      },
    },
    stopSchedulerFn: () => sigintCalls.push('schedulerStopped'),
    closeSocketFn: async () => sigintCalls.push('socketClosed'),
    disconnectDbFn: async () => sigintCalls.push('dbClosed'),
    exitFn: (code) => {
      sigintExitCode = code;
    },
    timeoutMs: 1000,
  });

  await sigintHandler('SIGINT');
  assert(
    sigintExitCode === 0 && sigintCalls.length === 4,
    'SIGINT signal independently initiates full clean shutdown sequence'
  );

  // 11. Cleanup errors do not prevent remaining cleanup steps from running
  const errorStepCalls = [];
  let errorExitCode = null;
  const resilientHandler = createShutdownHandler({
    server: {
      listening: true,
      close(cb) {
        errorStepCalls.push('httpAttempted');
        cb(new Error('Simulated HTTP close failure'));
      },
    },
    stopSchedulerFn: () => {
      errorStepCalls.push('schedulerAttempted');
      throw new Error('Scheduler stop failure');
    },
    closeSocketFn: async () => {
      errorStepCalls.push('socketAttempted');
      throw new Error('Socket close failure');
    },
    disconnectDbFn: async () => {
      errorStepCalls.push('dbAttempted');
    },
    exitFn: (code) => {
      errorExitCode = code;
    },
    timeoutMs: 1000,
  });

  await resilientHandler('SIGTERM');
  assert(
    errorStepCalls.length === 4 &&
    errorStepCalls.includes('dbAttempted') &&
    errorExitCode === 1,
    'Cleanup errors in earlier stages do not block remaining resources from attempting cleanup (exits code 1)'
  );

  // 12. Final forced-exit timeout is cleared on successful shutdown
  let timeoutExitCalled = false;
  const timeoutCheckHandler = createShutdownHandler({
    server: {
      listening: true,
      close(cb) {
        cb();
      },
    },
    stopSchedulerFn: () => {},
    closeSocketFn: async () => {},
    disconnectDbFn: async () => {},
    exitFn: (code) => {
      if (code === 1) {
        timeoutExitCalled = true;
      }
    },
    timeoutMs: 50,
  });

  await timeoutCheckHandler('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 80));

  assert(
    timeoutExitCalled === false,
    'Final forced-exit timeout is cleared on clean shutdown and does not trigger after completion'
  );

  console.log(`\nHEALTH & SHUTDOWN TEST RESULT: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('--- ALL HEALTH & GRACEFUL SHUTDOWN TESTS PASSED ---');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runHealthAndShutdownTests().catch((err) => {
  console.error('HEALTH & SHUTDOWN TEST SUITE FAILURE:', err);
  process.exit(1);
});
