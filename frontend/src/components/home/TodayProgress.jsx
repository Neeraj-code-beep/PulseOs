import { SurfaceCard } from '../ui/SurfaceCard';
import { MetricPill } from '../ui/MetricPill';

export const TodayProgress = ({ todos = [] }) => {
  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const openCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <SurfaceCard className="p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          Today's Telemetry Progress
        </span>
        <span className="text-xs font-mono font-bold text-[var(--primary)]">
          {progressPercent}% Complete
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden border border-[var(--border-soft)]">
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--focus)] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Metric Summary Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <MetricPill label="Finished" value={completedCount} variant="focus" />
        <MetricPill label="Remaining" value={openCount} variant="primary" />
        <MetricPill label="Total Tasks" value={totalCount} variant="neutral" />
      </div>
    </SurfaceCard>
  );
};

export default TodayProgress;
