import { motion as Motion, useReducedMotion } from 'framer-motion';

export const FloatingInsight = ({
  icon: Icon,
  title,
  subtitle,
  badgeText,
  badgeVariant = 'primary',
  className = '',
  delay = 0,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const badgeStyles = {
    primary: 'bg-[var(--primary-soft)] text-[var(--primary)]',
    focus: 'bg-[var(--focus-soft)] text-[var(--focus)]',
    accent: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={`p-3 sm:p-3.5 rounded-[var(--radius-lg)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] shadow-md flex items-center gap-3 ${className}`}
    >
      {Icon && (
        <div className="p-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[var(--text-primary)] shrink-0 border border-[var(--border-soft)]">
          <Icon size={16} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)] truncate font-sans">
            {title}
          </span>
          {badgeText && (
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[var(--radius-sm)] shrink-0 ${badgeStyles[badgeVariant]}`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-[var(--text-secondary)] font-mono truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </Motion.div>
  );
};

export default FloatingInsight;
