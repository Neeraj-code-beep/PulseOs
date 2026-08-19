import { CheckSquare, Timer, BarChart2 } from 'lucide-react';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';

export const Methodology = () => {
  const steps = [
    {
      number: '01',
      title: 'PLAN',
      subtitle: 'Capture & Workload Breakdown',
      description: 'Organize coursework, break complex assignments into estimated time blocks, and set clear priority.',
      icon: CheckSquare,
      color: '#F07155',
    },
    {
      number: '02',
      title: 'FOCUS',
      subtitle: 'Single-Task Execution',
      description: 'Lock into distraction-free Pomodoro or custom intervals bound directly to active tasks.',
      icon: Timer,
      color: '#65B49A',
    },
    {
      number: '03',
      title: 'IMPROVE',
      subtitle: 'Empirical Habit Refinement',
      description: 'Review study trends, focus velocity, and completion records without subjective noise.',
      icon: BarChart2,
      color: '#D9A84E',
    },
  ];

  return (
    <section className="py-14 bg-[#181816] text-[#F3F0E8] my-8 rounded-[var(--radius-xl)] shadow-xl relative overflow-hidden border border-[#2B2925]">
      {/* Background Subtle Architectural Mesh */}
      <div className="absolute inset-0 bg-dotted-pattern opacity-15 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col gap-10 relative z-10">
        <div className="flex flex-col gap-2 max-w-xl">
          <SectionEyebrow dotColor="#F07155" className="bg-[#24231F] border-[#34322D] text-[#B5B1A8]">
            PRODUCTIVITY ENGINE
          </SectionEyebrow>
          <EditorialHeading size="md" className="text-white mt-1">
            Plan. Focus. Improve.
          </EditorialHeading>
          <p className="text-xs sm:text-sm text-[#B5B1A8] leading-relaxed">
            The core PulseOS framework bridging task planning, distraction-free execution, and data-backed performance insights.
          </p>
        </div>

        {/* 3-Column Methodology Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col justify-between gap-5 p-6 bg-[#21201D] border border-[#34322D] rounded-[var(--radius-lg)] hover:border-[#4A4740] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold font-mono text-[#666259]">
                    {step.number}
                  </span>
                  <div
                    className="p-2.5 rounded-[var(--radius-md)] border border-white/10"
                    style={{ backgroundColor: `${step.color}18`, color: step.color }}
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight font-sans">
                    {step.title}
                  </h3>
                  <span className="text-xs font-mono font-semibold block" style={{ color: step.color }}>
                    {step.subtitle}
                  </span>
                  <p className="text-xs text-[#B5B1A8] leading-relaxed pt-1 font-sans">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
