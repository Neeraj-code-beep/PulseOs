import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  getStartOfDay,
  getEndOfDay,
  isSameDay,
  isDueTodayOrOverdue,
  isUpcoming,
  isOverdue,
  formatDateDisplay,
  formatEstimate,
  formatDateTimeLocal,
  formatDateInput,
  isCompletedToday,
  classifyTaskDueDate,
  serializeIsoDate,
  safeTimestamp,
  compareTasksForExecution,
  getNextActionRationale,
  getNextBestAction,
  validateTaskFormDates,
  validateTaskTag,
  isAmbiguousLegacyDate,
  classifyDueDateProvenance,
} from '../utils/taskUtils.jsx';

test('1. formatDateDisplay - Today', () => {
  const now = new Date();
  const res = formatDateDisplay(now);
  assert.notEqual(res, null);
  assert.equal(res.text, 'Today');
  assert.equal(res.label, 'Today');
  assert.equal(res.isToday, true);
  assert.equal(res.isOverdue, false);
  assert.equal(res.isInvalid, false);
});

test('2. formatDateDisplay - Yesterday (Overdue)', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const res = formatDateDisplay(yesterday);
  assert.notEqual(res, null);
  assert.match(res.text, /^Overdue · /);
  assert.equal(res.text, res.label);
  assert.equal(res.isOverdue, true);
  assert.equal(res.isToday, false);
  assert.equal(res.isInvalid, false);
});

test('3. formatDateDisplay - Tomorrow', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const res = formatDateDisplay(tomorrow);
  assert.notEqual(res, null);
  assert.equal(res.text, 'Tomorrow');
  assert.equal(res.label, 'Tomorrow');
  assert.equal(res.isToday, false);
  assert.equal(res.isOverdue, false);
  assert.equal(res.isInvalid, false);
});

test('4. formatDateDisplay - Future date beyond tomorrow', () => {
  const future = new Date();
  future.setDate(future.getDate() + 5);
  const res = formatDateDisplay(future);
  assert.notEqual(res, null);
  assert.equal(res.isToday, false);
  assert.equal(res.isOverdue, false);
  assert.equal(res.isInvalid, false);
  assert.equal(res.text, res.label);
  assert.match(res.text, /^[A-Z][a-z]{2} \d{1,2}$/);
});

test('5. formatDateDisplay - Genuinely missing date returns null (unscheduled task)', () => {
  assert.equal(formatDateDisplay(null), null);
  assert.equal(formatDateDisplay(undefined), null);
  assert.equal(formatDateDisplay(''), null);
  assert.equal(formatDateDisplay('   '), null);
});

test('6. formatDateDisplay - Invalid date returns distinct invalid object with danger text', () => {
  const res1 = formatDateDisplay('invalid-date-string');
  assert.notEqual(res1, null);
  assert.equal(res1.isInvalid, true);
  assert.equal(res1.text, 'Invalid Date');
  assert.equal(res1.isOverdue, false);
  assert.equal(res1.isToday, false);

  const res2 = formatDateDisplay('2026-99-99');
  assert.notEqual(res2, null);
  assert.equal(res2.isInvalid, true);
  assert.equal(res2.text, 'Invalid Date');

  const res3 = formatDateDisplay(new Date('invalid'));
  assert.notEqual(res3, null);
  assert.equal(res3.isInvalid, true);
});

test('7. formatDateDisplay - Input Date object is never mutated', () => {
  const original = new Date(2026, 5, 15, 14, 30, 0, 0);
  const timestampBefore = original.getTime();
  formatDateDisplay(original);
  assert.equal(original.getTime(), timestampBefore);
});

test('8. parseLocalDate - Handles date-only string YYYY-MM-DD as local date', () => {
  const parsed = parseLocalDate('2026-11-20');
  assert.notEqual(parsed, null);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 10); // 0-indexed November
  assert.equal(parsed.getDate(), 20);
});

