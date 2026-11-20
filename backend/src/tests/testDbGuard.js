const mongoose = require('mongoose');

/**
 * PulseOS Database Test Guard
 * 
 * Enforces strict isolation for database tests:
 * 1. Requires explicit MONGO_TEST_URL (never falls back to MONGO_URL).
 * 2. Rejects any MongoDB Atlas SRV connection string (mongodb+srv://).
 * 3. Rejects any host or URI containing production cluster signatures (e.g., .mongodb.net, cluster0).
 * 4. Rejects any database name that is not explicitly a test database (e.g. must end with _test or -test, or equal pulseos_test).
 * 5. Sanitizes connection strings to prevent credential exposure in logs or errors.
 * 6. Provides scoped record tracking so tests only delete their own generated documents instead of collection-wide deletion.
 */

// Pattern for allowed test database names
const ALLOWED_TEST_DB_PATTERN = /(^test_|_test$|-test$|^pulseos_test$)/i;

// Forbidden production or system database names
const FORBIDDEN_DB_NAMES = new Set([
  'pulseos',
  'production',
  'prod',
  'admin',
  'local',
  'config',
  'main',
  'master',
]);

// Allowed local and container test database hostnames and loopback addresses
const ALLOWED_TEST_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  '0:0:0:0:0:0:0:1',
  '[0:0:0:0:0:0:0:1]',
  'test-db',
  'mongo',
  'mongodb',
  'test-mongo',
  'local-mongo',
  'host.docker.internal',
]);

// Remote cloud cluster signatures
const REMOTE_CLOUD_SIGNATURES = [
  '.mongodb.net',
  'cluster0',
  'cluster1',
  'cluster2',
  'documentdb',
  'cosmosdb',
];

/**
 * Sanitizes a MongoDB connection URI to mask credentials.
 * @param {string} uri
 * @returns {string} Sanitized URI
 */
function sanitizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return '[empty-uri]';
  return uri.replace(/\/\/[^@]+@/, '//***:***@');
}

/**
 * Extracts the database name from a standard MongoDB URI.
 * @param {string} uri
 * @returns {string|null} Database name
 */
function extractDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return null;
  try {
    const withoutQuery = uri.split('?')[0];
    const match = withoutQuery.match(/\/([^/?#]+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Parses and strictly validates a MongoDB URI.
 * @param {string} uri
 * @returns {{ protocol: string, hosts: Array<{ raw: string, decoded: string, port: number|null }>, dbName: string, options: string }}
 */
function parseMongoUri(uri) {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new Error(
      'DATABASE SAFETY FAILURE: Missing test database URI. Set MONGO_TEST_URL to an isolated test database.'
    );
  }

  const cleanUri = uri.trim();

  // 1. Refuse Atlas SRV connection strings
  if (cleanUri.toLowerCase().startsWith('mongodb+srv:')) {
    throw new Error(
      'DATABASE SAFETY VIOLATION: Refusing to run tests against MongoDB Atlas SRV URI (mongodb+srv://). ' +
      'Tests must use a local or isolated test database.'
    );
  }

  // 2. Must be a valid mongodb protocol
  if (!cleanUri.toLowerCase().startsWith('mongodb://')) {
    throw new Error(
      'DATABASE SAFETY VIOLATION: Test database URI must begin with "mongodb://".'
    );
  }

  const rest = cleanUri.slice('mongodb://'.length);
  if (!rest) {
    throw new Error('DATABASE SAFETY VIOLATION: Malformed connection string: Missing host and database.');
  }

  // Ambiguous query parameters check: cannot contain multiple '?'
  const questionParts = rest.split('?');
  if (questionParts.length > 2) {
    throw new Error('DATABASE SAFETY VIOLATION: Ambiguous connection string: Multiple query specifiers ("?") detected.');
  }

  const [pathAndAuthority, options = ''] = questionParts;

  // Split authority and path
  const slashIndex = pathAndAuthority.indexOf('/');
  let authority = '';
  let path = '';

  if (slashIndex === -1) {
    authority = pathAndAuthority;
    path = '';
  } else {
    authority = pathAndAuthority.slice(0, slashIndex);
    path = pathAndAuthority.slice(slashIndex + 1);
  }

  if (!authority.trim()) {
    throw new Error('DATABASE SAFETY VIOLATION: Malformed connection string: Missing host in MongoDB URI.');
  }

  // Strip credentials if present: find last '@' before hosts
  const atIndex = authority.lastIndexOf('@');
  const hostsPart = atIndex !== -1 ? authority.slice(atIndex + 1) : authority;

  if (!hostsPart.trim()) {
    throw new Error('DATABASE SAFETY VIOLATION: Malformed connection string: Missing host after credentials in MongoDB URI.');
  }

  // Parse comma-separated host entries
  const rawEntries = hostsPart.split(',');
  const parsedHosts = [];

  for (const rawEntry of rawEntries) {
    const entry = rawEntry.trim();
    if (!entry) {
      throw new Error('DATABASE SAFETY VIOLATION: Malformed connection string: Empty host entry found.');
    }

    let rawHost = '';
    let portStr = null;

    if (entry.startsWith('[')) {
      // IPv6 literal
      const closeBracket = entry.indexOf(']');
      if (closeBracket === -1) {
        throw new Error(`DATABASE SAFETY VIOLATION: Malformed IPv6 host in MongoDB URI: "${entry}".`);
      }
      rawHost = entry.slice(0, closeBracket + 1);
      const after = entry.slice(closeBracket + 1);
      if (after.startsWith(':')) {
        portStr = after.slice(1);
      } else if (after.length > 0) {
        throw new Error(`DATABASE SAFETY VIOLATION: Malformed host entry in MongoDB URI: "${entry}".`);
      }
    } else {
      const parts = entry.split(':');
      if (parts.length === 1) {
        rawHost = parts[0];
      } else if (parts.length === 2) {
        rawHost = parts[0];
        portStr = parts[1];
      } else {
        throw new Error(`DATABASE SAFETY VIOLATION: Ambiguous host entry in MongoDB URI: "${entry}".`);
      }
    }

    if (!rawHost) {
      throw new Error('DATABASE SAFETY VIOLATION: Malformed connection string: Hostname cannot be empty.');
    }

    let port = null;
    if (portStr !== null) {
      port = Number(portStr);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`DATABASE SAFETY VIOLATION: Invalid port "${portStr}" in MongoDB URI.`);
      }
    }

    // Decode hostname to defeat percent-encoding bypass attempts
    let decodedHost;
    try {
      decodedHost = decodeURIComponent(rawHost).toLowerCase();
    } catch {
      throw new Error(`DATABASE SAFETY VIOLATION: Malformed URL-encoded hostname in MongoDB URI: "${rawHost}".`);
    }

    // Check remote cloud signatures in raw and decoded host
    for (const sig of REMOTE_CLOUD_SIGNATURES) {
      if (decodedHost.includes(sig) || rawHost.toLowerCase().includes(sig)) {
        throw new Error(
          `DATABASE SAFETY VIOLATION: Refusing to run tests against remote cluster (${sig}). ` +
          'Tests must use an isolated local MongoDB instance.'
        );
      }
    }

    // Whitelist check: allow only explicitly approved local/container hostnames and loopback addresses
    const normalizedHost = decodedHost.startsWith('[') && decodedHost.endsWith(']')
      ? decodedHost.slice(1, -1)
      : decodedHost;

    if (!ALLOWED_TEST_HOSTNAMES.has(decodedHost) && !ALLOWED_TEST_HOSTNAMES.has(normalizedHost)) {
      throw new Error(
        `DATABASE SAFETY VIOLATION: Host "${decodedHost}" is not an approved test database host. ` +
        'Automated tests may only connect to approved local or container hosts (e.g. localhost, 127.0.0.1, test-db).'
      );
    }

    parsedHosts.push({ raw: rawHost, decoded: decodedHost, port });
  }

  // Validate path/database name
  if (path.includes('/')) {
    throw new Error('DATABASE SAFETY VIOLATION: Malformed database path in MongoDB URI: multiple slashes.');
  }

  const rawDbName = path.trim();
  if (!rawDbName) {
    throw new Error(
      'DATABASE SAFETY VIOLATION: No database name specified in test connection URI. ' +
      'Specify an explicit test database (e.g., mongodb://127.0.0.1:27017/pulseos_test).'
    );
  }

  let dbName;
  try {
    dbName = decodeURIComponent(rawDbName);
  } catch {
    throw new Error(`DATABASE SAFETY VIOLATION: Malformed URL-encoded database name: "${rawDbName}".`);
  }

  const normalizedDb = dbName.toLowerCase();

  // Check forbidden names
  if (FORBIDDEN_DB_NAMES.has(normalizedDb)) {
    throw new Error(
      `DATABASE SAFETY VIOLATION: Refusing to run tests against production database name "${dbName}". ` +
      'Database name must end with "_test" or "-test" (e.g. pulseos_test).'
    );
  }

  // Check required test naming pattern
  if (!ALLOWED_TEST_DB_PATTERN.test(normalizedDb)) {
    throw new Error(
      `DATABASE SAFETY VIOLATION: Database name "${dbName}" is not designated for testing. ` +
      'Must match pattern /(_test$|-test$|^pulseos_test$)/i.'
    );
  }

  return {
    protocol: 'mongodb:',
    hosts: parsedHosts,
    dbName,
    options,
  };
}

/**
 * Validates that a URI is demonstrably safe for automated testing.
 * Throws an Error if any safety check fails.
 * @param {string} uri
 * @returns {{ safe: boolean, dbName: string, hosts: Array<{ raw: string, decoded: string, port: number|null }> }}
 */
function validateTestUri(uri) {
  const parsed = parseMongoUri(uri);
  return { safe: true, dbName: parsed.dbName, hosts: parsed.hosts };
}

/**
 * Retrieves and validates MONGO_TEST_URL from environment variables.
 * Never falls back to MONGO_URL.
 * @returns {string} Safe test database URI
 */
function getTestMongoUri() {
  const testUri = process.env.MONGO_TEST_URL || process.env.MONGO_TEST_URI;

  if (!testUri) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: Automated database tests require an explicit MONGO_TEST_URL.\n' +
      'Silently falling back to MONGO_URL is prohibited to prevent accidental production data loss.\n' +
      'Example: export MONGO_TEST_URL=mongodb://127.0.0.1:27017/pulseos_test'
    );
  }

  // Strictly validate before returning
  validateTestUri(testUri);
  return testUri.trim();
}

