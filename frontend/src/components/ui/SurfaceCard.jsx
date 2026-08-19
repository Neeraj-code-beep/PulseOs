export const SurfaceCard = ({
  children,
  className = '',
  elevation = 'base',
  bordered = true,
  hoverable = false,
  ...props
}) => {
  const elevations = {
    subtle: 'bg-[var(--bg-surface-elevated)]',
    base: 'bg-[var(--bg-surface)]',
    elevated: 'bg-[var(--bg-surface-elevated)] shadow-md',
  };

  const borderStyle = bordered ? 'border border-[var(--border)]' : '';
  const hoverStyle = hoverable
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[var(--border-strong,var(--text-muted))]'
    : '';

  return (
    <div
      className={`rounded-[var(--radius-lg)] p-5 ${elevations[elevation]} ${borderStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
