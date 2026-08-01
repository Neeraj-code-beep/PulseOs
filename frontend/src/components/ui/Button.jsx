export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
    secondary:
      'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
    ghost:
      'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]',
    danger:
      'bg-[var(--danger)] text-white hover:opacity-90 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} />
      ) : null}
      {children}
    </button>
  );
};