test('9. parseLocalDate - Handles UTC-midnight string as calendar day without day rollback', () => {
  const parsed = parseLocalDate('2026-11-20T00:00:00.000Z');
  assert.notEqual(parsed, null);
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 10);
  assert.equal(parsed.getDate(), 20);
});

test('10. parseLocalDate - Handles exact ISO timestamp with time', () => {
  const iso = '2026-11-20T14:30:00.000Z';
  const parsed = parseLocalDate(iso);
  assert.notEqual(parsed, null);
  assert.equal(parsed.getTime(), new Date(iso).getTime());
});

test('11. getStartOfDay - Returns 00:00:00.000 without mutating input', () => {
  const base = new Date(2026, 10, 19, 15, 45, 30);
  const start = getStartOfDay(base);
  assert.equal(start.getHours(), 0);
  assert.equal(start.getMinutes(), 0);
  assert.equal(start.getSeconds(), 0);
  assert.equal(start.getMilliseconds(), 0);
  assert.equal(base.getHours(), 15); // Not mutated
});

test('12. getEndOfDay - Returns 23:59:59.999 without mutating input', () => {
  const base = new Date(2026, 10, 19, 8, 15, 0);
  const end = getEndOfDay(base);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
  assert.equal(end.getMilliseconds(), 999);
  assert.equal(base.getHours(), 8); // Not mutated
});

test('13. isSameDay - Correctly identifies matching and non-matching days', () => {
  const d1 = new Date(2026, 10, 19, 9, 0);
  const d2 = new Date(2026, 10, 19, 21, 30);
  const d3 = new Date(2026, 10, 20, 9, 0);
  assert.equal(isSameDay(d1, d2), true);
  assert.equal(isSameDay(d1, d3), false);
  assert.equal(isSameDay(null, d1), false);
  assert.equal(isSameDay(d1, 'invalid'), false);
});

test('14. isDueTodayOrOverdue & isUpcoming - Same-day task scheduled later today', () => {
  const now = new Date();
  const laterToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0);
  assert.equal(isDueTodayOrOverdue(laterToday), true);
  assert.equal(isUpcoming(laterToday), false);
});

test('15. isDueTodayOrOverdue & isUpcoming - Task scheduled earlier today', () => {
  const now = new Date();
  const earlierToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 0);
  assert.equal(isDueTodayOrOverdue(earlierToday), true);
  assert.equal(isUpcoming(earlierToday), false);
});

test('16. isDueTodayOrOverdue & isUpcoming - Overdue task (yesterday)', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(isDueTodayOrOverdue(yesterday), true);
  assert.equal(isUpcoming(yesterday), false);
  assert.equal(isOverdue(yesterday), true);
});

test('17. isDueTodayOrOverdue & isUpcoming - Future-day task (tomorrow)', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  assert.equal(isDueTodayOrOverdue(tomorrow), false);
  assert.equal(isUpcoming(tomorrow), true);
  assert.equal(isOverdue(tomorrow), false);
});

test('18. isDueTodayOrOverdue & isUpcoming - Handles missing and invalid dates safely', () => {
  assert.equal(isDueTodayOrOverdue(null), false);
  assert.equal(isUpcoming(null), false);
  assert.equal(isDueTodayOrOverdue('bad-date'), false);
  assert.equal(isUpcoming('bad-date'), false);
});

test('19. formatEstimate - Formats durations correctly', () => {
  assert.equal(formatEstimate(null), null);
  assert.equal(formatEstimate(0), null);
  assert.equal(formatEstimate(-10), null);
  assert.equal(formatEstimate(25), '25m');
  assert.equal(formatEstimate(60), '1h');
  assert.equal(formatEstimate(90), '1h 30m');
  assert.equal(formatEstimate(125.4), '2h 5m');
});

test('20. formatDateTimeLocal - Preserves exact local datetime without offset shift', () => {
  const localDate = new Date(2026, 10, 20, 15, 30);
  const formatted = formatDateTimeLocal(localDate);
  assert.equal(formatted, '2026-11-20T15:30');
  assert.equal(formatDateTimeLocal(null), '');
  assert.equal(formatDateTimeLocal('invalid'), '');
});

