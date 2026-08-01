import { formatDateDisplay, formatEstimate } from '../../utils/taskUtils';
import { ArrowRight, Clock, Plus, Check, Play, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DailyWorkspace = ({ todos, isLoading, onToggleComplete, nextReminderTodo }) => {
  const navigate = useNavigate();

  const todayTodos = todos.filter((t) => {
    if (t.completed) return false;
    if (!t.dueDate) return true;
    const d = new Date(t.dueDate);
    return d <= new Date();
  });

  const completedToday = todos.filter((t) => t.completed);
  const totalToday = todayTodos.length + completedToday.length;
  const progressPercent = totalToday > 0 ? Math.round((completedToday.length / totalToday) * 100) : 0;

  return (
    <section className="py-10 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Daily Workspace
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
              Today's Execution Plan
            </h2>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-semibold flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Open workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Task List Surface (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* Progress Header Bar */}
            {totalToday > 0 && (
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-1">
                <span>{completedToday.length} of {totalToday} tasks finished</span>
                <span>{progressPercent}%</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-[var(--bg-surface)] rounded-[var(--radius-md)] animate-pulse" />
                ))}
              </div>
            ) : todayTodos.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] p-6 bg-[var(--bg-surface)]">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Your schedule is clear for today.
                </span>
                <p className="text-xs text-[var(--text-muted)] max-w-sm">
                  Add an upcoming assignment or take time out to recharge.
                </p>
                <button
                  onClick={() => navigate('/tasks?add=true')}
                  className="mt-1 px-4 py-2 bg-[var(--primary)] text-white rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add a task</span>
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] divide-y divide-[var(--border-soft)] shadow-xs overflow-hidden">
                {todayTodos.slice(0, 6).map((todo) => {
                  const id = todo._id || todo.id;
                  const dateInfo = formatDateDisplay(todo.dueDate);
                  const estText = formatEstimate(todo.estimatedMinutes);

                  return (
                    <div
                      key={id}
                      className="group flex items-center justify-between px-4 py-3.5 hover:bg-[var(--bg-surface-elevated)] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => onToggleComplete(id, true)}
                          className="w-4 h-4 rounded-full border border-[var(--border-strong)] group-hover:border-[var(--primary)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          aria-label={`Complete ${todo.title}`}
                        >
                          <Check size={10} className="text-transparent group-hover:text-[var(--primary)]" />
                        </button>
                        <span className="text-sm text-[var(--text-primary)] font-medium truncate">
                          {todo.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0 pl-2 font-mono">
                        {dateInfo && dateInfo.isOverdue && (
                          <span className="text-[var(--danger)] text-[11px] font-semibold">Overdue</span>
                        )}
                        {estText && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {estText}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Rail (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Focus Instrument Module */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Focus Mode</span>
                <span className="w-2 h-2 rounded-full bg-[var(--focus)]" />
              </div>
              <div className="text-3xl font-bold font-timer text-[var(--text-primary)] tracking-tight">
                25:00
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Target one task without context switching.
              </p>
              <button
                onClick={() => {
                  const nextTask = todayTodos[0] || todos.find((t) => !t.completed);
                  const nextId = nextTask ? (nextTask._id || nextTask.id) : null;
                  navigate(nextId ? `/focus?task=${nextId}` : '/focus');
                }}
                className="w-full py-2 px-3 bg-[var(--focus)] text-white hover:bg-[var(--focus)]/90 rounded-[var(--radius-md)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Play size={14} fill="currentColor" />
                <span>Start Focus Session</span>
              </button>
            </div>

            {/* Upcoming Reminder Surface */}
            <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-lg)] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Bell size={14} className="text-[var(--accent)]" />
                <span className="font-medium">Next Reminder</span>
              </div>
              <span className="font-mono text-[var(--text-primary)]">
                {nextReminderTodo
                  ? new Date(nextReminderTodo.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'None scheduled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
