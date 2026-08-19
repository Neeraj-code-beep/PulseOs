import { useState, useContext, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { TodoContext } from '../context/TodoContext';
import { TaskQuickAdd } from '../components/tasks/TaskQuickAdd';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { TaskEmptyState } from '../components/tasks/TaskEmptyState';
import { TaskEditor } from '../components/tasks/TaskEditor';
import { Button } from '../components/ui/Button';
import { CalendarDays, Clock, Bell, Play } from 'lucide-react';

export const Tasks = () => {
  const navigate = useNavigate();
  const { todos, isLoading, error, fetchTodos, updateTodo, deleteTodo } =
    useContext(TodoContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const autoFocusQuickAdd = searchParams.get('add') === 'true';

  const [activeFilter, setActiveFilter] = useState('today');
  const [editingTask, setEditingTask] = useState(null);

  // Filter counts
  const counts = useMemo(() => {
    const todayCount = todos.filter((t) => {
      if (t.completed) return false;
      if (!t.dueDate) return true;
      const d = new Date(t.dueDate);
      return d <= new Date();
    }).length;

    const upcomingCount = todos.filter((t) => {
      if (t.completed || !t.dueDate) return false;
      return new Date(t.dueDate) > new Date();
    }).length;

    const completedCount = todos.filter((t) => t.completed).length;

    return {
      today: todayCount,
      upcoming: upcomingCount,
      all: todos.filter((t) => !t.completed).length,
      completed: completedCount,
    };
  }, [todos]);

  // Total estimated workload calculation
  const totalWorkloadMins = useMemo(() => {
    return todos
      .filter((t) => !t.completed && t.estimatedMinutes)
      .reduce((acc, curr) => acc + curr.estimatedMinutes, 0);
  }, [todos]);

  // Nearest upcoming reminder
  const nextReminderTodo = useMemo(() => {
    const active = todos
      .filter((t) => t.reminderTime && !t.completed && !t.reminderSent)
      .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
    return active[0] || null;
  }, [todos]);

  // Filtering & Sorting
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    if (activeFilter === 'completed') {
      result = result.filter((t) => t.completed);
    } else {
      result = result.filter((t) => !t.completed);

      if (activeFilter === 'today') {
        result = result.filter((t) => {
          if (!t.dueDate) return true;
          const d = new Date(t.dueDate);
          return d <= new Date();
        });
      } else if (activeFilter === 'upcoming') {
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) > new Date();
        });
      }
    }

    const priorityWeight = { high: 3, medium: 2, low: 1 };

    result.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      if (a.dueDate && b.dueDate) {
        const dA = new Date(a.dueDate).getTime();
        const dB = new Date(b.dueDate).getTime();
        if (dA !== dB) return dA - dB;
      } else if (a.dueDate && !b.dueDate) {
        return -1;
      } else if (!a.dueDate && b.dueDate) {
        return 1;
      }

      const pA = priorityWeight[a.priority] || 2;
      const pB = priorityWeight[b.priority] || 2;
      if (pA !== pB) return pB - pA;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [todos, activeFilter]);

  const handleToggleComplete = async (id, isCompleted) => {
    await updateTodo(id, { completed: isCompleted });
  };

  const handleSaveEditedTask = async (updatedData) => {
    if (!editingTask) return;
    const id = editingTask._id || editingTask.id;
    await updateTodo(id, updatedData);
    setEditingTask(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border-soft)] pb-4 gap-2">
        <div>
          <SectionEyebrow dotColor="var(--primary)">
            Task Workspace
          </SectionEyebrow>
          <EditorialHeading size="sm" className="mt-2">
            Execution Workspace
          </EditorialHeading>
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-mono self-start sm:self-auto">
          <span className="font-bold text-[var(--text-primary)]">{counts.all}</span> open tasks ·{' '}
          <span className="font-bold text-[var(--focus)]">{counts.completed}</span> completed
        </div>
      </div>

      {/* 2-Zone Desktop Layout (70% Left Main Workspace / 30% Right Planning Rail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Main Workspace (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Task Quick Add Composer */}
          <TaskQuickAdd
            autoFocus={autoFocusQuickAdd}
            onComplete={() => {
              if (autoFocusQuickAdd) setSearchParams({});
            }}
          />

          {/* Filter Bar */}
          <TaskFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-[var(--radius-md)] text-center flex flex-col items-center gap-2">
              <p className="text-xs font-semibold text-[var(--danger)]">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchTodos}>
                Retry
              </Button>
            </div>
          ) : filteredTodos.length === 0 ? (
            <TaskEmptyState
              activeFilter={activeFilter}
              onAddClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onClearFilters={() => setActiveFilter('all')}
            />
          ) : (
            <TaskList
              todos={filteredTodos}
              onToggleComplete={handleToggleComplete}
              onDelete={deleteTodo}
              onEdit={setEditingTask}
            />
          )}

          {/* Productivity Footer Hint below list */}
          <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
            <span>{counts.all} tasks remaining</span>
            <span>Press Escape to dismiss modals</span>
          </div>
        </div>

        {/* Right Planning Rail (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Workload Summary Box */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
              Workload Summary
            </span>

            <div className="flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-sans">
                  <CalendarDays size={14} className="text-[var(--primary)]" />
                  Due Today
                </span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {counts.today}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-sans">
                  <Clock size={14} className="text-[var(--focus)]" />
                  Total Workload
                </span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {totalWorkloadMins > 0
                    ? `${Math.floor(totalWorkloadMins / 60)}h ${totalWorkloadMins % 60}m`
                    : 'Unestimated'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5 font-sans">
                  <Bell size={14} className="text-[var(--accent)]" />
                  Next Reminder
                </span>
                <span className="font-mono text-[var(--text-primary)]">
                  {nextReminderTodo
                    ? new Date(nextReminderTodo.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'None'}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={Play}
              onClick={() => navigate('/focus')}
              className="mt-2 w-full bg-[var(--focus)] hover:bg-[var(--focus)]/90 py-2.5 shadow-xs"
            >
              Start Focus Session
            </Button>
          </div>
        </div>
      </div>

      {/* Task Editor Modal */}
      {editingTask && (
        <TaskEditor
          task={editingTask}
          onSave={handleSaveEditedTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
};