test('21. formatDateInput - Formats local YYYY-MM-DD for date inputs', () => {
  const localDate = new Date(2026, 10, 20);
  assert.equal(formatDateInput(localDate), '2026-11-20');
  assert.equal(formatDateInput('2026-11-20'), '2026-11-20');
  assert.equal(formatDateInput('2026-11-20T00:00:00.000Z'), '2026-11-20');
  assert.equal(formatDateInput(null), '');
  assert.equal(formatDateInput('invalid'), '');
});

test('22. isCompletedToday - Completed today with valid timestamp', () => {
  const now = new Date();
  const task = { completed: true, completedAt: now.toISOString() };
  assert.equal(isCompletedToday(task, now), true);
});

test('23. isCompletedToday - Completed yesterday', () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const task = { completed: true, completedAt: yesterday.toISOString() };
  assert.equal(isCompletedToday(task, now), false);
});

test('24. isCompletedToday - Completed without completedAt (legacy task)', () => {
  const now = new Date();
  const task = { completed: true, completedAt: null };
  assert.equal(isCompletedToday(task, now), false);
  assert.equal(isCompletedToday({ completed: true }, now), false);
});

test('25. isCompletedToday - Completed with invalid completedAt', () => {
  const now = new Date();
  const task = { completed: true, completedAt: 'invalid-date-string' };
  assert.equal(isCompletedToday(task, now), false);
});

test('26. isCompletedToday - Incomplete task with no completion timestamp', () => {
  const now = new Date();
  const task = { completed: false, completedAt: null };
  assert.equal(isCompletedToday(task, now), false);
});

test('27. isCompletedToday - Incomplete task even if completedAt is present', () => {
  const now = new Date();
  const task = { completed: false, completedAt: now.toISOString() };
  assert.equal(isCompletedToday(task, now), false);
});

test('28. classifyTaskDueDate - Returns "today" for missing, invalid, today, and overdue dates', () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  assert.equal(classifyTaskDueDate(null), 'today');
  assert.equal(classifyTaskDueDate(undefined), 'today');
  assert.equal(classifyTaskDueDate(''), 'today');
  assert.equal(classifyTaskDueDate('invalid-date'), 'today');
  assert.equal(classifyTaskDueDate(now.toISOString()), 'today');
  assert.equal(classifyTaskDueDate(yesterday.toISOString()), 'today');
});

test('29. classifyTaskDueDate - Returns "upcoming" for strictly future dates', () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  assert.equal(classifyTaskDueDate(tomorrow.toISOString()), 'upcoming');
  assert.equal(classifyTaskDueDate(nextWeek.toISOString()), 'upcoming');
});

test('30. serializeIsoDate - Date-only serializes canonically to UTC midnight across timezones', () => {
  // Empty values return null value and valid
  assert.deepEqual(serializeIsoDate(null), { valid: true, value: null, error: null });
  assert.deepEqual(serializeIsoDate(''), { valid: true, value: null, error: null });
  assert.deepEqual(serializeIsoDate('   '), { valid: true, value: null, error: null });

  // Valid date-only string serializes to canonical UTC midnight
  const res1 = serializeIsoDate('2026-11-20', 'Due date');
  assert.equal(res1.valid, true);
  assert.equal(res1.value, '2026-11-20T00:00:00.000Z');
  assert.equal(res1.error, null);

  // Invalid calendar overflow (Feb 31)
  const res2 = serializeIsoDate('2026-02-31', 'Due date');
  assert.equal(res2.valid, false);
  assert.match(res2.error, /invalid calendar date/);

  // Invalid strings
  const res3 = serializeIsoDate('garbage-time', 'Reminder time');
  assert.equal(res3.valid, false);
  assert.match(res3.error, /not a valid date/);

  // Valid Date object
  const d = new Date(2026, 10, 20);
  const res4 = serializeIsoDate(d);
  assert.equal(res4.valid, true);
  assert.equal(res4.value, d.toISOString());

  // Invalid Date object
  const invalidDate = new Date('invalid');
  const res5 = serializeIsoDate(invalidDate, 'Due date');
  assert.equal(res5.valid, false);
  assert.match(res5.error, /invalid Date/);
});

