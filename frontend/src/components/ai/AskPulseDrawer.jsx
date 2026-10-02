import PropTypes from 'prop-types';
import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  X,
  Send,
  RefreshCw,
  AlertCircle,
  Play,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ListTodo,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { askPulseApi } from '../../services/aiApi';
import { TodoContext } from '../../context/TodoContext';
import { FocusContext } from '../../context/FocusContext';

const QUICK_PROMPTS = [
  'What should I focus on first today?',
  'Help me prioritize my upcoming assignments',
  'How do I structure a 2-hour study block?',
  'Give me a strategy to tackle my hardest task',
];

export const AskPulseDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { todos = [] } = useContext(TodoContext) || {};
  const { setSelectedTaskId } = useContext(FocusContext) || {};

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState('');

  const inputRef = useRef(null);
  const activeTodos = todos.filter((t) => !t.completed);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e, overrideQuery) => {
    if (e) e.preventDefault();
    const promptText = (overrideQuery || query).trim();
    if (!promptText || loading) return;

    try {
      setLoading(true);
      setError(null);
      setLastSubmittedQuery(promptText);

      const res = await askPulseApi(promptText);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || 'Pulse Assistant could not process this request right now.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Pulse Assistant is temporarily unavailable. Please try again shortly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    setQuery(promptText);
    handleSubmit(null, promptText);
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleStartFocus = (taskTitle) => {
    onClose();
    if (!taskTitle) {
      navigate('/focus');
      return;
    }
    const matched = todos.find(
      (t) => t.title.toLowerCase().trim() === taskTitle.toLowerCase().trim()
    );
    if (matched) {
      const targetId = matched._id || matched.id;
      if (setSelectedTaskId) setSelectedTaskId(targetId);
      navigate(`/focus?task=${targetId}`);
    } else {
      navigate('/focus');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ask Pulse Productivity Assistant"
    >
      <Motion.div
        initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-lg bg-[var(--bg-surface)] h-full p-6 shadow-2xl flex flex-col justify-between border-l border-[var(--border)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-sans text-[var(--text-primary)]">
                    Ask Pulse
                  </h2>
                  <Badge variant="primary" className="text-[10px] uppercase font-mono tracking-wider">
                    AI Assistant
                  </Badge>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-mono block">
                  Productivity & Focus Strategy Coach
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
              aria-label="Close Ask Pulse drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Workload Context Banner */}
          <div className="p-3 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-soft)] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <ListTodo size={14} className="text-[var(--primary)]" />
              <span>Active Workload</span>
            </div>
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {activeTodos.length} {activeTodos.length === 1 ? 'task' : 'tasks'} open
            </span>
          </div>

          {/* Quick Prompts Carousel/Pills (only when not loading and no result) */}
          {!loading && !result && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                <HelpCircle size={11} className="text-[var(--accent)]" />
                Suggested Inquiries
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickPrompt(promptText)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-elevated)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-soft)] hover:border-[var(--border)] transition-all cursor-pointer shadow-xs"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          {!result && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Ask anything about planning, focus, or organizing your study tasks... (press Enter to submit)"
                  rows={3}
                  maxLength={1000}
                  disabled={loading}
                  className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] focus:border-[var(--primary)] rounded-[var(--radius-lg)] p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none transition-colors shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {query.length}/1000 chars
                </span>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!query.trim() || loading}
                  icon={loading ? RefreshCw : Send}
                  className={`px-4 shadow-xs ${loading ? '[&_svg]:animate-spin' : ''}`}
                >
                  {loading ? 'Consulting Pulse…' : 'Ask Assistant'}
                </Button>
              </div>
            </form>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-soft)] flex flex-col items-center justify-center gap-3 text-center animate-pulse">
              <div className="p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                <Sparkles size={20} className="animate-spin" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Analyzing your active tasks & productivity context…
                </span>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Generating actionable focus recommendations for you.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[var(--radius-lg)] flex flex-col gap-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-[var(--danger)] shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--danger)] font-medium">
                  {error}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--danger)]/20">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSubmit(null, lastSubmittedQuery)}
                  icon={RefreshCw}
                  className="text-xs py-1 px-3"
                >
                  Retry Request
                </Button>
              </div>
            </div>
          )}

          {/* Assistant Response Output */}
          <AnimatePresence>
            {result && !loading && (
              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Fallback Badge */}
                {result.isFallback && (
                  <p className="text-[10px] text-[var(--text-muted)] italic font-mono px-1">
                    * Plan generated from your active tasks and priority schedule.
                  </p>
                )}

                {/* Core Advice Card */}
                <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-lg)] space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold flex items-center gap-1">
                    <Sparkles size={12} />
                    Recommendation
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans font-medium">
                    {result.answer}
                  </p>
                </div>

                {/* Action Items List */}
                {Array.isArray(result.actionItems) && result.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold block">
                      Immediate Action Steps
                    </span>
                    <div className="space-y-1.5">
                      {result.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs flex items-start gap-2.5"
                        >
                          <CheckCircle2 size={14} className="text-[var(--focus)] shrink-0 mt-0.5" />
                          <span className="text-[var(--text-primary)] font-medium leading-snug">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Focus Target Card */}
                {result.suggestedFocusTask && result.suggestedFocusTask.title && (
                  <div className="p-3.5 bg-[var(--focus-soft)] border border-[var(--focus)]/30 rounded-[var(--radius-lg)] flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--focus)] font-bold block">
                        Recommended Next Target
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate block mt-0.5">
                        {result.suggestedFocusTask.title}
                      </span>
                      {result.suggestedFocusTask.reason && (
                        <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">
                          {result.suggestedFocusTask.reason}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartFocus(result.suggestedFocusTask.title)}
                      icon={Play}
                      className="bg-[var(--focus)] hover:bg-[var(--focus)]/90 text-white shrink-0 text-xs py-1.5 px-3"
                    >
                      Focus Now
                    </Button>
                  </div>
                )}

                {/* Reset / Ask Another Question Button */}
                <div className="pt-2 flex items-center justify-between border-t border-[var(--border-soft)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs text-[var(--primary)] font-semibold"
                  >
                    <span>Ask another question</span>
                    <ArrowRight size={13} />
                  </Button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[var(--border-soft)] mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-full text-xs font-medium"
          >
            Close Assistant
          </Button>
        </div>
      </Motion.div>
    </div>
  );
};

AskPulseDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AskPulseDrawer;
