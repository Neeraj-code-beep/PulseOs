import { Timer, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FocusPreview = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Instrument Visual Display */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-8 shadow-xl flex flex-col items-center text-center gap-6 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--focus-soft)] text-[var(--focus)] text-[11px] font-mono font-semibold">
              <ShieldCheck size={13} />
              <span>Distraction Free</span>
            </div>

            <div className="p-4 rounded-full bg-[var(--focus-soft)] text-[var(--focus)] mt-2">
              <Timer size={32} />
            </div>

            <div>
              <div className="text-5xl sm:text-6xl font-bold font-timer tracking-tight text-[var(--text-primary)]">
                25:00
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono mt-1 block">
                Pomodoro Cycle · 5m Rest
              </span>
            </div>

            {/* Target Task Binding Preview */}
            <div className="w-full p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs text-left flex items-center justify-between">
              <span className="text-[var(--text-muted)] font-medium">Active task:</span>
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                Operating Systems assignment
              </span>
            </div>

            <button
              onClick={() => navigate('/focus')}
              className="w-full py-3 bg-[var(--focus)] text-white hover:bg-[var(--focus)]/90 rounded-[var(--radius-md)] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:-translate-y-0.5"
            >
              <span>Launch Focus Session</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Narrative Copy */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[var(--focus)] uppercase">
            <Flame size={14} />
            <span>Deep Work Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            One task. One timer. <br />
            Zero distractions.
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
            When you're ready to study, attach a task directly to the timer. PulseOS handles time tracking and session logging so you can focus entirely on completing your work.
          </p>

          <ul className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] font-medium pt-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)]" />
              <span>Standard 25-minute Pomodoro or custom focus intervals</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)]" />
              <span>Direct binding to active daily tasks</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)]" />
              <span>Automatic study duration logging</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