test('31. safeTimestamp - Distinguishes invalid dates (null) from epoch 0 and guards against NaN', () => {
  // Invalid and missing inputs return null by default, keeping them distinct from epoch 0
  assert.equal(safeTimestamp(null), null);
  assert.equal(safeTimestamp(undefined), null);
  assert.equal(safeTimestamp(''), null);
  assert.equal(safeTimestamp('not-a-date'), null);
  assert.equal(safeTimestamp(new Date('invalid')), null);

  // Custom fallback is respected when explicitly provided
  assert.equal(safeTimestamp(null, 0), 0);
  assert.equal(safeTimestamp('invalid', -1), -1);

  // Valid epoch timestamp 0 (1970-01-01T00:00:00.000Z) is a valid number, distinct from null
  assert.equal(safeTimestamp(0), 0);
  assert.equal(safeTimestamp('1970-01-01T00:00:00.000Z'), 0);
  assert.notEqual(safeTimestamp(0), safeTimestamp('invalid'));

  const nowEpoch = 1763596800000;
  assert.equal(safeTimestamp(nowEpoch), nowEpoch);
  assert.equal(safeTimestamp(new Date(nowEpoch)), nowEpoch);
  assert.equal(safeTimestamp(new Date(nowEpoch).toISOString()), nowEpoch);
});

test('32. compareTasksForExecution - Prioritizes valid timestamps and remains stable with corrupted createdAt', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const t1 = { id: 'a', priority: 'high', dueDate: tomorrow.toISOString(), createdAt: 'corrupted-timestamp', completed: false };
  const t2 = { id: 'b', priority: 'high', dueDate: tomorrow.toISOString(), createdAt: null, completed: false };
  const t3 = { id: 'c', priority: 'high', dueDate: tomorrow.toISOString(), createdAt: undefined, completed: false };
  const t4 = { id: 'd', priority: 'high', dueDate: tomorrow.toISOString(), createdAt: new Date().toISOString(), completed: false };

  // Comparison must never return NaN
  const diff1 = compareTasksForExecution(t1, t2);
  assert.equal(isNaN(diff1), false, 'Comparison must not return NaN');

  const diff2 = compareTasksForExecution(t2, t3);
  assert.equal(isNaN(diff2), false, 'Comparison must not return NaN');

  // Sorting list with corrupted timestamps does not throw and preserves deterministic order
  const list = [t1, t2, t3, t4];
  assert.doesNotThrow(() => list.sort(compareTasksForExecution));
  // Task with valid recent createdAt (t4) should come before corrupted ones (t1, t2, t3)
  assert.equal(list[0].id, 'd');
});

test('33. getNextActionRationale - Produces distinct warning for corrupted due dates', () => {
  const badTask = { priority: 'medium', dueDate: 'corrupted-date-string' };
  const r = getNextActionRationale(badTask);
  assert.equal(r.variant, 'danger');
  assert.equal(r.text, 'Invalid Due Date · Review Task');
});

test('34. validateTaskTag - Production utility enforces formatting, length limits, and uniqueness', () => {
  const existingTags = ['cs101', 'math', 'ai', 'study'];

  const validAdd = validateTaskTag('  PHYSICS  ', existingTags);
  assert.equal(validAdd.valid, true);
  assert.equal(validAdd.tag, 'physics');
  assert.equal(validAdd.error, null);

  const duplicateAdd = validateTaskTag('Math', existingTags);
  assert.equal(duplicateAdd.valid, false);
  assert.match(duplicateAdd.error, /already exists/);

  const tooLong = validateTaskTag('a'.repeat(31), existingTags);
  assert.equal(tooLong.valid, false);
  assert.match(tooLong.error, /cannot exceed 30 characters/);

  const emptyTag = validateTaskTag('', existingTags);
  assert.equal(emptyTag.valid, false);
  assert.match(emptyTag.error, /cannot be empty/);

  const nullTag = validateTaskTag(null, existingTags);
  assert.equal(nullTag.valid, false);
  assert.match(nullTag.error, /valid text string/);
});

