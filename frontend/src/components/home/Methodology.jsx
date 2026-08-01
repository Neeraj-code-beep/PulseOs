import { CheckSquare, Timer, BarChart2 } from 'lucide-react';

export const Methodology = () => {
  const steps = [
    {
      number: '01',
      title: 'PLAN',
      subtitle: 'Capture & Estimate',
      description: 'Organize coursework, break projects down, and assign realistic time estimates before diving in.',
      icon: CheckSquare,
      color: 'var(--primary)',
    },
    {
      number: '02',
      title: 'FOCUS',
      subtitle: 'Single-Task Execution',
      description: 'Lock in with single-task Pomodoro cycles. Eliminate multitasking and protect study momentum.',
      icon: Timer,
      color: 'var(--focus)',
    },
    {
      number: '03',
      title: 'IMPROVE',
      subtitle: 'Refine & Pacing',
      description: 'Review focused hours, completion velocity, and refine your study schedule with real empirical data.',
      icon: BarChart2,
      color: 'var(--accent)',
    },
  ];

  return (
    <section className="py-16 bg-[#1D1D1A] text-[#F5F1E8] my-10 rounded-[var(--radius-xl)] shadow-xl relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col gap-10">
        <div className="flex flex-col gap-2 max-w-xl">
          <span className="text-xs font-mono font-bold tracking-widest text-[#E85D3F] uppercase">
            PRODUCTIVITY METHODOLOGY
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Plan. Focus. Improve.
          </h2>
          <p className="text-sm text-[#B5B1A8] leading-relaxed">
            The core engine connecting everyday task management with deep focus and long-term habit refinement.
          </p>
        </div>

        {/* Connected Horizontal Story Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative flex flex-col gap-4 p-6 bg-[#252420] border border-[#34322D] rounded-[var(--radius-lg)] hover:border-[#424039] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold font-mono text-[#77736C]">
                    {step.number}
                  </span>
                  <div
                    className="p-2.5 rounded-lg"
                    style={{ backgroundColor: `${step.color}20`, color: step.color }}
                  >
                    <Icon size={20} />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <span className="text-xs font-medium text-[#E85D3F]">
                    {step.subtitle}
                  </span>
                </div>

                <p className="text-xs text-[#B5B1A8] leading-relaxed">
                  {step.description}
                </p>

                {/* Subtle Connecting Line on Desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 text-[#424039]">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
