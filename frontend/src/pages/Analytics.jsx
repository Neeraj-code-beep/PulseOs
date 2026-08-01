import { BarChart2 } from 'lucide-react';

export const Analytics = () => {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-4">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Insights
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Study velocity and focus trends
        </p>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-10 text-center flex flex-col items-center justify-center gap-4 shadow-xs">
        <div className="p-3 bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] rounded-full">
          <BarChart2 size={24} />
        </div>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          No study data recorded yet
        </span>
        <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed">
          Productivity insights and focus charts will appear here as you complete study sessions.
        </p>
      </div>
    </div>
  );
};
