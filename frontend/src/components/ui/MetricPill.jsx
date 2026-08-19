export const MetricPill = ({
  label,
  value,
  variant = 'neutral',
  className = '',
}) => {
  const variants = {
    neutral: 'text-[var(--text-primary)]',
    primary: 'text-[var(--primary)]',
    focus: 'text-[var(--focus)]',
    accent: 'text-[var(--accent)]',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] font-mono text-xs ${className}`}
    >
      <span className={`font-bold ${variants[variant]}`}>{value}</span>
      <span className="text-[var(--text-muted)] text-[11px] uppercase tracking-wider">{label}</span>
    </div>
  );
};
