const { spawnSync } = require('child_process');
const assert = require('assert');

console.log('--- RUNNING ASSERTION FAILURE REGRESSION TEST SUITE ---');

// 1. Verify that native assert(false) causes non-zero exit code (code 1)
const assertChild = spawnSync(process.execPath, [
  '-e',
  "const assert = require('assert'); assert(false, 'Deliberately failing assertion');",
], { encoding: 'utf8' });

assert.strictEqual(assertChild.status, 1, 'Native assert failure must cause process exit code 1');
assert(
  assertChild.stderr.includes('AssertionError') || assertChild.stderr.includes('ERR_ASSERTION'),
  'Native assert failure must output AssertionError to stderr'
);
assert(
  assertChild.stderr.includes('Deliberately failing assertion'),
  'Native assert failure must output the assertion failure message'
);
console.log('PASS [1]: Native assert failure causes non-zero process exit (exitCode 1)');

// 2. Verify that console.assert(false) historically exited with 0 (documenting the bug)
const consoleAssertChild = spawnSync(process.execPath, [
  '-e',
  "console.assert(false, 'Failed console assert'); process.exit(0);",
], { encoding: 'utf8' });

assert.strictEqual(consoleAssertChild.status, 0, 'Documenting historical false positive: console.assert does not throw');
console.log('PASS [2]: Verified console.assert bug is documented and superseded by throwing assert');

console.log('--- ALL ASSERTION REGRESSION TESTS PASSED ---\n');
