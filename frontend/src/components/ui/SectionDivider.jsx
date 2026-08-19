export const SectionDivider = ({ label, className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center my-8 ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[var(--border-soft)]" />
      </div>
      {label && (
        <span className="relative px-3 bg-[var(--bg-app)] text-[11px] font-mono font-medium text-[var(--text-muted)] uppercase tracking-widest">
          {label}
        </span>
      )}
    </div>
  );
};

export default SectionDivider;
