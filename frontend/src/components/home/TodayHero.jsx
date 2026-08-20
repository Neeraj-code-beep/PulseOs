import { ArrowRight, Play, Plus, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionEyebrow } from '../ui/SectionEyebrow';
import { EditorialHeading } from '../ui/EditorialHeading';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/useAuth';

export const TodayHero = ({ openCount = 0, onPlanClick, onFocusClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const firstName = user?.name ? user.name.split(' ')[0] : 'Learner';

  return (
    <section className="relative py-6 sm:py-8 border-b border-[var(--border-soft)]">
      <div className="flex flex-col gap-4">
        {/* Top Eyebrow Bar */}
        <div className="flex items-center justify-between gap-4">
          <SectionEyebrow dotColor="var(--primary)">
            {formattedDate}
          </SectionEyebrow>

          <span className="text-xs font-mono text-[var(--text-muted)] font-medium">
            PulseOS Command Center
          </span>
        </div>

        {/* Headline & Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <EditorialHeading size="lg">
              {getGreeting()},{' '}
              <span className="text-[var(--primary)] font-serif italic font-normal">
                {firstName}.
              </span>
            </EditorialHeading>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans max-w-lg leading-relaxed">
              {openCount > 0
                ? `You have ${openCount} open ${openCount === 1 ? 'task' : 'tasks'} scheduled for today. Review your next action or initiate a focus block.`
                : 'Your daily schedule is completely clear! Add an assignment or take time to recharge.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={onFocusClick || (() => navigate('/focus'))}
              icon={Play}
              className="bg-[var(--focus)] hover:bg-[var(--focus)]/90 shadow-md font-semibold text-xs"
            >
              <span>Start Focus</span>
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={onPlanClick || (() => navigate('/tasks?add=true'))}
              icon={Plus}
              className="border-[var(--border)] shadow-xs font-semibold text-xs"
            >
              <span>Add Task</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TodayHero;
