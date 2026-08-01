export const TaskFilters = ({ activeFilter, onFilterChange, counts }) => {
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
            onClick={() => onFilterChange(filter.id)}
            className={`relative flex items-center gap-1.5 pb-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-[var(--text-primary)] font-semibold border-b-2 border-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            <span>{filter.label}</span>
            {filter.count !== undefined && filter.count > 0 && (
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
