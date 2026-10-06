import { motion as Motion, useReducedMotion } from 'framer-motion';

export const TaskFilters = ({ activeFilter, onFilterChange, counts }) => {
  const shouldReduceMotion = useReducedMotion();

  const filters = [
    { id: 'today', label: 'Today', count: counts.today },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'all', label: 'All Tasks', count: counts.all },
    { id: 'completed', label: 'Completed', count: counts.completed },
  ];

  return (
    <div className="flex items-center gap-4 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={`relative flex items-center gap-1.5 pb-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && filter.count > 0 && (
              <span className={`text-[11px] font-mono ${isActive ? 'text-[var(--primary)] font-bold' : 'text-[var(--text-muted)]'}`}>
                {filter.count}
              </span>
            )}

            {isActive && (
              <Motion.div
                layoutId={shouldReduceMotion ? undefined : 'activeTaskFilterLine'}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] rounded-full"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
