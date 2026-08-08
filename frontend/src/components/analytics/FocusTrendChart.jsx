import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
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
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Refined Custom Tooltip adhering strictly to Warm Editorial surface tokens.
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const mins = data.focusMinutes || 0;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const timeText = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;

    return (
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] p-3 shadow-md text-xs flex flex-col gap-1.5 transition-all">
        <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
          {data.label} · {data.date}
        </span>
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-[var(--focus)]" />
          <span className="font-semibold text-[var(--text-primary)] font-mono">{timeText} focused</span>
          <span className="text-[var(--text-muted)]">({data.sessions || 0} {data.sessions === 1 ? 'session' : 'sessions'})</span>
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
  const [activeIndex, setActiveIndex] = useState(null);

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

  // Format strongest rhythm summary
  const strongestSummary = useMemo(() => {
    if (!strongestDayInfo) {
      return 'Your rhythm will appear here once you complete a focus session.';
    }
    const mins = strongestDayInfo.focusMinutes;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const duration = h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
    return `Strongest rhythm · ${strongestDayInfo.label} (${duration})`;
  }, [strongestDayInfo]);

  // Accessible summary for screen readers
  const accessibleSummary = useMemo(() => {
    if (!trendData?.points?.length) return 'No focus trend data available.';
    const activeDays = trendData.points.filter((p) => p.focusMinutes > 0);
    return `Focus trend for past ${period} days. ${activeDays.length} active study days recorded. ${strongestSummary}`;
  }, [trendData, period, strongestSummary]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
        <div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            YOUR STUDY RHYTHM
          </span>
          <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
            Focus time across the last {period} days
          </h2>
        </div>
      </div>

      {/* Accessible Summary */}
      <div className="sr-only" aria-live="polite">
        {accessibleSummary}
      </div>

      {/* Chart Body */}
      {loading ? (
        <div className="h-72 sm:h-80 w-full bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] p-6 flex flex-col justify-end gap-3 animate-pulse">
          <div className="flex items-end justify-between h-48 gap-2 px-2">
            {[...Array(period === 30 ? 15 : period)].map((_, i) => (
              <div
                key={i}
                className="w-full bg-[var(--border-soft)] rounded-t"
                style={{ height: `${Math.max(15, (i * 17) % 80)}%` }}
              />
            ))}
          </div>
          <div className="h-3 w-full bg-[var(--border-soft)] rounded" />
        </div>
      ) : error ? (
        <div className="h-72 sm:h-80 flex flex-col items-center justify-center gap-2 text-center p-6 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)]">
          <AlertCircle size={22} className="text-red-500" />
          <span className="text-xs font-bold text-[var(--text-primary)]">
            Unable to load study rhythm
          </span>
          <p className="text-[11px] text-[var(--text-secondary)] max-w-xs leading-relaxed">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer transition-colors"
          >
            Retry Chart
          </button>
        </div>
      ) : (
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={trendData?.points || []}
              margin={{ top: 12, right: 8, left: -20, bottom: 0 }}
              onMouseMove={(state) => {
                if (state.isTooltipActive) {
                  setActiveIndex(state.activeTooltipIndex);
                } else {
                  setActiveIndex(null);
                }
              }}
              onMouseLeave={() => setActiveIndex(null)}
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
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--bg-surface-elevated)', opacity: 0.6 }}
              />
              <Bar dataKey="focusMinutes" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {(trendData?.points || []).map((entry, index) => {
                  const isHovered = activeIndex === index;
                  const hasMinutes = entry.focusMinutes > 0;

                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        hasMinutes
                          ? isHovered
                            ? 'var(--focus)'
                            : 'var(--focus)'
                          : 'var(--border-soft)'
                      }
                      opacity={
                        activeIndex === null
                          ? 1
                          : isHovered
                          ? 1
                          : 0.65
                      }
                      style={{
                        filter: isHovered && hasMinutes ? 'brightness(1.12)' : 'none',
                        transition: 'opacity 150ms ease, filter 150ms ease',
                      }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Micro-Summary Footer */}
      {!loading && !error && (
        <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)]" />
            <span className="font-medium">{strongestSummary}</span>
          </div>
          {strongestDayInfo && (
            <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
              Peak performance
            </span>
          )}
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
