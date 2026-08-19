import { ArrowRight, Play, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EditorialHeading } from '../ui/EditorialHeading';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/useAuth';

export const FinalCTA = ({ isPublic = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const showPublic = isPublic || !isAuthenticated;

  return (
    <section className="py-14 border-t border-[var(--border-soft)]">
      <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
        <EditorialHeading size="md" className="text-center">
          {showPublic
            ? 'Ready to elevate your daily productivity?'
            : 'Ready for your next focus block?'}
        </EditorialHeading>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md font-sans">
          {showPublic
            ? 'Get started with PulseOS today to plan assignments, protect focus blocks, and track study velocity.'
            : 'Plan your assignments now or start a distraction-free study session immediately.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(showPublic ? '/register' : '/tasks?add=true')}
            icon={ArrowRight}
            className="px-6 py-2.5 font-semibold shadow-md"
          >
            {showPublic ? 'Get Started' : 'Add a task'}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate(showPublic ? '/login' : '/focus')}
            className="px-6 py-2.5 font-semibold border-[var(--border)] shadow-xs"
          >
            {showPublic ? (
              <>
                <LogIn size={14} className="text-[var(--primary)]" />
                <span>Sign in</span>
              </>
            ) : (
              <>
                <Play size={14} className="text-[var(--focus)]" fill="currentColor" />
                <span>Start focus</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
};
