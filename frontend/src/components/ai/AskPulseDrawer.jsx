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
  Target,
  CalendarDays,
  Zap,
  Layers,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Timer,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { askPulseApi } from '../../services/aiApi';
import { TodoContext } from '../../context/TodoContext';
import { FocusContext } from '../../context/FocusContext';

const QUICK_PROMPT_CONFIGS = [
  {
    id: 'focus',
    title: 'What should I focus on?',
    subtitle: 'Identify your highest-leverage task right now',
    query: 'What should I focus on right now given my active tasks and priorities?',
    icon: Target,
    badgeColor: 'text-[var(--primary)] bg-[var(--primary-soft)] border-[var(--primary)]/20',
  },
  {
    id: 'plan',
    title: 'Plan my day',
    subtitle: 'Structure your workload into manageable blocks',
    query: 'Help me structure and plan my study day based on my workload.',
    icon: CalendarDays,
    badgeColor: 'text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent)]/20',
  },
  {
    id: 'overwhelmed',
    title: "I'm overwhelmed",
    subtitle: 'Cut through noise and find an easy first step',
    query: "I'm feeling overwhelmed with my workload. What is the single best first step to take?",
    icon: Zap,
    badgeColor: 'text-[var(--warning)] bg-[var(--warning-soft)] border-[var(--warning)]/20',
  },
  {
    id: 'breakdown',
    title: 'Break down my assignment',
    subtitle: 'Decompose a heavy task into clear subtasks',
    query: 'How should I break down my most complex or upcoming assignment into smaller steps?',
    icon: Layers,
    badgeColor: 'text-[var(--focus)] bg-[var(--focus-soft)] border-[var(--focus)]/20',
  },
  {
    id: 'timebox',
    title: 'I have 2 hours — what can I finish?',
    subtitle: 'Maximize high-impact progress in 120 minutes',
    query: 'I have 2 hours of available study time. What can I realistically finish?',
    icon: Clock,
    badgeColor: 'text-[var(--primary)] bg-[var(--primary-soft)] border-[var(--primary)]/20',
  },
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
  const highPriorityCount = activeTodos.filter((t) => t.priority === 'high' || t.priority === 'urgent').length;

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
        setError(res.message || 'Pulse Copilot could not process this request right now.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Pulse Copilot is temporarily unavailable. Please try again shortly.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptConfig) => {
    setQuery(promptConfig.query);
    handleSubmit(null, promptConfig.query);
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setLastSubmittedQuery('');
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
      aria-label="Ask Pulse Productivity Copilot"
    >
      <Motion.div
        initial={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: shouldReduceMotion ? 0 : '100%', opacity: shouldReduceMotion ? 0 : 1 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="w-full max-w-lg bg-[var(--bg-surface)] h-full max-h-dvh shadow-2xl flex flex-col border-l border-[var(--border)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg-surface)] shrink-0">
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
                  Productivity Copilot
                </Badge>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-mono block">
                Focus Strategy & Planning Assistant
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

        {/* Live Workload Context Strip */}
        <div className="px-4 sm:px-5 py-2.5 bg-[var(--bg-surface-elevated)]/70 border-b border-[var(--border-soft)] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <ListTodo size={14} className="text-[var(--primary)]" />
            <span className="font-medium">Workload Context</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-[var(--text-primary)]">
              {activeTodos.length} {activeTodos.length === 1 ? 'task' : 'tasks'} open
            </span>
            {highPriorityCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--danger)]/10 text-[var(--danger)] font-bold">
                {highPriorityCount} urgent/high
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4 min-h-0">
          {/* User Inquiry Header Banner (when waiting or showing result) */}
          {(lastSubmittedQuery || result) && (
            <div className="p-3 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-soft)] text-xs flex items-start gap-2.5 shrink-0">
              <MessageSquare size={15} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold block">
                  Your Inquiry
                </span>
                <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5 break-words">
                  &ldquo;{lastSubmittedQuery}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* First-Open / Empty State */}
          {!loading && !result && !error && (
            <div className="flex flex-col gap-5 py-1">
              {/* Productive Heading & Context Explanation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                    P
                  </div>
                  <h3 className="text-sm font-bold font-sans text-[var(--text-primary)]">
                    How can Pulse help you today?
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                  Pulse is connected to your active task queue, deadlines, and priorities. Ask for strategic guidance to turn your workload into your next best action.
                </p>
              </div>

              {/* Contextual Quick Actions Grid / Cards */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 font-bold">
                  <HelpCircle size={12} className="text-[var(--accent)]" />
                  Suggested Inquiries
                </span>

                <div className="flex flex-col gap-2">
                  {QUICK_PROMPT_CONFIGS.map((promptConfig, idx) => {
                    const Icon = promptConfig.icon;
                    return (
                      <Motion.button
                        key={promptConfig.id}
                        type="button"
                        onClick={() => handleQuickPrompt(promptConfig)}
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.2 }}
                        className="group w-full text-left p-3 rounded-[var(--radius-lg)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface-elevated)]/90 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-soft)] hover:border-[var(--primary)]/40 transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-[var(--radius-md)] border shrink-0 ${promptConfig.badgeColor} transition-transform group-hover:scale-105`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-[var(--text-primary)] block truncate">
                              {promptConfig.title}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] block truncate mt-0.5">
                              {promptConfig.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0">
                          <ArrowUpRight size={15} />
                        </div>
                      </Motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-lg)] border border-[var(--border-soft)] flex flex-col items-center justify-center gap-3.5 text-center my-auto">
              <div className="p-3.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full animate-pulse">
                <Sparkles size={22} className="animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Analyzing your active tasks & focus state…
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Synthesizing deadlines, priorities, and workflow strategy into clear next actions.
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && !loading && (
            <div className="p-4 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[var(--radius-lg)] flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="text-[var(--danger)] shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-[var(--danger)]">
                  <span className="font-semibold block">Unable to generate advice</span>
                  <p className="text-[11px] leading-relaxed text-[var(--danger)]/90">
                    {error}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--danger)]/20">
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
                initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Fallback Origin Badge */}
                {result.isFallback && (
                  <p className="text-[10px] text-[var(--text-muted)] italic font-mono px-1">
                    * Strategy synthesized deterministically from your active tasks and priority queue.
                  </p>
                )}

                {/* Structured Recommendation Section */}
                <div className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-lg)] space-y-2 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[var(--accent)]">
                    <Sparkles size={13} />
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                      Recommendation
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans font-medium">
                    {result.answer}
                  </p>
                </div>

                {/* Structured Immediate Action Items */}
                {Array.isArray(result.actionItems) && result.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-bold flex items-center gap-1.5 px-0.5">
                      <CheckCircle2 size={12} className="text-[var(--focus)]" />
                      Immediate Action Steps
                    </span>
                    <div className="space-y-1.5">
                      {result.actionItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs flex items-start gap-2.5 shadow-2xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-[var(--focus-soft)] text-[var(--focus)] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[var(--focus)]/20">
                            {idx + 1}
                          </span>
                          <span className="text-[var(--text-primary)] font-medium leading-snug flex-1">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Focus Target Card with 1-Click Action */}
                {result.suggestedFocusTask && result.suggestedFocusTask.title && (
                  <div className="p-4 bg-[var(--focus-soft)] border border-[var(--focus)]/30 rounded-[var(--radius-lg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[var(--focus)]">
                        <Target size={13} />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                          Recommended Next Target
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate block">
                        {result.suggestedFocusTask.title}
                      </span>
                      {result.suggestedFocusTask.reason && (
                        <span className="text-[11px] text-[var(--text-secondary)] block">
                          {result.suggestedFocusTask.reason}
                        </span>
                      )}
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartFocus(result.suggestedFocusTask.title)}
                      icon={Play}
                      className="bg-[var(--focus)] hover:bg-[var(--focus)]/90 text-white shrink-0 text-xs py-2 px-3.5 shadow-xs"
                    >
                      Focus Now
                    </Button>
                  </div>
                )}

                {/* Action Controls Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-soft)]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleReset}
                    icon={ArrowRight}
                    className="text-xs py-1.5 px-3"
                  >
                    Ask another question
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate('/focus');
                    }}
                    icon={Timer}
                    className="text-xs text-[var(--text-secondary)]"
                  >
                    Go to Focus Mode
                  </Button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stable Mobile-Safe Composer & Footer Container */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-soft)] bg-[var(--bg-surface)] shrink-0 flex flex-col gap-2.5">
          {!result ? (
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
                  placeholder="Ask anything about planning, focus, or study tasks... (Enter to submit)"
                  rows={2}
                  maxLength={1000}
                  disabled={loading}
                  className="w-full bg-[var(--bg-surface-elevated)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] rounded-[var(--radius-lg)] p-2.5 sm:p-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none resize-none transition-colors shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {query.length}/1000 chars
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!query.trim() || loading}
                    icon={loading ? RefreshCw : Send}
                    className={`px-4 shadow-xs ${loading ? '[&_svg]:animate-spin' : ''}`}
                  >
                    {loading ? 'Consulting Pulse…' : 'Ask Pulse'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleReset}
                icon={ArrowRight}
                className="text-xs"
              >
                New Question
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs text-[var(--text-secondary)]"
              >
                Close Drawer
              </Button>
            </div>
          )}

          {!result && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="w-full text-xs font-medium py-1.5"
            >
              Close Drawer
            </Button>
          )}
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

