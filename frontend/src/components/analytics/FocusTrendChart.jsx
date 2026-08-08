import PropTypes from 'prop-types';
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Custom Tooltip component adhering to Warm Editorial surface theme.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const mins = data.focusMinutes || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeText = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;

    return (
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] p-2.5 shadow-md text-xs flex flex-col gap-1">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
          {data.label} · {data.date}
        </span>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--focus)]" />
          <span className="font-semibold text-[var(--text-primary)]">{timeText} focused</span>
          <span>({data.sessions || 0} {data.sessions === 1 ? 'session' : 'sessions'})</span>
        </div>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

export const FocusTrendChart = ({ trendData, period, loading, error, onRetry }) => {
  // Compute strongest day from trend data
  const strongestDayInfo = useMemo(() => {
    if (!trendData || !trendData.points || trendData.points.length === 0) {
      return null;
    }
    let max = null;
    for (const pt of trendData.points) {
      if (pt.focusMinutes > 0) {
        if (!max || pt.focusMinutes > max.focusMinutes) {
          max = pt;
        }
      }
    }
    return max;
  }, [trendData]);

  // Format strongest day label
  const microSummary = useMemo(() => {
    if (!strongestDayInfo) {
      return 'Your rhythm will appear here once you complete a focus session.';
    }
    const mins = strongestDayInfo.focusMinutes;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const duration = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    return `Your strongest day was ${strongestDayInfo.label} with ${duration} of focus.`;
  }, [strongestDayInfo]);

  // Generate accessible description text for screen readers
  const accessibleSummary = useMemo(() => {
    if (!trendData?.points?.length) return 'No focus trend data available.';
    const activeDays = trendData.points.filter((p) => p.focusMinutes > 0);
    return `Focus trend for past ${period} days. ${activeDays.length} active days recorded. ${microSummary}`;
  }, [trendData, period, microSummary]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-soft)] pb-4">
        <div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            YOUR STUDY RHYTHM
          </span>
          <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
            Focus time across the last {period} days
          </h2>
        </div>
      </div>

      {/* Screen Reader Accessible Summary */}
      <div className="sr-only" aria-live="polite">
        {accessibleSummary}
      </div>

      {/* Chart Body */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
          <RefreshCw size={20} className="animate-spin text-[var(--focus)]" />
          <span className="text-xs font-medium">Loading study rhythm chart...</span>
        </div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2 text-center p-4">
          <AlertCircle size={22} className="text-red-500" />
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Could not load focus trend chart
          </span>
          <p className="text-[11px] text-[var(--text-secondary)] max-w-xs">{error}</p>
          <button
            onClick={onRetry}
            className="mt-1 px-3 py-1 text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer"
          >
            Retry Chart
          </button>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData?.points || []}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border-soft)"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: 'var(--border)' }}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontFamily: 'DM Sans' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                unit="m"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface-elevated)', opacity: 0.6 }} />
              <Bar dataKey="focusMinutes" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {(trendData?.points || []).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.focusMinutes > 0 ? 'var(--focus)' : 'var(--border-soft)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Micro-Summary Footer */}
      {!loading && !error && (
        <div className="pt-3 border-t border-[var(--border-soft)] flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)]" />
          <span>{microSummary}</span>
        </div>
      )}
    </div>
  );
};

FocusTrendChart.propTypes = {
  trendData: PropTypes.shape({
    days: PropTypes.number,
    points: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        label: PropTypes.string,
        focusMinutes: PropTypes.number,
        sessions: PropTypes.number,
      })
    ),
  }),
  period: PropTypes.number.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
