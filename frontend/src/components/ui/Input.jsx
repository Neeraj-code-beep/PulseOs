export const Input = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm transition-all focus:border-[var(--primary)] focus:outline-none disabled:opacity-50 ${
          error ? 'border-[var(--danger)]' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
};
