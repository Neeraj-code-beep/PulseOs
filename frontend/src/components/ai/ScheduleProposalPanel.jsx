import PropTypes from 'prop-types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Calendar, Clock, AlertTriangle, Coffee, Play, Check } from 'lucide-react';
import { proposeScheduleApi } from '../../services/aiApi';

export const ScheduleProposalPanel = ({ taskId, title, estimatedMinutes, context, onClose }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(context?.dueDate ? context.dueDate.split('T')[0] : todayStr);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('20:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  const handleBuildSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!title || !title.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setApplied(false);

      const res = await proposeScheduleApi({
        title: title.trim(),
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        context,
        availability: {
          date,
          startTime,
          endTime,
        },
      });

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || "Pulse couldn't build a schedule proposal right now.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Pulse couldn't build a schedule proposal right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleUsePlan = () => {
    setApplied(true);
    if (taskId) {
      navigate(`/focus?task=${taskId}`);
    } else {
      navigate('/focus');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } },
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
  };

  return (
    <Motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] flex flex-col gap-3 shadow-xs text-xs"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
            <Sparkles size={14} />
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            SMART SCHEDULE PROPOSAL
          </span>
        </div>
      </div>

      {/* Input Form State */}
      {!loading && !result && !error && (
        <form onSubmit={handleBuildSchedule} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Plan a focus window
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Tell Pulse when you&apos;re available and it will shape the task into realistic focus blocks.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="flex flex-col gap-1">
              <label htmlFor="avail-date" className="text-[10px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Calendar size={11} /> Date
              </label>
              <input
                id="avail-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] outline-none text-xs"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="avail-start" className="text-[10px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Clock size={11} /> Start
              </label>
              <input
                id="avail-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] outline-none text-xs"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="avail-end" className="text-[10px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Clock size={11} /> End
              </label>
              <input
                id="avail-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] outline-none text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-[var(--radius-sm)] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles size={13} />
              <span>Build schedule</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-secondary)]">
          <Sparkles size={20} className="text-[var(--accent)] animate-spin" />
          <span className="font-medium text-xs text-[var(--text-primary)]">
            Generating focus schedule proposal…
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Organizing focus sessions & breaks within availability
          </span>
        </div>
      )}

      {/* Error / Insufficient availability State */}
      {!loading && (error || (result && result.fitsAvailability === false)) && (
        <div className="py-2 flex flex-col gap-2.5">
          <div className="flex items-start gap-2 text-[var(--warning)] p-2.5 bg-[var(--warning-soft)]/20 border border-[var(--warning)]/30 rounded-[var(--radius-sm)]">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 text-xs">
              <span className="font-semibold text-[var(--text-primary)]">
                {result?.message || error}
              </span>
              {result && (
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Task needs {result.requiredMinutes}m, but available window is only {result.availableMinutes}m.
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setResult(null)}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer"
            >
              Adjust window
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Result State (fitsAvailability === true) */}
      {!loading && result && result.fitsAvailability === true && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              YOUR PROPOSED FOCUS PLAN ({result.date})
            </span>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium cursor-pointer"
            >
              Adjust window
            </button>
          </div>

          {/* Timeline Block List */}
          <Motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5"
          >
            {result.blocks.map((block, idx) => (
              <Motion.div
                key={idx}
                variants={itemVariants}
                className={`p-2.5 rounded-[var(--radius-sm)] border flex items-center justify-between gap-3 ${
                  block.type === 'focus'
                    ? 'bg-[var(--bg-surface)] border-[var(--border-soft)]'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border)]/40 opacity-85'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="font-mono text-[11px] font-bold text-[var(--text-muted)] shrink-0 min-w-[50px]">
                    {block.startTime}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {block.type === 'focus' ? (
                      <Clock size={13} className="text-[var(--focus)] shrink-0" />
                    ) : (
                      <Coffee size={13} className="text-[var(--text-muted)] shrink-0" />
                    )}
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {block.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-xs ${
                      block.type === 'focus'
                        ? 'bg-[var(--focus-soft)] text-[var(--focus)]'
                        : 'bg-[var(--border-soft)] text-[var(--text-muted)]'
                    }`}
                  >
                    {block.durationMinutes}m
                  </span>
                </div>
              </Motion.div>
            ))}
          </Motion.div>

          {/* Summary & Action Footer */}
          <div className="pt-2 border-t border-[var(--border-soft)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-mono font-bold text-[var(--focus)]">
                {result.totalFocusMinutes}m focused
              </span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="font-mono text-[var(--text-muted)]">
                {result.totalBreakMinutes}m break
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Dismiss
              </button>

              <button
                type="button"
                onClick={handleUsePlan}
                disabled={applied}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] transition-all cursor-pointer shadow-xs ${
                  applied
                    ? 'bg-[var(--focus-soft)] text-[var(--focus)] border border-[var(--focus)]/20'
                    : 'bg-[var(--focus)] text-white hover:brightness-110'
                }`}
              >
                {applied ? (
                  <>
                    <Check size={13} />
                    <span>Plan Ready</span>
                  </>
                ) : (
                  <>
                    <Play size={13} />
                    <span>Use this plan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Motion.div>
  );
};

ScheduleProposalPanel.propTypes = {
  taskId: PropTypes.string,
  title: PropTypes.string,
  estimatedMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  context: PropTypes.shape({
    priority: PropTypes.string,
    dueDate: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
};
