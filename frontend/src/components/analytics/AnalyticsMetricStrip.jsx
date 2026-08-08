import PropTypes from 'prop-types';
import { motion as Motion, useReducedMotion } from 'framer-motion';

const formatDuration = (mins) => {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const AnalyticsMetricStrip = ({ overview, loading, error }) => {
  const shouldReduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 grid grid-cols-2 sm:grid-cols-5 gap-4 animate-pulse shadow-xs">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-3 w-16 bg-[var(--border-soft)] rounded" />
            <div className="h-8 w-24 bg-[var(--border)] rounded" />
            <div className="h-3 w-20 bg-[var(--border-soft)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !overview) {
    return null;
  }

  const metrics = [
    { label: 'FOCUS TODAY', value: formatDuration(overview.focusTodayMinutes), sub: `${overview.sessionsToday || 0} session(s) today` },
    { label: 'FOCUS THIS WEEK', value: formatDuration(overview.focusWeekMinutes), sub: 'Mon – Sun total' },
    { label: 'SESSIONS', value: overview.sessionsWeek || 0, sub: 'this week' },
    { label: 'TASKS DONE', value: overview.completedTasksWeek || 0, sub: 'completed this week' },
    { label: 'AVERAGE BLOCK', value: formatDuration(overview.averageSessionMinutes), sub: 'per session' },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-y-4 gap-x-2 relative divide-y sm:divide-y-0 sm:divide-x divide-[var(--border-soft)]"
    >
      {metrics.map((item, idx) => (
        <Motion.div
          key={item.label}
          variants={itemVariants}
          className={`flex flex-col gap-1 ${idx > 0 ? 'sm:pl-4' : ''} ${idx >= 2 && idx % 2 === 0 ? 'pt-3 sm:pt-0' : idx > 0 ? 'pt-3 sm:pt-0' : ''}`}
        >
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            {item.label}
          </span>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] font-mono">
            {item.value}
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            {item.sub}
          </span>
        </Motion.div>
      ))}
    </Motion.div>
  );
};

AnalyticsMetricStrip.propTypes = {
  overview: PropTypes.shape({
    focusTodayMinutes: PropTypes.number,
    focusWeekMinutes: PropTypes.number,
    completedTasksToday: PropTypes.number,
    completedTasksWeek: PropTypes.number,
    sessionsToday: PropTypes.number,
    sessionsWeek: PropTypes.number,
    averageSessionMinutes: PropTypes.number,
    totalFocusMinutes: PropTypes.number,
  }),
  loading: PropTypes.bool,
  error: PropTypes.string,
};
