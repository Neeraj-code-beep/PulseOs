import { formatDateDisplay, formatEstimate } from '../../utils/taskUtils';
import { ArrowRight, Clock, Plus, Check, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SurfaceCard } from '../ui/SurfaceCard';
import { Button } from '../ui/Button';

export const DailyWorkspace = ({ todos = [], isLoading = false, onToggleComplete }) => {
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
    <div className="flex flex-col gap-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <SectionEyebrow dotColor="var(--focus)">
            Daily Execution
          </SectionEyebrow>
          <EditorialHeading size="sm" className="mt-2">
            Today's Execution Plan
          </EditorialHeading>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tasks')}
          className="self-start sm:self-auto font-semibold text-xs text-[var(--primary)]"
        >
          <span>Open Tasks Workspace</span>
          <ArrowRight size={14} />
        </Button>
      </div>

      {/* Execution Progress & Task List */}
      <div className="flex flex-col gap-3">
        {totalToday > 0 && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
            <span>{completedToday.length} of {totalToday} tasks finished</span>
            <span>{progressPercent}% completed</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] animate-pulse" />
            ))}
          </div>
        ) : todayTodos.length === 0 ? (
          <SurfaceCard className="py-12 text-center flex flex-col items-center gap-3 border-dashed border-[var(--border)]">
            <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Your schedule is clear for today.
            </span>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Add an upcoming assignment or take time out to recharge.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/tasks?add=true')}
              icon={Plus}
              className="mt-1"
            >
              Add a task
            </Button>
          </SurfaceCard>
        ) : (
          <SurfaceCard className="p-0 divide-y divide-[var(--border-soft)] shadow-xs overflow-hidden">
            {todayTodos.slice(0, 8).map((todo) => {
              const id = todo._id || todo.id;
              const dateInfo = formatDateDisplay(todo.dueDate);
              const estText = formatEstimate(todo.estimatedMinutes);

              return (
                <div
                  key={id}
                  className="group flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-[var(--bg-surface-elevated)] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleComplete(id, true)}
                      className="w-4.5 h-4.5 rounded-full border border-[var(--border-strong)] group-hover:border-[var(--primary)] group-hover:bg-[var(--primary-soft)] flex items-center justify-center transition-all cursor-pointer shrink-0"
                      aria-label={`Complete ${todo.title}`}
                    >
                      <Check size={11} className="text-transparent group-hover:text-[var(--primary)]" />
                    </button>
                    <span className="text-xs sm:text-sm text-[var(--text-primary)] font-medium truncate font-sans">
                      {todo.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0 pl-2 font-mono">
                    {dateInfo && dateInfo.isOverdue && (
                      <span className="text-[var(--danger)] text-[11px] font-semibold bg-[var(--danger)]/10 px-2 py-0.5 rounded-[var(--radius-sm)]">Overdue</span>
                    )}
                    {estText && (
                      <span className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-soft)]">
                        <Clock size={12} className="text-[var(--primary)]" />
                        {estText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </SurfaceCard>
        )}
      </div>
    </div>
  );
};

