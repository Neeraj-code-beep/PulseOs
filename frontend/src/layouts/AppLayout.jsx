import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CheckSquare,
  Timer,
  BarChart2,
  Sparkles,
  Plus,
  X,
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { Footer } from '../components/layout/Footer';
import { useFocus } from '../context/useFocus';

export const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { timerState } = useFocus();
  const isFocusActive = timerState === 'RUNNING';

  const navItems = [
    { path: '/app', label: 'Today', icon: CalendarDays },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/focus', label: 'Focus', icon: Timer },
    { path: '/analytics', label: 'Insights', icon: BarChart2 },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* Desktop Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md h-15 flex items-center">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Code-built Brandmark */}
          <div
            onClick={() => navigate('/app')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative w-6 h-6 flex items-center justify-center text-[var(--primary)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 transition-transform group-hover:scale-110"
              >
                <circle cx="12" cy="12" r="9" className="opacity-25" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="font-bold text-base tracking-tight font-sans">
              Pulse<span className="text-[var(--primary)] font-semibold">OS</span>
            </span>
          </div>

          {/* Integrated Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold border-b-2 border-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} />
                  <span>{item.label}</span>
                  {item.path === '/focus' && isFocusActive && (
                    <span className="w-2 h-2 rounded-full bg-[var(--focus)] animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] transition-colors cursor-pointer"
            >
              <Sparkles size={15} className="text-[var(--accent)]" />
              <span>Ask Pulse</span>
            </button>
            <ThemeToggle />
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/tasks?add=true')}
            >
              <span className="hidden sm:inline">New task</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-4 py-2 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 text-[11px] transition-colors ${
                isActive
                  ? 'text-[var(--primary)] font-semibold'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.75} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Global Footer */}
      <Footer />

      {/* Contextual AI Assistant Panel */}
      {isAiOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex justify-end"
          onClick={() => setIsAiOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-surface)] h-full p-6 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[var(--accent)]" size={18} />
                  <h2 className="text-base font-bold font-sans">Pulse Assistant</h2>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-soft)] text-xs text-[var(--text-secondary)] space-y-2">
                <p className="font-semibold text-[var(--text-primary)]">
                  Intelligent Task Planning
                </p>
                <p className="leading-relaxed">
                  Ask Pulse helps break complex study goals into realistic time blocks and focus routines.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              onClick={() => setIsAiOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
