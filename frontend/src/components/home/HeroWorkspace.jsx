import { ArrowRight, Play, Check } from 'lucide-react';

export const HeroWorkspace = ({ openCount, completedCount, onPlanClick, onFocusClick }) => {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[var(--focus)]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Editorial Copy & CTA */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] text-xs font-mono text-[var(--text-secondary)] self-start">
            <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>PRODUCTIVITY OPERATING SYSTEM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] leading-[1.1]">
            Make today <br />
            <span className="text-[var(--primary)]">count.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl leading-relaxed">
            Plan your workload, protect your focus, and build realistic study routines designed for student life.
          </p>

          {/* Quick Dynamic Metric Bar */}
          <div className="flex items-center gap-6 py-2 font-mono text-xs text-[var(--text-muted)] border-y border-[var(--border-soft)] max-w-md">
            <div>
              <span className="text-base font-bold text-[var(--text-primary)]">{openCount}</span> open tasks
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div>
              <span className="text-base font-bold text-[var(--focus)]">{completedCount}</span> completed
            </div>
            <div className="w-px h-4 bg-[var(--border)]" />
            <div>
              <span className="text-base font-bold text-[var(--accent)]">25m</span> focus block
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onPlanClick}
              className="px-6 py-3 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-[var(--radius-md)] text-sm font-semibold transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              <span>Plan my day</span>
              <ArrowRight size={16} />
            </button>
            <button
              onClick={onFocusClick}
              className="px-6 py-3 bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--text-muted)] rounded-[var(--radius-md)] text-sm font-semibold transition-all shadow-xs hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
            >
              <Play size={15} className="text-[var(--focus)]" />
              <span>Start focus</span>
            </button>
          </div>
        </div>

        {/* Right Pulse Board Interactive Composition */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-sm aspect-square bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-xl flex flex-col justify-between overflow-hidden">
            {/* Top Widget: Focus Ring Ornament */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[var(--text-muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--focus)]" />
                Focus Mode
              </div>
              <span className="text-xs font-mono font-bold text-[var(--focus)]">25:00</span>
            </div>

            {/* Middle Widget: Simulated Live Task Card Stack */}
            <div className="flex flex-col gap-2.5 my-auto">
              <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-[var(--focus)] bg-[var(--focus)] text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium line-through text-[var(--text-muted)]">
                    Database schema review
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--focus)]">Done</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface)] border border-[var(--primary)]/40 rounded-[var(--radius-md)] shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-[var(--primary)]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Operating Systems assignment
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--primary)]">45m</span>
              </div>

              <div className="p-3 bg-[var(--bg-surface-elevated)]/60 border border-[var(--border-soft)] rounded-[var(--radius-md)] flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full border border-[var(--border-strong)]" />
                  <span className="text-xs text-[var(--text-secondary)]">
                    Algorithms problem set 4
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">Tomorrow</span>
              </div>
            </div>

            {/* Bottom Widget: Progress summary */}
            <div className="pt-3 border-t border-[var(--border-soft)] flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
              <span>Daily Target</span>
              <span className="text-[var(--text-primary)] font-bold">65% Completed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
