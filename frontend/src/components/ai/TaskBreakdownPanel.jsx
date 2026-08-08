import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Clock, AlertCircle, Check } from 'lucide-react';
import { breakDownTaskApi } from '../../services/aiApi';

export const TaskBreakdownPanel = ({ title, context, onApplyBreakdown, onClose }) => {
  const shouldReduceMotion = useReducedMotion();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  const handleGenerate = async () => {
    if (!title || !title.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setApplied(false);
      const res = await breakDownTaskApi(title.trim(), context);

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || "Pulse couldn't create a breakdown right now.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Pulse couldn't create a breakdown right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && result.totalEstimatedMinutes && onApplyBreakdown) {
      onApplyBreakdown(result.totalEstimatedMinutes, result.subtasks);
      setApplied(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
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
            BREAK DOWN WITH PULSE
          </span>
        </div>
      </div>

      {/* Initial State */}
      {!loading && !result && !error && (
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              Turn a large task into focused work blocks.
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Pulse will suggest a realistic sequence and time estimate.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-[var(--radius-sm)] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles size={13} />
              <span>Generate breakdown</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-6 flex flex-col items-center justify-center gap-2 text-center text-[var(--text-secondary)]">
          <Sparkles size={20} className="text-[var(--accent)] animate-spin" />
          <span className="font-medium text-xs text-[var(--text-primary)]">
            Planning your focus blocks…
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Analyzing task requirements & estimating durations
          </span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="py-2 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-[var(--danger)]">
            <AlertCircle size={16} />
            <span className="font-semibold text-xs text-[var(--text-primary)]">
              {error}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleGenerate}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer"
            >
              Try again
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

      {/* Result State */}
      {!loading && result && (
        <div className="flex flex-col gap-3">
          {/* Summary */}
          <div className="p-2.5 bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[var(--radius-sm)] flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              SUGGESTED APPROACH
            </span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
              {result.summary}
            </p>
          </div>

          {/* Subtask Sequence List */}
          <Motion.div
            variants={listVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1.5"
          >
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              WORK BLOCKS ({result.subtasks.length})
            </span>

            {result.subtasks.map((st, idx) => (
              <Motion.div
                key={idx}
                variants={itemVariants}
                className="p-2 bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[var(--radius-sm)] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="font-medium text-[var(--text-primary)] truncate">
                    {st.title}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--focus)] shrink-0">
                  <Clock size={11} />
                  <span>{st.estimatedMinutes}m</span>
                </div>
              </Motion.div>
            ))}
          </Motion.div>

          {/* Total & Action Footer */}
          <div className="pt-2 border-t border-[var(--border-soft)] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[var(--text-muted)]">Total estimate:</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {result.totalEstimatedMinutes}m
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
                onClick={handleApply}
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
                    <span>Estimate Applied ({result.totalEstimatedMinutes}m)</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Apply breakdown</span>
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

TaskBreakdownPanel.propTypes = {
  title: PropTypes.string,
  context: PropTypes.shape({
    subject: PropTypes.string,
    priority: PropTypes.string,
    dueDate: PropTypes.string,
    estimatedMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onApplyBreakdown: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
