import { BarChart2, TrendingUp } from 'lucide-react';

export const InsightsPreview = () => {
  const bars = [
    { day: 'Mon', height: '60%' },
    { day: 'Tue', height: '85%' },
    { day: 'Wed', height: '40%' },
    { day: 'Thu', height: '95%' },
    { day: 'Fri', height: '70%' },
    { day: 'Sat', height: '30%' },
    { day: 'Sun', height: '50%' },
  ];

  return (
    <section className="py-14 border-t border-[var(--border)] bg-[var(--bg-surface-elevated)]/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Visual Chart Card */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-md flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-muted)]">
                Weekly Rhythm
              </span>
              <span className="text-xs font-mono text-[var(--focus)] font-semibold flex items-center gap-1">
                <TrendingUp size={14} /> +12% velocity
              </span>
            </div>

            {/* CSS Bar Visualizer */}
            <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
              {bars.map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full bg-[var(--focus)]/80 hover:bg-[var(--focus)] rounded-t transition-all"
                    style={{ height: bar.height }}
                  />
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Narrative */}
        <div className="lg:col-span-6 flex flex-col gap-4 order-1 lg:order-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[var(--focus)] uppercase">
            <BarChart2 size={14} />
            <span>Productivity Analytics</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
            Your rhythm, made visible.
          </h2>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg">
            Track daily study velocity, peak focus windows, and completion trends over time to refine your academic productivity habits.
          </p>
        </div>
      </div>
    </section>
  );
};
