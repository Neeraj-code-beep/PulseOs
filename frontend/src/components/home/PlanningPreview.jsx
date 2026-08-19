import { Sparkles, ListTree } from 'lucide-react';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SurfaceCard } from '../ui/SurfaceCard';

export const PlanningPreview = () => {
  const steps = [
    { title: 'Research & Sources', duration: '25m' },
    { title: 'Draft Outline', duration: '45m' },
    { title: 'Review & Proofread', duration: '20m' },
  ];

  return (
    <section className="py-12 border-t border-[var(--border-soft)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Narrative Column */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <SectionEyebrow dotColor="var(--primary)">
            Workload Division
          </SectionEyebrow>

          <EditorialHeading size="md">
            Planning that understands workload.
          </EditorialHeading>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg font-sans">
            Break down intimidating assignments into focused, bite-sized study blocks. PulseOS helps you divide time realistically before you begin working.
          </p>

          <span className="text-[11px] font-mono text-[var(--text-muted)] italic">
            * Illustrative planning workflow preview
          </span>
        </div>

        {/* Right Product UI Showcase */}
        <div className="lg:col-span-6 flex justify-center">
          <SurfaceCard className="w-full max-w-md p-6 shadow-lg flex flex-col gap-4 border-[var(--border)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] font-sans">
                <ListTree size={16} className="text-[var(--primary)]" />
                <span>Operating Systems Essay</span>
              </div>
              <span className="text-xs font-mono text-[var(--primary)] font-bold">1h 30m total</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {steps.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 text-[var(--text-primary)] font-medium font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <span className="font-mono text-[var(--text-muted)]">{item.duration}</span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </section>
  );
};
