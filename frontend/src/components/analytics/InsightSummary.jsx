import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { Compass } from 'lucide-react';

const formatDuration = (mins) => {
  if (!mins || mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const InsightSummary = ({ overview, performance, trendData }) => {
  const insights = useMemo(() => {
    const list = [];

    // Focus today note
    const todayMins = overview?.focusTodayMinutes || 0;
    if (todayMins === 0) {
      list.push('No focus time recorded today yet.');
    } else {
      list.push(`You've focused for ${formatDuration(todayMins)} today across ${overview?.sessionsToday || 0} session(s).`);
    }

    // Strongest day note from trend
    if (trendData?.points?.length) {
      let maxPt = null;
      for (const pt of trendData.points) {
        if (pt.focusMinutes > 0 && (!maxPt || pt.focusMinutes > maxPt.focusMinutes)) {
          maxPt = pt;
        }
      }
      if (maxPt) {
        list.push(`${maxPt.label} was your strongest focus day this period (${formatDuration(maxPt.focusMinutes)}).`);
      }
    }

    // Task completion rate note
    const rate = performance?.completionRate;
    if (typeof rate === 'number' && rate > 0) {
      if (rate >= 80) {
        list.push("You're closing out tasks consistently with an 80%+ completion rate.");
      } else if (rate < 40) {
        list.push('Try planning fewer tasks and finishing them before adding more.');
      } else {
        list.push(`Your task completion rate is currently ${rate}%.`);
      }
    }

    return list;
  }, [overview, performance, trendData]);

  if (!overview && !performance && !trendData) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-[var(--bg-surface-elevated)] text-[var(--accent)] border border-[var(--border-soft)] rounded-full">
          <Compass size={16} />
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
          YOUR RHYTHM
        </span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        {insights.map((text, idx) => (
          <div key={idx} className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
            <span className="text-[var(--focus)] font-bold mt-0.5">•</span>
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

InsightSummary.propTypes = {
  overview: PropTypes.shape({
    focusTodayMinutes: PropTypes.number,
    sessionsToday: PropTypes.number,
  }),
  performance: PropTypes.shape({
    completionRate: PropTypes.number,
  }),
  trendData: PropTypes.shape({
    points: PropTypes.array,
  }),
};
