import { ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditorialHeading } from '../ui/EditorialHeading';
import { Button } from '../ui/Button';

export const FinalCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-14 border-t border-[var(--border-soft)]">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
        <EditorialHeading size="md" className="text-center">
          Ready for your next focus block?
        </EditorialHeading>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md font-sans">
          Plan your assignments now or start a distraction-free study session immediately.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/tasks?add=true')}
            icon={ArrowRight}
            className="px-6 py-2.5 font-semibold shadow-md"
          >
            Add a task
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/focus')}
            className="px-6 py-2.5 font-semibold border-[var(--border)] shadow-xs"
          >
            <Play size={14} className="text-[var(--focus)]" fill="currentColor" />
            <span>Start focus</span>
          </Button>
        </div>
      </div>
    </section>
  );
};
