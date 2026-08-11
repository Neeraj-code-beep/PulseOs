import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { User as UserIcon, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export const Register = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isAuthLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await register({ name, email, password });
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-primary)] px-4 py-12 transition-colors">
      <Motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Brandmark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 flex items-center justify-center text-[var(--primary)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-7 h-7"
              >
                <circle cx="12" cy="12" r="9" className="opacity-25" />
                <path d="M12 7v5l3 3" />
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight font-sans">
              Pulse<span className="text-[var(--primary)]">OS</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Plan → Focus → Improve
          </p>
        </div>

        <Card className="p-6 sm:p-8 bg-[var(--bg-surface)] border-[var(--border)] shadow-md">
          <h1 className="text-xl font-bold font-sans tracking-tight mb-1 text-[var(--text-primary)]">
            Create your account
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mb-6">
            Join PulseOS to organize tasks and track focused study sessions.
          </p>

          {error && (
            <div className="mb-5 p-3 rounded-[var(--radius-md)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Student Learner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9"
                />
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                />
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Password (min. 8 characters)
              </label>
              <div className="relative">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-9"
                />
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full mt-2 justify-center"
              icon={ArrowRight}
            >
              {isSubmitting ? 'Creating account…' : 'Get Started'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border-soft)] text-center text-xs text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </Motion.div>
    </div>
  );
};
