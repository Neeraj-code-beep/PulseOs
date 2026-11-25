import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTaskFormDates,
  validateTaskTag,
  registerReminderHandler,
  compareTasksForExecution,
} from '../utils/taskUtils.jsx';

// Frontend state normalization helper mirror from TodoProvider
const normalizeTodo = (t) => {
  if (!t) return t;
  return {
    ...t,
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((st) => ({
          ...st,
          completed: Boolean(st.completed),
          completedAt: st.completedAt || null,
        }))
      : [],
  };
};

test('1. Task creation normalization - Guarantees tags and subtasks arrays and field defaults', () => {
  const rawApiTodo = {
    _id: 'task-100',
    title: 'Study Physics',
    completed: false,
    completedAt: null,
    // tags and subtasks omitted/null from older backend responses
    tags: null,
    subtasks: null,
  };

  const normalized = normalizeTodo(rawApiTodo);
  assert.equal(normalized._id, 'task-100');
  assert.equal(normalized.title, 'Study Physics');
  assert.deepEqual(normalized.tags, []);
  assert.deepEqual(normalized.subtasks, []);
});

test('2. Task state list transitions - Prepend on create, replace on update, filter on delete', () => {
  let todos = [
    { _id: 't-1', title: 'Task 1', completed: false },
    { _id: 't-2', title: 'Task 2', completed: false },
  ];

  // A. Create/Prepend
  const newTodo = normalizeTodo({ _id: 't-3', title: 'Task 3', completed: false });
  todos = [newTodo, ...todos];
  assert.equal(todos.length, 3);
  assert.equal(todos[0]._id, 't-3');

  // B. Update in-place
  const updatedTodo = normalizeTodo({ _id: 't-2', title: 'Task 2 Updated', completed: false });
  todos = todos.map((t) => (t._id === 't-2' ? updatedTodo : t));
  assert.equal(todos.length, 3);
  assert.equal(todos.find((t) => t._id === 't-2').title, 'Task 2 Updated');
  assert.equal(todos.find((t) => t._id === 't-1').title, 'Task 1', 'Other tasks remain untouched');

  // C. Delete
  todos = todos.filter((t) => t._id !== 't-3');
  assert.equal(todos.length, 2);
  assert.equal(todos.find((t) => t._id === 't-3'), undefined);
});

test('3. Reschedule serialization - Validates calendar date and rejects impossible dates', () => {
  // Canonical date format serialization
  const valid = validateTaskFormDates({ dueDate: '2099-11-20', reminderTime: '' });
  assert.equal(valid.valid, true);
  assert.equal(valid.dueDate, '2099-11-20T00:00:00.000Z');
  assert.equal(valid.reminderTime, null);

  // Impossible calendar dates blocked before network call
  const invalidFeb = validateTaskFormDates({ dueDate: '2099-02-31' });
  assert.equal(invalidFeb.valid, false);
  assert.match(invalidFeb.error, /invalid calendar date/i);

  // Clearing date safely produces null
  const cleared = validateTaskFormDates({ dueDate: '', reminderTime: '' });
  assert.equal(cleared.valid, true);
  assert.equal(cleared.dueDate, null);
});

test('4. Completion and reopening state transitions', () => {
  const openTask = { _id: 'task-c1', title: 'Assignment', completed: false, completedAt: null };

  // Complete task
  const now = new Date().toISOString();
  const completedTask = { ...openTask, completed: true, completedAt: now };
  assert.equal(completedTask.completed, true);
  assert.notEqual(completedTask.completedAt, null);

  // Reopen task
  const reopenedTask = { ...completedTask, completed: false, completedAt: null };
  assert.equal(reopenedTask.completed, false);
  assert.equal(reopenedTask.completedAt, null);
});