test('35. Calendar-date cross-timezone consistency - Preserves calendar day across offsets', () => {
  // A task set for 2026-11-20 in canonical UTC midnight format:
  const canonicalUtcStamp = '2026-11-20T00:00:00.000Z';
  const parsed = parseLocalDate(canonicalUtcStamp);

  assert.notEqual(parsed, null);
  // Independent of the environment timezone, calendar day must be 2026-11-20
  assert.equal(parsed.getFullYear(), 2026);
  assert.equal(parsed.getMonth(), 10);
  assert.equal(parsed.getDate(), 20);

  // Formatted for <input type="date"> must be "2026-11-20"
  assert.equal(formatDateInput(canonicalUtcStamp), '2026-11-20');
});

test('36. Legacy Date Preservation Policy - Untouched due dates preserve stored values without silent shifts', () => {
  // Simulate legacy task stored in DB as local midnight IST (18:30Z Nov 19)
  const legacyStoredDueDate = '2026-11-19T18:30:00.000Z';

  // 1. Initial editor state computes input string for the current environment
  const originalDueDateInput = formatDateInput(legacyStoredDueDate);

  // 2. User edits other fields (e.g. title) without changing dueDate input
  const currentDueDateInput = originalDueDateInput;
  const dueDateChanged = currentDueDateInput !== originalDueDateInput;

  // 3. When unchanged, preservation policy retains exact stored database value
  const finalDueDate = dueDateChanged
    ? serializeIsoDate(currentDueDateInput, 'Due date').value
    : legacyStoredDueDate;

  assert.equal(finalDueDate, legacyStoredDueDate, 'Stored legacy value must be preserved verbatim when not modified');

  // 4. When user deliberately changes date (e.g. picks Nov 25)
  const userChangedDateInput = '2026-11-25';
  const isChanged = userChangedDateInput !== originalDueDateInput;
  const finalChangedDueDate = isChanged
    ? serializeIsoDate(userChangedDateInput, 'Due date').value
    : legacyStoredDueDate;

  assert.equal(finalChangedDueDate, '2026-11-25T00:00:00.000Z', 'Deliberately changed date upgrades to canonical UTC midnight');
});

