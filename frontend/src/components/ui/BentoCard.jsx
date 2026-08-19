export const BentoCard = ({
  children,
  colSpan = 'col-span-12',
  lgColSpan = 'lg:col-span-6',
  className = '',
  featured = false,
}) => {
  return (
    <div
      className={`${colSpan} ${lgColSpan} rounded-[var(--radius-xl)] bg-[var(--bg-surface)] border ${
        featured ? 'border-[var(--primary)]/40 shadow-md' : 'border-[var(--border)] shadow-xs'
      } p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 hover:border-[var(--text-muted)] ${className}`}
    >
      {children}
    </div>
  );
};
