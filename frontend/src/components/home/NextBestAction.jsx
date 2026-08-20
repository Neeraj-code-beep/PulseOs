import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatDateDisplay, formatEstimate } from '../../utils/taskUtils';
import { FocusContext } from '../../context/FocusContext';
import { SurfaceCard } from '../ui/SurfaceCard';
import { Button } from '../ui/Button';

export const NextBestAction = ({ todos = [], onToggleComplete }) => {
  const navigate = useNavigate();
  const { setSelectedTaskId } = useContext(FocusContext);

  // Filter uncompleted tasks
  const uncompleted = todos.filter((t) => !t.completed);

  if (uncompleted.length === 0) {
    return (
      <SurfaceCard className="p-6 border-dashed border-[var(--border)] text-center flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
          <CheckCircle2 size={20} />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          All active tasks completed!
        </span>
        <p className="text-xs text-[var(--text-secondary)] max-w-sm">
          Great job! Add a new task to your workload or start a custom focus block.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/tasks?add=true')}
          className="mt-1 font-semibold text-xs"
        >
          <span>Add New Assignment</span>
        </Button>
      </SurfaceCard>
    );
  }

  // Deterministic Next Best Action selection algorithm
  const sorted = [...uncompleted].sort((a, b) => {
    const aDateInfo = formatDateDisplay(a.dueDate);
    const bDateInfo = formatDateDisplay(b.dueDate);

    // 1. Overdue tasks take absolute precedence
    if (aDateInfo?.isOverdue && !bDateInfo?.isOverdue) return -1;
    if (!aDateInfo?.isOverdue && bDateInfo?.isOverdue) return 1;

    // 2. Priority weighting (high > medium > low)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    if (pA !== pB) return pB - pA;

    // 3. Due date proximity
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    // 4. Creation time
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  const bestTask = sorted[0];
  const id = bestTask._id || bestTask.id;
  const dateInfo = formatDateDisplay(bestTask.dueDate);
  const estText = formatEstimate(bestTask.estimatedMinutes);

  // Rationale label generator
  const getRationale = () => {
    if (dateInfo?.isOverdue) {
      return { text: 'Overdue Priority', variant: 'danger' };
    }
    if (bestTask.priority === 'high') {
      return { text: 'High Priority Assignment', variant: 'primary' };
    }
    if (dateInfo) {
      return { text: `Due ${dateInfo.label}`, variant: 'accent' };
    }
    return { text: 'Recommended Next Focus Target', variant: 'neutral' };
  };

  const rationale = getRationale();

  const handleStartFocus = () => {
    setSelectedTaskId(id);
    navigate(`/focus?task=${id}`);
  };

  return (
    <SurfaceCard className="p-5 sm:p-6 bg-[var(--bg-surface)] border-[var(--primary)]/40 shadow-sm relative overflow-hidden flex flex-col gap-4">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--primary-soft)]/30 rounded-full blur-2xl pointer-events-none" />

      {/* Rationale Header */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--primary)] shrink-0" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Next Best Action
          </span>
        </div>

        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[var(--radius-sm)] ${
            rationale.variant === 'danger'
              ? 'bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30'
              : rationale.variant === 'primary'
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20'
              : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
          }`}
        >
          {rationale.text}
        </span>
      </div>

      {/* Main Task Title & Context */}
      <div className="flex flex-col gap-2 relative z-10">
        <h3 className="text-base sm:text-lg font-bold font-sans text-[var(--text-primary)] leading-snug">
          {bestTask.title}
        </h3>

        {/* Task Telemetry Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] font-mono pt-1">
          {bestTask.priority && (
            <span className="capitalize font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-soft)]">
              {bestTask.priority} priority
            </span>
          )}

          {estText && (
            <span className="flex items-center gap-1 bg-[var(--bg-surface-elevated)] px-2 py-0.5 rounded-[var(--radius-sm)] border border-[var(--border-soft)]">
              <Clock size={12} className="text-[var(--primary)]" />
              {estText}
            </span>
          )}

          {dateInfo && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] ${
                dateInfo.isOverdue
                  ? 'text-[var(--danger)] font-bold bg-[var(--danger)]/10'
                  : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)]'
              }`}
            >
              {dateInfo.isOverdue && <AlertTriangle size={12} />}
              {dateInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border-soft)] relative z-10">
        <button
          onClick={() => onToggleComplete && onToggleComplete(id, true)}
          className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 size={14} />
          <span>Mark complete</span>
        </button>

        <Button
          variant="primary"
          size="md"
          onClick={handleStartFocus}
          icon={Play}
          className="bg-[var(--focus)] hover:bg-[var(--focus)]/90 shadow-md font-semibold text-xs"
        >
          <span>Start Focus on This Task</span>
          <ArrowRight size={14} />
        </Button>
      </div>
    </SurfaceCard>
  );
};

export default NextBestAction;
