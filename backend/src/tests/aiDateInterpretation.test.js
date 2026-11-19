const test = require('node:test');
const assert = require('node:assert/strict');
const {
  formatAiTaskDueDate,
  buildAskPrompt,
  breakDownTask,
  estimateTaskTime,
} = require('../services/ai.service');

test('1. formatAiTaskDueDate - Explicitly marked canonical UTC midnight date outputs clean YYYY-MM-DD', () => {
  const canonicalTask = {
    dueDate: '2026-11-20T00:00:00.000Z',
    dueDateFormatVersion: 2,
  };
  assert.equal(formatAiTaskDueDate(canonicalTask), '2026-11-20');
  assert.equal(formatAiTaskDueDate('2026-11-20T00:00:00.000Z', 2), '2026-11-20');
});

test('2. formatAiTaskDueDate - Unmarked historical UTC midnight timestamp is flagged with unverified provenance', () => {
  const unmarkedUtcTask = {
    dueDate: '2026-11-20T00:00:00.000Z',
    dueDateFormatVersion: null,
  };
  const result = formatAiTaskDueDate(unmarkedUtcTask);
  assert.match(result, /2026-11-20/);
  assert.match(result, /Historical UTC-midnight timestamp, unverified calendar provenance/);
});

test('3. formatAiTaskDueDate - Unmarked non-midnight legacy timestamp includes explicit unverified timezone notice', () => {
  const legacyIst = {
    dueDate: '2026-11-19T18:30:00.000Z',
    dueDateFormatVersion: null,
  };
  const formattedIst = formatAiTaskDueDate(legacyIst);
  assert.match(formattedIst, /2026-11-19/);
  assert.match(formattedIst, /Legacy timestamp: 2026-11-19T18:30:00.000Z/);
  assert.match(formattedIst, /original timezone unverified/);
});

test('4. formatAiTaskDueDate - Date-only canonical input is formatted as YYYY-MM-DD', () => {
  assert.equal(formatAiTaskDueDate('2026-11-20'), '2026-11-20');
});

test('5. formatAiTaskDueDate - Invalid calendar dates and rollover attacks return None (Invalid Date)', () => {
  // Impossible date-only
  assert.equal(formatAiTaskDueDate('2026-99-99'), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('2026-02-31'), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('not-a-date'), 'None (Invalid Date)');

  // Impossible ISO timestamps (must be rejected BEFORE new Date() to prevent rollover to March 3!)
  assert.equal(formatAiTaskDueDate('2026-02-31T00:00:00.000Z'), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('2026-02-31T00:00:00.000Z', 2), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('2026-99-99T00:00:00.000Z'), 'None (Invalid Date)');

  // April has 30 days, not 31
  assert.equal(formatAiTaskDueDate('2026-04-30T00:00:00.000Z', 2), '2026-04-30');
  assert.equal(formatAiTaskDueDate('2026-04-31T00:00:00.000Z'), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('2026-04-31'), 'None (Invalid Date)');

  // Leap year handling: 2024 is leap year, 2026 is not
  assert.equal(formatAiTaskDueDate('2024-02-29T00:00:00.000Z', 2), '2024-02-29');
  assert.equal(formatAiTaskDueDate('2024-02-29'), '2024-02-29');
  assert.equal(formatAiTaskDueDate('2026-02-29T00:00:00.000Z'), 'None (Invalid Date)');
  assert.equal(formatAiTaskDueDate('2026-02-29'), 'None (Invalid Date)');

  // Valid timestamp with timezone offset is safely handled as legacy with timezone warning
  const offsetResult = formatAiTaskDueDate('2026-11-20T05:30:00+05:30');
  assert.match(offsetResult, /2026-11-20/);
  assert.match(offsetResult, /Legacy timestamp: 2026-11-20T05:30:00\+05:30, original timezone unverified/);
});

test('6. formatAiTaskDueDate - Missing, empty, or null dates are handled safely as None', () => {
  assert.equal(formatAiTaskDueDate(null), 'None');
  assert.equal(formatAiTaskDueDate(undefined), 'None');
  assert.equal(formatAiTaskDueDate(''), 'None');
  assert.equal(formatAiTaskDueDate('   '), 'None');
});

test('7. buildAskPrompt - Integrates formatAiTaskDueDate with explicit provenance', () => {
  const tasks = [
    { title: 'Canonical Task', priority: 'high', estimatedMinutes: 45, dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: 2 },
    { title: 'Unmarked UTC Task', priority: 'medium', estimatedMinutes: 30, dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: null },
    { title: 'Legacy IST Task', priority: 'medium', estimatedMinutes: 30, dueDate: '2026-11-19T18:30:00.000Z', dueDateFormatVersion: null },
    { title: 'Undated Task', priority: 'low', estimatedMinutes: null, dueDate: null },
  ];

  const prompt = buildAskPrompt('How should I prioritize?', tasks);
  assert.match(prompt, /Canonical Task/);
  assert.match(prompt, /Due: 2026-11-20\)/);
  assert.match(prompt, /Unmarked UTC Task/);
  assert.match(prompt, /Historical UTC-midnight timestamp, unverified calendar provenance/);
  assert.match(prompt, /Legacy IST Task/);
  assert.match(prompt, /Legacy timestamp: 2026-11-19T18:30:00.000Z, original timezone unverified/);
  assert.match(prompt, /Undated Task/);
  assert.match(prompt, /Due: None\)/);
});
