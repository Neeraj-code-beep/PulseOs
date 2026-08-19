import { useNavigate } from 'react-router-dom';
import { LogIn, ArrowRight, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/layout/Footer';
import { HeroWorkspace } from '../components/home/HeroWorkspace';
import { Methodology } from '../components/home/Methodology';
import { FocusPreview } from '../components/home/FocusPreview';
import { PlanningPreview } from '../components/home/PlanningPreview';
import { InsightsPreview } from '../components/home/InsightsPreview';
import { FinalCTA } from '../components/home/FinalCTA';
import { useAuth } from '../context/useAuth';

export const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* Public Landing Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md h-16 flex items-center shadow-xs">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Brandmark */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="relative w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] border border-[var(--primary)]/20 transition-transform group-hover:scale-105">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4.5 h-4.5"
              >
                <circle cx="12" cy="12" r="9" className="opacity-25" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight font-sans text-[var(--text-primary)]">
              Pulse<span className="text-[var(--primary)] font-extrabold">OS</span>
            </span>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                icon={LayoutDashboard}
                onClick={() => navigate('/app')}
                className="shadow-xs"
              >
                <span>Go to Workspace</span>
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  icon={LogIn}
                  className="font-medium text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <span>Sign in</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate('/register')}
                  className="shadow-xs"
                >
                  <span>Get Started</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Landing Marketing Page Experience */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Hero Section */}
        <HeroWorkspace
          isPublic={true}
          openCount={3}
          completedCount={5}
        />

        {/* Methodology (Plan, Focus, Improve) */}
        <Methodology />

        {/* Workload Division Preview */}
        <PlanningPreview />

        {/* Distraction-Free Focus Preview */}
        <FocusPreview />

        {/* Productivity Telemetry Preview */}
        <InsightsPreview />

        {/* Final Action CTA */}
        <FinalCTA isPublic={true} />
      </main>

      {/* Public Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
