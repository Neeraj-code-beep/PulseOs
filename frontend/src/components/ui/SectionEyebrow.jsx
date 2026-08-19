export const SectionEyebrow = ({
  children,
  dotColor = 'var(--primary)',
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] text-[11px] font-mono font-medium text-[var(--text-secondary)] uppercase tracking-wider ${className}`}
    >
      {dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: dotColor }}
        />
      )}
      <span>{children}</span>
    </div>
  );
};

export default SectionEyebrow;
