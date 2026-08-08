import PropTypes from 'prop-types';
import { AlertCircle } from 'lucide-react';

const formatDuration = (mins) => {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const TaskPerformance = ({ performance, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-4 animate-pulse">
        <div className="h-4 w-36 bg-[var(--border-soft)] rounded" />
        <div className="h-28 bg-[var(--border-soft)] rounded" />
        <div className="h-16 bg-[var(--border-soft)] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col items-center justify-center gap-2 text-center">
        <AlertCircle size={20} className="text-red-500" />
        <span className="text-xs font-bold text-[var(--text-primary)]">
          Could not load workload comparison
        </span>
        <p className="text-[11px] text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1 text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const planned = performance?.plannedMinutes || 0;
  const focused = performance?.focusedMinutes || 0;
  const completionRate = performance?.completionRate || 0;
  const ratio = performance?.plannedVsActualRatio || 0;

  // Comparative bar width calculations
  const maxVal = Math.max(planned, focused, 1);
  const plannedPercent = Math.min(Math.round((planned / maxVal) * 100), 100);
  const focusedPercent = Math.min(Math.round((focused / maxVal) * 100), 100);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-5 justify-between">
      <div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
          PLANNING VS EXECUTION
        </span>
        <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
          Workload comparison & completion rate
        </h2>
      </div>

      {/* Comparison Visual */}
      {planned === 0 ? (
        <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs text-[var(--text-muted)] text-center flex flex-col gap-1">
          <span className="font-semibold text-[var(--text-secondary)]">No planned estimates set on tasks yet.</span>
          <span className="text-[11px]">Add estimated minutes when creating tasks to see workload comparisons.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)]">
          {/* Planned bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[var(--text-secondary)] font-mono">PLANNED WORKLOAD</span>
              <span className="text-[var(--text-primary)] font-bold font-mono">{formatDuration(planned)}</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--border-soft)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--border)] transition-all duration-500 rounded-full"
                style={{ width: `${plannedPercent}%` }}
              />
            </div>
          </div>

          {/* Focused bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-[var(--text-secondary)] font-mono">FOCUSED EXECUTION</span>
              <span className="text-[var(--focus)] font-bold font-mono">{formatDuration(focused)}</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--border-soft)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--focus)] transition-all duration-500 rounded-full"
                style={{ width: `${focusedPercent}%` }}
              />
            </div>
          </div>

          {/* Ratio & Note */}
          <div className="pt-2 border-t border-[var(--border-soft)] flex flex-col gap-0.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Planned vs Actual ratio:</span>
              <span className="font-bold font-mono text-[var(--text-primary)]">{ratio}x</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] italic">
              Recorded focus time against estimated workload.
            </span>
          </div>
        </div>
      )}

      {/* Completion Rate Indicator */}
      <div className="flex items-center justify-between p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            {completionRate}%
          </span>
          <span className="text-xs text-[var(--text-secondary)]">Task completion rate</span>
        </div>
        <div className="w-20 h-2 bg-[var(--border-soft)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
};

TaskPerformance.propTypes = {
  performance: PropTypes.shape({
    plannedMinutes: PropTypes.number,
    focusedMinutes: PropTypes.number,
    completionRate: PropTypes.number,
    plannedVsActualRatio: PropTypes.number,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