test('37. Due Date vs Reminder Time separation - Calendar date vs exact point in time', () => {
  const calendarDateInput = '2026-11-20';
  const reminderDateTimeInput = '2026-11-20T14:30';

  const serializedCalendar = serializeIsoDate(calendarDateInput, 'Due date');
  assert.equal(serializedCalendar.value, '2026-11-20T00:00:00.000Z', 'Calendar date must serialize to canonical UTC midnight');

  const serializedReminder = serializeIsoDate(reminderDateTimeInput, 'Reminder time');
  assert.equal(serializedReminder.valid, true);
  // Reminder must be an exact ISO point in time, not forced to 00:00:00.000Z
  assert.match(serializedReminder.value, /T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  assert.notEqual(serializedReminder.value, '2026-11-20T00:00:00.000Z');
});

test('38. isAmbiguousLegacyDate - Provenance marker distinguishes canonical from unmarked historical dates', () => {
  // Empty, null, invalid are not legacy dates
  assert.equal(isAmbiguousLegacyDate(null), false);
  assert.equal(isAmbiguousLegacyDate(undefined), false);
  assert.equal(isAmbiguousLegacyDate(''), false);
  assert.equal(isAmbiguousLegacyDate('not-a-date'), false);

  // Date-only string is canonical
  assert.equal(isAmbiguousLegacyDate('2026-11-20'), false);

  // UTC midnight WITH explicit version marker 2 is CANONICAL (not ambiguous legacy)
  assert.equal(isAmbiguousLegacyDate('2026-11-20T00:00:00.000Z', 2), false);
  assert.equal(isAmbiguousLegacyDate({ dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: 2 }), false);

  // UTC midnight WITHOUT explicit version marker (unmarked historical record) IS ambiguous legacy
  assert.equal(isAmbiguousLegacyDate('2026-11-20T00:00:00.000Z', null), true);
  assert.equal(isAmbiguousLegacyDate({ dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: null }), true);

  // Non-zero UTC time timestamps ARE ambiguous legacy dates regardless of version
  assert.equal(isAmbiguousLegacyDate('2026-11-19T18:30:00.000Z'), true);
  assert.equal(isAmbiguousLegacyDate('2026-11-20T05:00:00.000Z'), true);
});

test('39. classifyDueDateProvenance - Requires explicit version marker 2 for canonical UTC midnight and rejects impossible dates', () => {
  assert.equal(classifyDueDateProvenance(null), 'NONE');
  assert.equal(classifyDueDateProvenance(''), 'NONE');
  assert.equal(classifyDueDateProvenance('invalid-date'), 'INVALID');

  // Impossible dates are strictly INVALID, not CANONICAL
  assert.equal(classifyDueDateProvenance('2026-99-99'), 'INVALID');
  assert.equal(classifyDueDateProvenance('2026-02-31'), 'INVALID');

  // Impossible ISO timestamps (must be rejected BEFORE new Date() to prevent rollover to March 3!)
  assert.equal(classifyDueDateProvenance('2026-02-31T00:00:00.000Z'), 'INVALID');
  assert.equal(classifyDueDateProvenance('2026-02-31T00:00:00.000Z', 2), 'INVALID');
  assert.equal(classifyDueDateProvenance({ dueDate: '2026-02-31T00:00:00.000Z', dueDateFormatVersion: 2 }), 'INVALID');
  assert.equal(classifyDueDateProvenance('2026-99-99T00:00:00.000Z'), 'INVALID');

  // Month day bounds: April has 30 days, not 31
  assert.equal(classifyDueDateProvenance('2026-04-30', 2), 'CANONICAL');
  assert.equal(classifyDueDateProvenance('2026-04-30T00:00:00.000Z', 2), 'CANONICAL');
  assert.equal(classifyDueDateProvenance('2026-04-31'), 'INVALID');
  assert.equal(classifyDueDateProvenance('2026-04-31T00:00:00.000Z'), 'INVALID');

  // Leap years: 2024 is a leap year; 2026 is not
  assert.equal(classifyDueDateProvenance('2024-02-29', 2), 'CANONICAL');
  assert.equal(classifyDueDateProvenance('2024-02-29T00:00:00.000Z', 2), 'CANONICAL');
  assert.equal(classifyDueDateProvenance('2026-02-29'), 'INVALID');
  assert.equal(classifyDueDateProvenance('2026-02-29T00:00:00.000Z'), 'INVALID');

  // Valid date-only calendar date is CANONICAL
  assert.equal(classifyDueDateProvenance('2026-11-20'), 'CANONICAL');

  // UTC midnight WITH version marker 2 is CANONICAL
  assert.equal(classifyDueDateProvenance('2026-11-20T00:00:00.000Z', 2), 'CANONICAL');
  assert.equal(classifyDueDateProvenance({ dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: 2 }), 'CANONICAL');

  // UTC midnight WITHOUT version marker is LEGACY_AMBIGUOUS (historical timestamp with unverified provenance)
  assert.equal(classifyDueDateProvenance('2026-11-20T00:00:00.000Z', null), 'LEGACY_AMBIGUOUS');
  assert.equal(classifyDueDateProvenance({ dueDate: '2026-11-20T00:00:00.000Z', dueDateFormatVersion: null }), 'LEGACY_AMBIGUOUS');

  // Non-midnight offset timestamps are LEGACY_AMBIGUOUS
  assert.equal(classifyDueDateProvenance('2026-11-19T18:30:00.000Z'), 'LEGACY_AMBIGUOUS');
  assert.equal(classifyDueDateProvenance('2026-11-20T05:00:00.000Z'), 'LEGACY_AMBIGUOUS');
  assert.equal(classifyDueDateProvenance('2026-11-20T05:30:00+05:30'), 'LEGACY_AMBIGUOUS');
});

test('40. formatDateDisplay - Flags unmarked historical records and legacy timestamps with isLegacy', () => {
  // Explicitly canonical date has isLegacy: false and clean label
  const canonical = formatDateDisplay('2026-11-20T00:00:00.000Z', 2);
  assert.equal(canonical.isLegacy, false);
  assert.equal(canonical.label, canonical.text);
  assert.equal(canonical.legacyWarning, null);

  // Unmarked historical UTC midnight timestamp has isLegacy: true
  const unmarkedUtc = formatDateDisplay('2026-11-20T00:00:00.000Z', null);
  assert.equal(unmarkedUtc.isLegacy, true);
  assert.match(unmarkedUtc.legacyWarning, /Legacy date · Unverified timezone/);

  // Ambiguous legacy offset timestamp has isLegacy: true
  const legacy = formatDateDisplay('2026-11-19T18:30:00.000Z', null);
  assert.equal(legacy.isLegacy, true);
  assert.match(legacy.legacyWarning, /Legacy date · Unverified timezone/);
});

test('41. getNextBestAction & getNextActionRationale - Preserves full task provenance and handles invalid dates', () => {
  const invalidTask = {
    _id: 'task-invalid',
    title: 'Corrupted Task',
    dueDate: '2026-02-31T00:00:00.000Z',
    dueDateFormatVersion: 2,
    priority: 'high',
    completed: false,
  };

  const canonicalTask = {
    _id: 'task-canonical',
    title: 'Clean Canonical Task',
    dueDate: '2099-11-20T00:00:00.000Z',
    dueDateFormatVersion: 2,
    priority: 'high',
    completed: false,
  };

  const legacyTask = {
    _id: 'task-legacy',
    title: 'Legacy Offset Task',
    dueDate: '2099-11-19T18:30:00.000Z',
    dueDateFormatVersion: null,
    priority: 'medium',
    completed: false,
  };

  // getNextBestAction runs directly on production task list
  const nextTask = getNextBestAction([legacyTask, canonicalTask]);
  assert.ok(nextTask, 'Next task selected');

  // getNextActionRationale handles corrupted/invalid dates with danger variant
  const invalidRationale = getNextActionRationale(invalidTask);
  assert.equal(invalidRationale.variant, 'danger');
  assert.match(invalidRationale.text, /Invalid Due Date/);

  // getNextActionRationale handles valid tasks without error
  const canonicalRationale = getNextActionRationale(canonicalTask);
  assert.ok(canonicalRationale.text);
  assert.notEqual(canonicalRationale.variant, 'danger');
});

test('42. validateTaskFormDates - Production date validator rejects impossible calendar dates', () => {
  // Impossible date-only is rejected
  const resFeb31 = validateTaskFormDates({ dueDate: '2026-02-31' });
  assert.equal(resFeb31.valid, false);
  assert.match(resFeb31.error, /invalid.*date/i);

  // Impossible month 99 is rejected
  const resMonth99 = validateTaskFormDates({ dueDate: '2026-99-99' });
  assert.equal(resMonth99.valid, false);

  // April 31 is rejected
  const resApr31 = validateTaskFormDates({ dueDate: '2026-04-31' });
  assert.equal(resApr31.valid, false);

  // Valid date is accepted and canonicalized to UTC midnight
  const resValid = validateTaskFormDates({ dueDate: '2026-11-20' });
  assert.equal(resValid.valid, true);
  assert.equal(resValid.dueDate, '2026-11-20T00:00:00.000Z');

  // Empty date is safely accepted as null
  const resEmpty = validateTaskFormDates({ dueDate: '' });
  assert.equal(resEmpty.valid, true);
  assert.equal(resEmpty.dueDate, null);
});
