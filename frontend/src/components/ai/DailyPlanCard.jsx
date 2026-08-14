import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Calendar, Clock, CheckCircle2, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getDailyPlanApi } from '../../services/aiApi';

export const DailyPlanCard = () => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      const res = await getDailyPlanApi({
        startTime: '09:00 AM',
        endTime: '05:00 PM',
      });
      if (res.success && res.data) {
        setPlan(res.data);
        setIsExpanded(true);
      }
    } catch (err) {
      console.error('Failed to generate daily plan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-[var(--bg-surface)] border-[var(--border)] shadow-sm relative overflow-hidden transition-colors mb-6">
      {/* Decorative Warm Soft Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-soft)]/40 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-[var(--radius-lg)] bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-sans text-[var(--text-primary)]">
                Daily Focus Recommendations
              </h2>
              <Badge variant="primary" className="text-[10px] uppercase font-mono tracking-wider">
                AI Assistant
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Synthesizing your active tasks, study patterns, and target availability into a focused routine.
            </p>
          </div>
        </div>

        <Button
          variant={plan ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleGeneratePlan}
          disabled={loading}
          icon={loading ? RefreshCw : Zap}
          className={loading ? '[&_svg]:animate-spin' : ''}
        >
          {loading ? 'Building Plan…' : plan ? 'Regenerate Plan' : 'Generate Daily Plan'}
        </Button>
      </div>

      {/* Active Plan Content */}
      <AnimatePresence>
        {isExpanded && plan && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="mt-6 pt-5 border-t border-[var(--border-soft)] space-y-6"
          >
            {/* Fallback Notice */}
            {plan.isFallback && (
              <p className="text-[11px] text-[var(--text-muted)] italic px-1 font-mono">
                Pulse created a basic plan from your current tasks and focus data.
              </p>
            )}

            {/* 1. Daily Goal Banner */}
            <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] flex items-center gap-3">
              <CheckCircle2 size={18} className="text-[var(--focus)] shrink-0" />
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] block">
                  Today’s Objective
                </span>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                  {plan.dailyGoal}
                </p>
              </div>
            </div>

            {/* 2. Recommendations Grid */}
            {plan.recommendations && plan.recommendations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold font-sans tracking-wide uppercase text-[var(--text-secondary)] mb-3">
                  Productivity Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--primary)] block mb-1">
                          {rec.type?.replace('_', ' ') || 'Recommendation'}
                        </span>
                        <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">
                          {rec.title}
                        </h4>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Proposed Focus Timeline */}
            {plan.proposedPlan && plan.proposedPlan.length > 0 && (
              <div>
                <h3 className="text-xs font-bold font-sans tracking-wide uppercase text-[var(--text-secondary)] mb-3 flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--primary)]" />
                  <span>Suggested Focus Schedule</span>
                </h3>
                <div className="space-y-2">
                  {plan.proposedPlan.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] font-semibold text-[var(--primary)] flex items-center gap-1 shrink-0 bg-[var(--primary-soft)] px-2 py-0.5 rounded-[var(--radius-sm)]">
                          <Clock size={12} />
                          {slot.timeSlot}
                        </span>
                        <span className="font-semibold text-[var(--text-primary)] truncate max-w-xs sm:max-w-md">
                          {slot.taskTitle}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 shrink-0">
                        {slot.action}
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
