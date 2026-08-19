import { BarChart2, TrendingUp } from 'lucide-react';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SurfaceCard } from '../ui/SurfaceCard';

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
    <section className="py-12 border-t border-[var(--border-soft)] bg-[var(--bg-surface-elevated)]/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Visual Chart Surface */}
        <div className="lg:col-span-6 flex justify-center order-2 lg:order-1">
          <SurfaceCard className="w-full max-w-md p-6 shadow-md flex flex-col gap-4 border-[var(--border)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
              <span className="text-xs font-bold font-mono tracking-wider uppercase text-[var(--text-muted)]">
                Weekly Study Rhythm
              </span>
              <span className="text-xs font-mono text-[var(--focus)] font-semibold flex items-center gap-1">
                <TrendingUp size={14} /> +12% focus score
              </span>
            </div>

            {/* CSS Bar Visualizer */}
            <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
              {bars.map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full bg-[var(--focus)]/85 hover:bg-[var(--focus)] rounded-t transition-all"
                    style={{ height: bar.height }}
                  />
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{bar.day}</span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Right Narrative Column */}
        <div className="lg:col-span-6 flex flex-col gap-4 order-1 lg:order-2">
          <SectionEyebrow dotColor="var(--accent)">
            Productivity Telemetry
          </SectionEyebrow>

          <EditorialHeading size="md">
            Your rhythm, made visible.
          </EditorialHeading>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg font-sans">
            Track daily study velocity, peak focus windows, and completion patterns over time to refine your academic habits with hard empirical data.
          </p>
        </div>
      </div>
    </section>
  );
};