// Internal connection tracking for ownership and safe lifecycle management
let isGuardOwnedConnection = false;
let guardConnectedDbName = null;
let guardConnectedUri = null;

/**
 * Connects mongoose to the validated test database.
 * Hardened to prevent reusing unverified connections, cross-database pollution,
 * or leaving corrupted connection state.
 * @param {Object} [options] Mongoose connect options
 * @returns {Promise<mongoose.Connection>}
 */
async function connectTestDb(options = {}) {
  const uri = getTestMongoUri();
  const parsed = parseMongoUri(uri);
  const expectedDbName = parsed.dbName;
  const sanitized = sanitizeMongoUri(uri);

  // 1. Inspect existing Mongoose connection state before attempting any action
  const currentReadyState = mongoose.connection.readyState;
  if (currentReadyState !== 0) {
    // If an existing connection is active or transitioning:
    if (!isGuardOwnedConnection) {
      throw new Error(
        `DATABASE SAFETY VIOLATION: Existing active Mongoose connection (readyState=${currentReadyState}, db="${mongoose.connection.name}") was not established by testDbGuard. ` +
        'Refusing to reuse or modify unverified connection to prevent cross-database pollution.'
      );
    }

    // Verify the existing guard connection is connected to the exact expected database
    const activeDbName = mongoose.connection.name;
    if (activeDbName !== expectedDbName || !ALLOWED_TEST_DB_PATTERN.test(activeDbName) || FORBIDDEN_DB_NAMES.has(activeDbName.toLowerCase())) {
      throw new Error(
        `DATABASE SAFETY VIOLATION: Active test connection is connected to "${activeDbName}", but test expected "${expectedDbName}". ` +
        'Connection target mismatch.'
      );
    }

    console.log(`[testDbGuard] Reusing verified test database connection: "${activeDbName}".`);
    return mongoose.connection;
  }

  // 2. Connect to the validated test database
  console.log(`[testDbGuard] Connecting to verified test database: ${sanitized}`);
  try {
    await mongoose.connect(uri, options);
  } catch (connectError) {
    // Ensure failed connection attempts do not leave misleading connection state
    isGuardOwnedConnection = false;
    guardConnectedDbName = null;
    guardConnectedUri = null;
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.connection.close(true);
      } catch (_) {
        // Ignore secondary error while aborting failed connection
      }
    }
    throw connectError;
  }

  // 3. Post-connection sanity verification on active mongoose connection
  const activeDbName = mongoose.connection.name;
  if (!activeDbName || activeDbName !== expectedDbName || !ALLOWED_TEST_DB_PATTERN.test(activeDbName) || FORBIDDEN_DB_NAMES.has(activeDbName.toLowerCase())) {
    isGuardOwnedConnection = false;
    guardConnectedDbName = null;
    guardConnectedUri = null;
    await mongoose.connection.close(true);
    throw new Error(
      `DATABASE SAFETY VIOLATION: Active connection connected to non-test or mismatched database "${activeDbName}" (expected "${expectedDbName}"). Connection aborted immediately.`
    );
  }

  isGuardOwnedConnection = true;
  guardConnectedDbName = activeDbName;
  guardConnectedUri = sanitized;

  console.log(`[testDbGuard] Successfully connected and verified test database "${activeDbName}".`);
  return mongoose.connection;
}

