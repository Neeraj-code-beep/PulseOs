const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const {
  validateBreakdownInput,
  parseAndValidateOutput,
  buildPrompt,
  validateEstimationInput,
  parseAndValidateEstimationOutput,
  buildEstimationPrompt,
  generateScheduleBlocks,
  proposeSchedule,
  parseTimeToMinutes,
} = require('../services/ai.service');

async function runAiTests() {
  console.log('--- RUNNING AI TASK BREAKDOWN, ESTIMATION & SMART SCHEDULING TEST MATRIX ---');

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

  // --- PART 1: AI BREAKDOWN TESTS ---

  // TEST 1: Breakdown - Missing title throws 400
  try {
    validateBreakdownInput({ title: '' });
    assert(false, 'Missing title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Breakdown - Missing title throws 400 Bad Request');
  }

  // TEST 2: Breakdown - Non-string title throws 400
  try {
    validateBreakdownInput({ title: 12345 });
    assert(false, 'Non-string title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Breakdown - Non-string title throws 400 Bad Request');
  }

  // TEST 3: Breakdown - Oversized title (>500 chars) throws 400
  try {
    validateBreakdownInput({ title: 'A'.repeat(501) });
    assert(false, 'Oversized title should throw error');
  } catch (err) {
    assert(err.status === 400, 'Breakdown - Oversized title (>500 chars) throws 400 Bad Request');
  }

  // TEST 4: Breakdown - Valid title and context validation
  try {
    const res = validateBreakdownInput({
      title: '  Prepare DSA assignment  ',
      context: { priority: 'high' },
    });
    assert(res.title === 'Prepare DSA assignment' && res.context.priority === 'high', 'Breakdown - Valid title trimmed and context accepted');
  } catch {
    assert(false, 'Valid input should pass validation');
  }

  // TEST 5: Breakdown - Prompt construction includes context
  const prompt = buildPrompt('Prepare DSA assignment', { priority: 'high', estimatedMinutes: 60 });
  assert(prompt.includes('Prepare DSA assignment') && prompt.includes('Priority: high'), 'Breakdown - Prompt includes task title and context');

  // TEST 6: Breakdown - Invalid JSON output parsing throws 502
  try {
    parseAndValidateOutput('invalid json string');
    assert(false, 'Invalid JSON should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Breakdown - Invalid JSON throws 502 Bad Gateway');
  }

  // TEST 7: Breakdown - Less than 2 subtasks throws 502
  try {
    parseAndValidateOutput(JSON.stringify({
      summary: 'Short summary',
      subtasks: [{ title: 'Only one task', estimatedMinutes: 30 }],
    }));
    assert(false, 'Single subtask should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Breakdown - Subtasks count < 2 throws 502 Bad Gateway');
  }

  // TEST 8: Breakdown - Valid JSON response normalized correctly
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
      'Breakdown - Valid JSON correctly parsed and total estimated minutes summed to 80'
    );
  } catch {
    assert(false, 'Valid JSON response should pass parsing and validation');
  }

  // --- PART 2: AI TIME ESTIMATION TESTS ---

  // TEST 9: Estimation - Missing title throws 400
  try {
    validateEstimationInput({ title: '' });
    assert(false, 'Estimation missing title should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Estimation - Missing title throws 400 Bad Request');
  }

  // TEST 10: Estimation - Non-string title throws 400
  try {
    validateEstimationInput({ title: null });
    assert(false, 'Estimation non-string title should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Estimation - Non-string title throws 400 Bad Request');
  }

  // TEST 11: Estimation - Oversized title (>500 chars) throws 400
  try {
    validateEstimationInput({ title: 'X'.repeat(501) });
    assert(false, 'Estimation oversized title should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Estimation - Oversized title (>500 chars) throws 400 Bad Request');
  }

  // TEST 12: Estimation - Prompt construction
  const estPrompt = buildEstimationPrompt('Prepare DSA assignment', { priority: 'high', currentEstimate: 60 });
  assert(estPrompt.includes('Prepare DSA assignment') && estPrompt.includes('Current Estimate: 60'), 'Estimation - Prompt includes title and context');

  // TEST 13: Estimation - Malformed JSON throws 502
  try {
    parseAndValidateEstimationOutput('Not JSON text');
    assert(false, 'Malformed estimation output should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Estimation - Malformed JSON throws 502 Bad Gateway');
  }

  // TEST 14: Estimation - Invalid/Negative duration throws 502
  try {
    parseAndValidateEstimationOutput(JSON.stringify({ estimatedMinutes: -15, reason: 'Invalid' }));
    assert(false, 'Negative duration should throw 502');
  } catch (err) {
    assert(err.status === 502, 'Estimation - Negative duration throws 502 Bad Gateway');
  }

  // TEST 15: Estimation - Successful parsing and rounding
  try {
    const res = parseAndValidateEstimationOutput(JSON.stringify({
      estimatedMinutes: 89.6,
      reason: 'Requires implementation and verification.',
    }));
    assert(res.estimatedMinutes === 90 && res.reason.includes('implementation'), 'Estimation - Valid estimate parsed and rounded to 90 min');
  } catch {
    assert(false, 'Valid estimation JSON should pass');
  }

  // --- PART 3: SMART SCHEDULE PROPOSAL TESTS ---

  // TEST 16: Schedule - Missing availability object throws 400
  try {
    await proposeSchedule({ title: 'Study DSA', estimatedMinutes: 60 });
    assert(false, 'Missing availability should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Schedule - Missing availability throws 400 Bad Request');
  }

  // TEST 17: Schedule - Invalid date format throws 400
  try {
    await proposeSchedule({
      title: 'Study DSA',
      estimatedMinutes: 60,
      availability: { date: 'invalid-date', startTime: '16:00', endTime: '20:00' },
    });
    assert(false, 'Invalid date should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Schedule - Invalid date format throws 400 Bad Request');
  }

  // TEST 18: Schedule - startTime >= endTime throws 400
  try {
    generateScheduleBlocks({
      title: 'Study DSA',
      estimatedMinutes: 60,
      availability: { date: '2026-08-08', startTime: '18:00', endTime: '16:00' },
    });
    assert(false, 'Start time after end time should throw 400');
  } catch (err) {
    assert(err.status === 400, 'Schedule - Start time after end time throws 400 Bad Request');
  }

  // TEST 19: Schedule - 30-minute task scheduling
  try {
    const res = generateScheduleBlocks({
      title: 'Quick review',
      estimatedMinutes: 30,
      availability: { date: '2026-08-08', startTime: '10:00', endTime: '12:00' },
    });
    assert(
      res.fitsAvailability === true &&
      res.blocks.length === 1 &&
      res.blocks[0].startTime === '10:00' &&
      res.blocks[0].endTime === '10:30' &&
      res.totalFocusMinutes === 30,
      'Schedule - 30-minute task correctly scheduled in 1 block'
    );
  } catch {
    assert(false, '30-minute task should schedule cleanly');
  }

  // TEST 20: Schedule - 90-minute task with break insertion
  try {
    const res = generateScheduleBlocks({
      title: 'Prepare DSA assignment',
      estimatedMinutes: 90,
      availability: { date: '2026-08-08', startTime: '16:00', endTime: '20:00' },
    });
    assert(
      res.fitsAvailability === true &&
      res.blocks.length === 3 &&
      res.blocks[0].type === 'focus' &&
      res.blocks[1].type === 'break' &&
      res.blocks[2].type === 'focus' &&
      res.totalFocusMinutes === 90,
      'Schedule - 90-minute task split into 2 focus blocks with 1 break'
    );
  } catch {
    assert(false, '90-minute task should schedule cleanly');
  }

  // TEST 21: Schedule - Stays within availability window
  try {
    const res = generateScheduleBlocks({
      title: 'Deep Work Session',
      estimatedMinutes: 120,
      availability: { date: '2026-08-08', startTime: '14:00', endTime: '17:00' },
    });
    const lastBlock = res.blocks[res.blocks.length - 1];
    const lastBlockEndMins = parseTimeToMinutes(lastBlock.endTime);
    const windowEndMins = parseTimeToMinutes('17:00');
    assert(
      res.fitsAvailability === true && lastBlockEndMins <= windowEndMins,
      'Schedule - All generated blocks remain strictly within availability window'
    );
  } catch {
    assert(false, 'Schedule should fit within window');
  }

  // TEST 22: Schedule - Insufficient availability handled cleanly
  try {
    const res = generateScheduleBlocks({
      title: 'Huge Project',
      estimatedMinutes: 180,
      availability: { date: '2026-08-08', startTime: '16:00', endTime: '18:00' },
    });
    assert(
      res.fitsAvailability === false &&
      res.availableMinutes === 120 &&
      res.requiredMinutes === 180 &&
      res.message.includes('needs more time'),
      'Schedule - Insufficient availability returned with fitsAvailability: false'
    );
  } catch {
    assert(false, 'Insufficient availability should return warning object');
  }

  // TEST 23: Schedule - No overlapping blocks in timeline
  try {
    const res = generateScheduleBlocks({
      title: 'Multi-block Task',
      estimatedMinutes: 135,
      availability: { date: '2026-08-08', startTime: '09:00', endTime: '13:00' },
    });
    let noOverlap = true;
    for (let i = 0; i < res.blocks.length - 1; i++) {
      const currentEnd = parseTimeToMinutes(res.blocks[i].endTime);
      const nextStart = parseTimeToMinutes(res.blocks[i + 1].startTime);
      if (currentEnd > nextStart) {
        noOverlap = false;
        break;
      }
    }
    assert(noOverlap, 'Schedule - No overlapping blocks generated');
  } catch {
    assert(false, 'Timeline should have no overlapping blocks');
  }

  console.log(`\nAI & SCHEDULING TEST RESULT: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('--- ALL AI BREAKDOWN, ESTIMATION & SMART SCHEDULING TESTS PASSED ---');
  } else {
    process.exit(1);
  }
}

runAiTests();
