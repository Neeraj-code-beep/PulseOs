import { Timer, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { SurfaceCard } from '../ui/SurfaceCard';
import { Button } from '../ui/Button';

export const FocusPreview = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 border-t border-[var(--border-soft)]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Visual Instrument Display */}
        <div className="lg:col-span-6 flex justify-center">
          <SurfaceCard className="w-full max-w-md p-8 shadow-xl flex flex-col items-center text-center gap-6 relative border-[var(--border)]">
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
                Pomodoro Cycle · 5m Rest Interval
              </span>
            </div>

            {/* Target Task Binding Preview */}
            <div className="w-full p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs text-left flex items-center justify-between">
              <span className="text-[var(--text-muted)] font-medium font-mono">Bound task:</span>
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] font-sans">
                Operating Systems assignment
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/focus')}
              icon={ArrowRight}
              className="w-full bg-[var(--focus)] hover:bg-[var(--focus)]/90 py-3 shadow-md"
            >
              Launch Focus Session
            </Button>
          </SurfaceCard>
        </div>

        {/* Right Narrative Column */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <SectionEyebrow dotColor="var(--focus)">
            Focus Workspace
          </SectionEyebrow>

          <EditorialHeading size="md">
            One task. One timer. <br />
            Zero distractions.
          </EditorialHeading>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-lg font-sans">
            When you are ready to study, attach your target assignment directly to the focus timer. PulseOS handles session logging and metrics behind the scenes.
          </p>

          <ul className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] font-medium pt-1 font-sans">
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)] shrink-0" />
              <span>Standard 25-minute Pomodoro or custom focus duration</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)] shrink-0" />
              <span>Direct binding to active daily execution plan</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--focus)] shrink-0" />
              <span>Automated study duration logging & habit telemetry</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