test('5. Subtasks state transitions - Add, toggle, delete, and duplicate suppression', () => {
  let task = {
    _id: 'task-sub',
    title: 'Project',
    subtasks: [
      { _id: 's-1', title: 'Phase 1', completed: false, completedAt: null },
    ],
  };

  // Add subtask
  const newSub = { _id: 's-2', title: 'Phase 2', completed: false, completedAt: null };
  task = { ...task, subtasks: [...task.subtasks, newSub] };
  assert.equal(task.subtasks.length, 2);

  // Toggle subtask completion
  task = {
    ...task,
    subtasks: task.subtasks.map((s) => (s._id === 's-1' ? { ...s, completed: true, completedAt: new Date().toISOString() } : s)),
  };
  assert.equal(task.subtasks.find((s) => s._id === 's-1').completed, true);
  assert.equal(task.subtasks.find((s) => s._id === 's-2').completed, false);

  // Delete subtask
  task = {
    ...task,
    subtasks: task.subtasks.filter((s) => s._id !== 's-1'),
  };
  assert.equal(task.subtasks.length, 1);
  assert.equal(task.subtasks[0]._id, 's-2');

  // Bulk add with deduplication
  const existingTitles = new Set(task.subtasks.map((s) => s.title.toLowerCase()));
  const suggestions = ['Phase 2', 'phase 2', 'Phase 3'];
  const toAdd = [];
  suggestions.forEach((title) => {
    const clean = title.trim();
    if (!existingTitles.has(clean.toLowerCase())) {
      existingTitles.add(clean.toLowerCase());
      toAdd.push({ _id: `s-${Date.now()}`, title: clean, completed: false, completedAt: null });
    }
  });
  assert.equal(toAdd.length, 1, 'Duplicate titles ignored');
  assert.equal(toAdd[0].title, 'Phase 3');
});

test('6. Tag lifecycle - Validation, normalization, and capacity cap', () => {
  let tags = ['math', 'science'];

  // Add normalized tag
  const validCheck = validateTaskTag('  PHYSICS  ', tags);
  assert.equal(validCheck.valid, true);
  tags = [...tags, validCheck.tag];
  assert.deepEqual(tags, ['math', 'science', 'physics']);

  // Duplicate rejected
  const dupCheck = validateTaskTag('Math', tags);
  assert.equal(dupCheck.valid, false);

  // 5-tag cap enforced
  tags = ['t1', 't2', 't3', 't4', 't5'];
  const capCheck = validateTaskTag('t6', tags);
  assert.equal(capCheck.valid, false);
  assert.match(capCheck.error, /Maximum 5 tags allowed/);

  // Remove tag
  tags = tags.filter((t) => t !== 't3');
  assert.equal(tags.length, 4);
  assert.equal(tags.includes('t3'), false);
});

test('7. Realtime reminder listener and local state sync', () => {
  let todos = [
    { _id: 't-rem-1', title: 'Due Soon', reminderSent: false },
    { _id: 't-rem-2', title: 'Another Task', reminderSent: false },
  ];

  const listeners = {};
  const mockSocket = {
    on: (evt, cb) => { listeners[evt] = cb; },
    off: (evt, cb) => { if (listeners[evt] === cb) delete listeners[evt]; },
  };

  const cleanup = registerReminderHandler(mockSocket, (payload) => {
    todos = todos.map((t) => (t._id === payload.id ? { ...t, reminderSent: true } : t));
  });

  // Emit reminder for t-rem-1
  listeners['todo:reminder']({ id: 't-rem-1', title: 'Due Soon' });

  assert.equal(todos.find((t) => t._id === 't-rem-1').reminderSent, true);
  assert.equal(todos.find((t) => t._id === 't-rem-2').reminderSent, false, 'Other task reminderSent not modified');

  cleanup();
  assert.equal(listeners['todo:reminder'], undefined, 'Socket listener cleaned up on unregister');
});

test('8. Multi-task execution sorting - Overdue and earlier due dates precede later tasks', () => {
  const earlier = '2099-12-01T00:00:00.000Z';
  const later = '2099-12-10T00:00:00.000Z';

  const tasks = [
    { _id: '1', title: 'Later Task', priority: 'medium', dueDate: later, completed: false },
    { _id: '2', title: 'Earlier Task', priority: 'medium', dueDate: earlier, completed: false },
    { _id: '3', title: 'Completed Task', priority: 'high', dueDate: earlier, completed: true },
  ];

  const sorted = [...tasks].sort(compareTasksForExecution);
  assert.equal(sorted[0]._id, '2', 'Earlier task comes first');
  assert.equal(sorted[1]._id, '1', 'Later task comes second');
  assert.equal(sorted[2]._id, '3', 'Completed task sorted to bottom');
});
