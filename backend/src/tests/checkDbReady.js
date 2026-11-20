const net = require('net');
const { getTestMongoUri, parseMongoUri, sanitizeMongoUri } = require('./testDbGuard');

/**
 * Validates local test MongoDB readiness before integration tests execute.
 * Ensures:
 * 1. An explicit MONGO_TEST_URL is provided and strictly validated.
 * 2. Remote, Atlas, and production databases are strictly rejected.
 * 3. Local TCP socket endpoint is reachable without performing any database writes.
 */
async function checkDatabaseReadiness() {
  console.log('--- CHECKING LOCAL TEST DATABASE READINESS ---');

  // 1. Retrieve and strictly validate test database URI via testDbGuard
  let testUri;
  try {
    testUri = getTestMongoUri();
  } catch (err) {
    console.error('\n[DATABASE READINESS ERROR]');
    console.error(err.message);
    process.exit(1);
  }

  const parsed = parseMongoUri(testUri);
  const sanitized = sanitizeMongoUri(testUri);

  // 2. Check TCP connectivity to all specified hosts in URI
  for (const hostEntry of parsed.hosts) {
    const host = hostEntry.decoded || hostEntry.raw || '127.0.0.1';
    const port = hostEntry.port || 27017;

    console.log(`Probing local MongoDB connectivity at ${host}:${port} (${sanitized})...`);

    const isReachable = await new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(port, host);
    });

    if (!isReachable) {
      console.error('\n================================================================');
      console.error('DATABASE READINESS FAILURE: Local test MongoDB is NOT REACHABLE!');
      console.error('================================================================');
      console.error(`Endpoint: ${host}:${port}`);
      console.error(`Target DB: ${parsed.dbName}`);
      console.error('Integration tests require an active, isolated local MongoDB instance.');
      console.error('\nTo start a local test database, you can run:');
      console.error('  docker run -d --name pulseos-test-db -p 27017:27017 mongo:7');
      console.error('  or start your local MongoDB service (mongod).');
      console.error('\nNever point MONGO_TEST_URL to a production, remote, or Atlas cluster.');
      console.error('================================================================\n');
      process.exit(1);
    }
  }

  console.log(`[DATABASE READINESS SUCCESS] Local test MongoDB is reachable and validated (${sanitized}).\n`);
  process.exit(0);
}

if (require.main === module) {
  checkDatabaseReadiness().catch((err) => {
    console.error('Unexpected readiness check error:', err);
    process.exit(1);
  });
}

module.exports = { checkDatabaseReadiness };
