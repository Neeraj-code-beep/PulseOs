import { useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import {
  CalendarDays,
  CheckSquare,
  Timer,
  BarChart2,
  Sparkles,
  Plus,
  X,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { Footer } from '../components/layout/Footer';
import { AskPulseDrawer } from '../components/ai/AskPulseDrawer';
import { useFocus } from '../context/useFocus';
import { useAuth } from '../context/useAuth';

export const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const userMenuTriggerRef = useRef(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { timerState } = useFocus();
  const { user, logout } = useAuth();
  const isFocusActive = timerState === 'RUNNING';

  const navItems = [
    { path: '/app', label: 'Today', icon: CalendarDays },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/focus', label: 'Focus', icon: Timer },
    { path: '/analytics', label: 'Insights', icon: BarChart2 },
  ];

  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors">
      {/* Desktop Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md h-16 flex items-center shadow-xs">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Code-built Brandmark */}
          <div
            onClick={() => navigate('/app')}
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

          {/* Integrated Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-[var(--bg-app)]/60 rounded-[var(--radius-lg)] border border-[var(--border-soft)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] font-semibold shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]/60'
                  }`}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.75} className={isActive ? 'text-[var(--primary)]' : ''} />
                  <span>{item.label}</span>
                  {item.path === '/focus' && isFocusActive && (
                    <span className="w-2 h-2 rounded-full bg-[var(--focus)] animate-pulse" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setIsAiOpen(true)}
              aria-label="Open Ask Pulse productivity copilot"
              title="Ask Pulse"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] hover:border-[var(--border)] rounded-[var(--radius-md)] transition-colors cursor-pointer active:scale-[0.98]"
            >
              <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
              <span className="hidden sm:inline">Ask Pulse</span>
            </button>
            <ThemeToggle />

            {/* Authenticated User pill & Dropdown Menu */}
            {user && (
              <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-[var(--border-soft)]">
                <button
                  ref={userMenuTriggerRef}
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  aria-label={`User account menu for ${user.name || user.email}`}
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                  title={user.email}
                  className="w-7 h-7 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] font-bold text-xs flex items-center justify-center font-mono border border-[var(--primary)]/20 cursor-pointer hover:ring-2 hover:ring-[var(--primary)]/30 transition-all shrink-0"
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </button>

                <DropdownMenu
                  isOpen={isUserMenuOpen}
                  onClose={() => setIsUserMenuOpen(false)}
                  triggerRef={userMenuTriggerRef}
                  align="end"
                  className="w-48 p-1"
                >
                  <div className="px-3 py-2 border-b border-[var(--border-soft)]">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate font-sans">
                      {user.name || 'Student'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                      {user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 text-left cursor-pointer w-full rounded-[var(--radius-sm)] transition-colors mt-1"
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    <span>Log out</span>
                  </button>
                </DropdownMenu>

                {/* Direct desktop logout button */}
                <button
                  onClick={logout}
                  title="Logout of PulseOS"
                  aria-label="Logout of PulseOS"
                  className="hidden sm:flex p-1.5 text-[var(--text-muted)] hover:text-[var(--danger)] rounded-[var(--radius-md)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}

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

      {/* Main Content Workspace with Route Transition */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        <Motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </Motion.div>
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
      <AskPulseDrawer isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </div>
  );
};
