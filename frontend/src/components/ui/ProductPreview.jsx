export const ProductPreview = ({
  children,
  title,
  action,
  className = '',
}) => {
  return (
    <div
      className={`rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border border-[var(--border)] p-4 sm:p-6 shadow-lg overflow-hidden flex flex-col gap-4 relative ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
          {title && (
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-muted)]">
              {title}
            </span>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
};
