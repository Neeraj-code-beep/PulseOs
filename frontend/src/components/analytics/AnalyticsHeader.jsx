import PropTypes from 'prop-types';
import { BarChart2 } from 'lucide-react';

export const AnalyticsHeader = ({ period, onPeriodChange, lastUpdated }) => {
  const periods = [
    { value: 7, label: '7D' },
    { value: 14, label: '14D' },
    { value: 30, label: '30D' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--focus)] shadow-xs">
          <BarChart2 size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Insights
            </h1>
            {lastUpdated && (
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                · Updated just now
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your study rhythm, measured.
          </p>
        </div>
      </div>

      {/* Compact Period Selector */}
      <div
        role="group"
        aria-label="Select focus trend period"
        className="flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] self-start sm:self-auto shadow-xs"
      >
        {periods.map((item) => {
          const isActive = period === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onPeriodChange(item.value)}
              aria-pressed={isActive}
              className={`px-3 py-1 text-xs font-semibold font-mono rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]/50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

AnalyticsHeader.propTypes = {
  period: PropTypes.number.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  lastUpdated: PropTypes.bool,
};
