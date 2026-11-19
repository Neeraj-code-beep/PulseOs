import test from 'node:test';
import assert from 'node:assert/strict';
import {
  serializeIsoDate,
  validateTaskFormDates,
  registerReminderHandler,
  validateTaskTag,
} from '../utils/taskUtils.jsx';

test('1. validateTaskFormDates - Returns null for empty inputs without throwing', () => {
  const result = validateTaskFormDates({ dueDate: '', reminderTime: '' });
  assert.equal(result.valid, true);
  assert.equal(result.dueDate, null);
  assert.equal(result.reminderTime, null);
  assert.equal(result.error, null);

  const nullResult = validateTaskFormDates({ dueDate: null, reminderTime: null });
  assert.equal(nullResult.valid, true);
  assert.equal(nullResult.dueDate, null);
  assert.equal(nullResult.reminderTime, null);
});

test('2. validateTaskFormDates - Serializes calendar dueDate to canonical UTC midnight and reminderTime to ISO timestamp', () => {
  const result = validateTaskFormDates({
    dueDate: '2026-11-20',
    reminderTime: '2026-11-20T14:30',
  });
  assert.equal(result.valid, true);
  assert.equal(result.error, null);
  // Canonical calendar-date UTC midnight format
  assert.equal(result.dueDate, '2026-11-20T00:00:00.000Z');
  // Reminder retains exact moment in time
  assert.equal(typeof result.reminderTime, 'string');
  assert.match(result.reminderTime, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
});

test('3. validateTaskFormDates - Blocks submission and returns error on invalid dueDate', () => {
  const badDateResult = validateTaskFormDates({ dueDate: 'invalid-date' });
  assert.equal(badDateResult.valid, false);
  assert.equal(badDateResult.dueDate, null);
  assert.match(badDateResult.error, /Due date/);

  const overflowDate = validateTaskFormDates({ dueDate: '2026-02-31' });
  assert.equal(overflowDate.valid, false);
  assert.match(overflowDate.error, /invalid calendar date/);
});

test('4. validateTaskFormDates - Blocks submission and returns error on invalid reminderTime', () => {
  const badReminderResult = validateTaskFormDates({ reminderTime: 'corrupted-timestamp' });
  assert.equal(badReminderResult.valid, false);
  assert.equal(badReminderResult.reminderTime, null);
  assert.match(badReminderResult.error, /Reminder time/);
});

test('5. serializeIsoDate - Handles numeric timestamps and rejects NaN Dates', () => {
  const epoch = 1763596800000;
  const numResult = serializeIsoDate(epoch);
  assert.equal(numResult.valid, true);
  assert.equal(numResult.value, new Date(epoch).toISOString());

  const nanDate = new Date('not-a-real-date');
  const nanResult = serializeIsoDate(nanDate, 'Exam date');
  assert.equal(nanResult.valid, false);
  assert.match(nanResult.error, /Exam date/);
});

test('6. registerReminderHandler - Registers listener and receives valid reminder payloads', () => {
  const eventListeners = {};
  const mockSocket = {
    on: (evt, cb) => {
      eventListeners[evt] = cb;
    },
    off: (evt, cb) => {
      if (eventListeners[evt] === cb) {
        delete eventListeners[evt];
      }
    },
  };

  const received = [];
  const cleanup = registerReminderHandler(mockSocket, (payload) => {
    received.push(payload);
  });

  assert.equal(typeof eventListeners['todo:reminder'], 'function');

  // Trigger valid reminder
  eventListeners['todo:reminder']({ id: 'task-101', title: 'Chemistry Exam' });
  assert.equal(received.length, 1);
  assert.equal(received[0].id, 'task-101');
  assert.equal(received[0].title, 'Chemistry Exam');

  // Trigger invalid payload: missing id
  eventListeners['todo:reminder']({ title: 'Invalid Task' });
  assert.equal(received.length, 1, 'Invalid payload without id must be ignored');

  // Trigger invalid payload: missing title
  eventListeners['todo:reminder']({ id: 'task-102' });
  assert.equal(received.length, 1, 'Invalid payload without title must be ignored');

  // Trigger null payload
  eventListeners['todo:reminder'](null);
  assert.equal(received.length, 1, 'Null payload must be ignored');

  // Cleanup removes listener
  cleanup();
  assert.equal(eventListeners['todo:reminder'], undefined, 'Cleanup must unregister socket listener');
});

test('7. registerReminderHandler - Safely handles null or non-socket inputs', () => {
  const cleanup1 = registerReminderHandler(null, () => {});
  assert.equal(typeof cleanup1, 'function');
  assert.doesNotThrow(() => cleanup1());

  const cleanup2 = registerReminderHandler({}, () => {});
  assert.equal(typeof cleanup2, 'function');
  assert.doesNotThrow(() => cleanup2());
});

test('8. validateTaskTag - Production utility enforces formatting, length limits, and uniqueness', () => {
  const existingTags = ['cs101', 'math', 'ai', 'study'];

  // Valid tag with trimming and lowercasing
  const validAdd = validateTaskTag('  PHYSICS  ', existingTags);
  assert.equal(validAdd.valid, true);
  assert.equal(validAdd.tag, 'physics');
  assert.equal(validAdd.error, null);

  // Duplicate tag (case-insensitive)
  const duplicateAdd = validateTaskTag('Math', existingTags);
  assert.equal(duplicateAdd.valid, false);
  assert.match(duplicateAdd.error, /already exists/);

  // Exceeds 30 characters
  const tooLong = validateTaskTag('a'.repeat(31), existingTags);
  assert.equal(tooLong.valid, false);
  assert.match(tooLong.error, /cannot exceed 30 characters/);

  // Empty and whitespace-only tags
  const emptyTag = validateTaskTag('', existingTags);
  assert.equal(emptyTag.valid, false);
  assert.match(emptyTag.error, /cannot be empty/);

  const whitespaceTag = validateTaskTag('   ', existingTags);
  assert.equal(whitespaceTag.valid, false);
  assert.match(whitespaceTag.error, /cannot be empty/);

  // Invalid input types
  const nullTag = validateTaskTag(null, existingTags);
  assert.equal(nullTag.valid, false);
  assert.match(nullTag.error, /valid text string/);

  const numTag = validateTaskTag(12345, existingTags);
  assert.equal(numTag.valid, false);
  assert.match(numTag.error, /valid text string/);
});

test('9. validateTaskTag - Production utility enforces 5-tag capacity cap', () => {
  const fullTags = ['one', 'two', 'three', 'four', 'five'];
  const cappedAdd = validateTaskTag('six', fullTags);
  assert.equal(cappedAdd.valid, false);
  assert.equal(cappedAdd.tag, null);
  assert.match(cappedAdd.error, /Maximum 5 tags allowed/);
});
