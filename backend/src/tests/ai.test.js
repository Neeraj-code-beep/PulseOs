const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { validateBreakdownInput, parseAndValidateOutput, buildPrompt } = require('../services/ai.service');

async function runAiTests() {
  console.log('--- RUNNING AI TASK BREAKDOWN TEST MATRIX ---');

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

  // TEST 1: Missing title throws 400
  try {
    validateBreakdownInput({ title: '' });
    assert(false, 'Missing title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Missing title throws 400 Bad Request');
  }

  // TEST 2: Non-string title throws 400
  try {
    validateBreakdownInput({ title: 12345 });
    assert(false, 'Non-string title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Non-string title throws 400 Bad Request');
  }

  // TEST 3: Oversized title (>500 chars) throws 400
  try {
    validateBreakdownInput({ title: 'A'.repeat(501) });
    assert(false, 'Oversized title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Oversized title (>500 chars) throws 400 Bad Request');
  }

  // TEST 4: Valid title and context validation
  try {
    const res = validateBreakdownInput({
      title: '  Prepare DSA assignment  ',
      context: { priority: 'high' },
    });
    assert(res.title === 'Prepare DSA assignment' && res.context.priority === 'high', 'Valid title trimmed and context accepted');
  } catch {
    assert(false, 'Valid input should pass validation');
  }

  // TEST 5: Prompt construction includes context
  const prompt = buildPrompt('Prepare DSA assignment', { priority: 'high', estimatedMinutes: 60 });
  assert(prompt.includes('Prepare DSA assignment') && prompt.includes('Priority: high'), 'Prompt includes task title and context');

  // TEST 6: Invalid JSON output parsing throws 502
  try {
    parseAndValidateOutput('invalid json string');
    assert(false, 'Invalid JSON should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Invalid JSON throws 502 Bad Gateway');
  }

  // TEST 7: Less than 2 subtasks throws 502
  try {
    parseAndValidateOutput(JSON.stringify({
      summary: 'Short summary',
      subtasks: [{ title: 'Only one task', estimatedMinutes: 30 }],
    }));
    assert(false, 'Single subtask should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Subtasks count < 2 throws 502 Bad Gateway');
  }

  // TEST 8: Valid JSON response normalized correctly
  try {
    const parsed = parseAndValidateOutput(JSON.stringify({
      summary: 'Break assignment into 3 steps.',
      subtasks: [
        { title: 'Read specs', estimatedMinutes: 15 },
        { title: 'Implement solution', estimatedMinutes: 45 },
        { title: 'Test cases', estimatedMinutes: 20 },
      ],
    }));
    assert(
      parsed.summary === 'Break assignment into 3 steps.' &&
      parsed.subtasks.length === 3 &&
      parsed.totalEstimatedMinutes === 80,
      'Valid JSON correctly parsed and total estimated minutes summed to 80'
    );
  } catch {
    assert(false, 'Valid JSON response should pass parsing and validation');
  }

  console.log(`\nAI TEST RESULT: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('--- ALL AI BREAKDOWN TESTS PASSED ---');
  } else {
    process.exit(1);
  }
}

runAiTests();
