import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNextBestAction,
  getNextActionRationale,
  compareTasksForExecution,
  classifyTaskDueDate,
  isCompletedToday,
} from '../utils/taskUtils.jsx';

test('1. NextBestAction selection - Prioritizes overdue task over high-priority future task', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const future = new Date();
  future.setDate(future.getDate() + 3);

  const tasks = [
    { id: '1', title: 'Future High Priority', priority: 'high', dueDate: future.toISOString(), completed: false },
    { id: '2', title: 'Overdue Low Priority', priority: 'low', dueDate: yesterday.toISOString(), completed: false },
  ];

  const best = getNextBestAction(tasks);
  assert.notEqual(best, null);
  assert.equal(best.id, '2', 'Overdue task must take precedence over high priority future task');
});

test('2. NextBestAction selection - High priority wins when neither task is overdue', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const tasks = [
    { id: '1', title: 'Medium Priority Task', priority: 'medium', dueDate: tomorrow.toISOString(), completed: false },
    { id: '2', title: 'High Priority Task', priority: 'high', dueDate: tomorrow.toISOString(), completed: false },
  ];

  const best = getNextBestAction(tasks);
  assert.notEqual(best, null);
  assert.equal(best.id, '2', 'High priority task must win when both are due tomorrow');
});

test('3. NextBestAction selection - Ignores completed tasks and returns null when all done', () => {
  const doneTasks = [
    { id: '1', title: 'Done 1', priority: 'high', completed: true },
    { id: '2', title: 'Done 2', priority: 'high', completed: true },
  ];

  assert.equal(getNextBestAction(doneTasks), null);
  assert.equal(getNextBestAction([]), null);
  assert.equal(getNextBestAction(null), null);
});

test('4. NextBestAction rationale - Returns expected text and variant from production utility', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const overdueRationale = getNextActionRationale({ priority: 'medium', dueDate: yesterday.toISOString() });
  assert.equal(overdueRationale.text, 'Overdue Priority');
  assert.equal(overdueRationale.variant, 'danger');

  const highRationale = getNextActionRationale({ priority: 'high', dueDate: tomorrow.toISOString() });
  assert.equal(highRationale.text, 'High Priority Assignment');
  assert.equal(highRationale.variant, 'primary');

  const upcomingRationale = getNextActionRationale({ priority: 'medium', dueDate: tomorrow.toISOString() });
  assert.equal(upcomingRationale.text, 'Due Tomorrow');
  assert.equal(upcomingRationale.variant, 'accent');

  const undatedRationale = getNextActionRationale({ priority: 'medium', dueDate: null });
  assert.equal(undatedRationale.text, 'Recommended Next Focus Target');
  assert.equal(undatedRationale.variant, 'neutral');

  const nullRationale = getNextActionRationale(null);
  assert.equal(nullRationale.text, 'All active tasks completed!');
  assert.equal(nullRationale.variant, 'neutral');
});

test('5. DailyWorkspace completedToday - Accurately counts tasks completed today and excludes legacy/untracked tasks', () => {
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0);

  const todos = [
    { id: '1', title: 'Done today', completed: true, completedAt: now.toISOString() },
    { id: '2', title: 'Done yesterday', completed: true, completedAt: yesterday.toISOString() },
    { id: '3', title: 'Done without timestamp (legacy)', completed: true, completedAt: null },
    { id: '4', title: 'Done with invalid timestamp', completed: true, completedAt: 'corrupted-timestamp' },
    { id: '5', title: 'Open task', completed: false, completedAt: null },
  ];

  const completedTodayList = todos.filter((t) => isCompletedToday(t, now));

  const ids = completedTodayList.map((t) => t.id);
  assert.equal(ids.includes('1'), true, 'Valid task completed today must be included');
  assert.equal(ids.includes('2'), false, 'Task completed yesterday must be excluded');
  assert.equal(ids.includes('3'), false, 'Legacy task without timestamp must be excluded');
  assert.equal(ids.includes('4'), false, 'Task with corrupted timestamp must be excluded');
  assert.equal(ids.includes('5'), false, 'Incomplete task must be excluded');
  assert.equal(completedTodayList.length, 1);
});

test('6. Tasks workspace - classifyTaskDueDate guarantees counts.today + counts.upcoming === counts.all', () => {
  const now = new Date();
  const laterToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0);
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0);
  const future = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0);

  const todos = [
    { id: '1', title: 'Overdue task', dueDate: yesterday.toISOString(), completed: false },
    { id: '2', title: 'Later today task', dueDate: laterToday.toISOString(), completed: false },
    { id: '3', title: 'Unscheduled task', dueDate: null, completed: false },
    { id: '4', title: 'Task with invalid date', dueDate: 'invalid-date-string', completed: false },
    { id: '5', title: 'Future task', dueDate: future.toISOString(), completed: false },
    { id: '6', title: 'Completed task', dueDate: laterToday.toISOString(), completed: true },
  ];

  const counts = {
    today: todos.filter((t) => !t.completed && classifyTaskDueDate(t.dueDate) === 'today').length,
    upcoming: todos.filter((t) => !t.completed && classifyTaskDueDate(t.dueDate) === 'upcoming').length,
    all: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  // 'today' receives: 1 (overdue), 2 (today), 3 (unscheduled/null), 4 (invalid date) = 4
  assert.equal(counts.today, 4);
  // 'upcoming' receives: 5 (future) = 1
  assert.equal(counts.upcoming, 1);
  // 'all' receives: 1, 2, 3, 4, 5 = 5
  assert.equal(counts.all, 5);
  // 'completed' receives: 6 = 1
  assert.equal(counts.completed, 1);

  // Invariant strictly holds even with invalid/missing dates
  assert.equal(
    counts.today + counts.upcoming,
    counts.all,
    'Today + Upcoming count must strictly equal All open tasks with no orphaned open tasks'
  );
});

test('7. Tasks workspace - compareTasksForExecution multi-criteria sorting', () => {
  const now = new Date();
  const earlierDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  const laterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0);

  const todos = [
    { id: '1', title: 'Low Priority Earlier', priority: 'low', dueDate: earlierDate.toISOString(), createdAt: '2026-11-01', completed: false },
    { id: '2', title: 'High Priority Later', priority: 'high', dueDate: laterDate.toISOString(), createdAt: '2026-11-01', completed: false },
    { id: '3', title: 'Completed Earlier', priority: 'high', dueDate: earlierDate.toISOString(), createdAt: '2026-11-01', completed: true },
    { id: '4', title: 'No Due Date High', priority: 'high', dueDate: null, createdAt: '2026-11-02', completed: false },
  ];

  const sorted = [...todos].sort(compareTasksForExecution);

  assert.equal(sorted[0].id, '1', 'Uncompleted with earlier due date comes first');
  assert.equal(sorted[1].id, '2', 'Uncompleted with later due date comes next');
  assert.equal(sorted[2].id, '4', 'Uncompleted with no due date comes next');
  assert.equal(sorted[3].id, '3', 'Completed task sorted to bottom');
});
