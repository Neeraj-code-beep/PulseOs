import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 border-t border-[var(--border)]">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
          Ready for your next focus block?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          Plan your assignments now or start a distraction-free study session immediately.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/tasks?add=true')}
            className="px-6 py-3 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md transition-all hover:-translate-y-0.5"
          >
            <span>Add a task</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/focus')}
            className="px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] rounded-[var(--radius-md)] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:-translate-y-0.5"
          >
            <Play size={14} className="text-[var(--focus)]" />
            <span>Start focus</span>
          </button>
        </div>
      </div>
    </section>
  );
};