/**
 * Cleanly disconnects mongoose from test database.
 * Does not disconnect connections that this guard does not own.
 * Safe when no connection was established.
 * @param {boolean} [force=false]
 * @returns {Promise<void>}
 */
async function disconnectTestDb(force = false) {
  // If no connection was established or already closed, safe no-op
  if (!mongoose.connection || mongoose.connection.readyState === 0) {
    isGuardOwnedConnection = false;
    guardConnectedDbName = null;
    guardConnectedUri = null;
    return;
  }

  // Do not blindly disconnect connections that this test guard does not own
  if (!isGuardOwnedConnection) {
    console.warn('[testDbGuard] Refusing to disconnect active connection not owned by testDbGuard.');
    return;
  }

  try {
    await mongoose.connection.close(force);
    console.log('[testDbGuard] Test database connection closed cleanly.');
  } finally {
    isGuardOwnedConnection = false;
    guardConnectedDbName = null;
    guardConnectedUri = null;
  }
}

/**
 * Creates an isolated tracker for scoped cleanup.
 * Instead of running collection-wide deleteMany({}), tests track the specific IDs
 * of documents created during the test run and only delete those records.
 */
function createTestTracker() {
  const userIds = new Set();
  const todoIds = new Set();
  const sessionIds = new Set();
  const userEmails = new Set();

  return {
    trackUser(user) {
      if (!user) return;
      const id = user._id || user.id || user;
      if (id) userIds.add(id.toString());
      if (user.email) userEmails.add(user.email.toLowerCase().trim());
    },
    trackTodo(todo) {
      if (!todo) return;
      const id = todo._id || todo.id || todo;
      if (id) todoIds.add(id.toString());
    },
    trackSession(session) {
      if (!session) return;
      const id = session._id || session.id || session;
      if (id) sessionIds.add(id.toString());
    },
    async cleanup({ UserModel, TodoModel, FocusSessionModel } = {}) {
      const uIds = Array.from(userIds);
      const tIds = Array.from(todoIds);
      const sIds = Array.from(sessionIds);
      const emails = Array.from(userEmails);

      try {
        if (FocusSessionModel && (sIds.length > 0 || uIds.length > 0)) {
          await FocusSessionModel.deleteMany({
            $or: [
              sIds.length > 0 ? { _id: { $in: sIds } } : null,
              uIds.length > 0 ? { userId: { $in: uIds } } : null,
            ].filter(Boolean),
          });
        }

        if (TodoModel && (tIds.length > 0 || uIds.length > 0)) {
          await TodoModel.deleteMany({
            $or: [
              tIds.length > 0 ? { _id: { $in: tIds } } : null,
              uIds.length > 0 ? { userId: { $in: uIds } } : null,
            ].filter(Boolean),
          });
        }

        if (UserModel && (uIds.length > 0 || emails.length > 0)) {
          await UserModel.deleteMany({
            $or: [
              uIds.length > 0 ? { _id: { $in: uIds } } : null,
              emails.length > 0 ? { email: { $in: emails } } : null,
            ].filter(Boolean),
          });
        }
      } catch (err) {
        console.error('[testDbGuard] Scoped cleanup error:', err.message);
      } finally {
        userIds.clear();
        todoIds.clear();
        sessionIds.clear();
        userEmails.clear();
      }
    },
  };
}

function getGuardConnectionState() {
  return {
    isGuardOwnedConnection,
    guardConnectedDbName,
    guardConnectedUri,
    readyState: mongoose.connection ? mongoose.connection.readyState : 0,
    activeDbName: mongoose.connection ? mongoose.connection.name : null,
  };
}

function _setGuardConnectionStateForTesting(owned, dbName, uri) {
  isGuardOwnedConnection = owned;
  guardConnectedDbName = dbName;
  guardConnectedUri = uri;
}

module.exports = {
  validateTestUri,
  parseMongoUri,
  getTestMongoUri,
  connectTestDb,
  disconnectTestDb,
  createTestTracker,
  sanitizeMongoUri,
  extractDatabaseName,
  getGuardConnectionState,
  _setGuardConnectionStateForTesting,
  ALLOWED_TEST_DB_PATTERN,
  FORBIDDEN_DB_NAMES,
  ALLOWED_TEST_HOSTNAMES,
};
