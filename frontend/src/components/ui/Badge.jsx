export const Badge = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default:
      'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)]',
    primary:
      'bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20',
    accent:
      'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/30',
    success:
      'bg-[var(--focus-soft)] text-[var(--focus)] border border-[var(--focus)]/20',
    warning:
      'bg-[var(--accent-soft)] text-[var(--warning)] border border-[var(--warning)]/20',
    danger:
      'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
