export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
