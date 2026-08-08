import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Clock, AlertCircle, Check } from 'lucide-react';
import { estimateTaskTimeApi } from '../../services/aiApi';

export const TaskEstimatorPanel = ({ title, context, onApplyEstimate, onClose }) => {
  const shouldReduceMotion = useReducedMotion();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);

  const handleEstimate = async () => {
    if (!title || !title.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setApplied(false);
      const res = await estimateTaskTimeApi(title.trim(), context);

      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.message || "Pulse couldn't estimate time right now.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Pulse couldn't estimate time right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result && result.estimatedMinutes && onApplyEstimate) {
      onApplyEstimate(result.estimatedMinutes);
      setApplied(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
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
            ESTIMATE WITH PULSE
          </span>
        </div>
      </div>

      {/* Initial State */}
      {!loading && !result && !error && (
        <div className="flex flex-col gap-3 py-1">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-[var(--text-primary)]">
              How long will this realistically take?
            </span>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Pulse analyzes your task title and context to suggest a focused work duration.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleEstimate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-[var(--radius-sm)] transition-colors cursor-pointer shadow-xs"
            >
              <Sparkles size={13} />
              <span>Estimate time</span>
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
            Estimating a realistic focus time…
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Evaluating task complexity & student work patterns
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
              onClick={handleEstimate}
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
          <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-soft)] rounded-[var(--radius-sm)] flex items-start gap-3">
            <div className="p-2 bg-[var(--focus-soft)] text-[var(--focus)] rounded-[var(--radius-sm)] shrink-0 flex flex-col items-center justify-center min-w-[60px]">
              <Clock size={16} />
              <span className="font-mono font-bold text-sm mt-0.5">{result.estimatedMinutes} min</span>
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                ESTIMATED FOCUS DURATION
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-sans">
                {result.reason}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-[var(--border-soft)] flex items-center justify-end gap-2">
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
                  <span>Estimate Applied ({result.estimatedMinutes}m)</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Use {result.estimatedMinutes} min</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Motion.div>
  );
};

TaskEstimatorPanel.propTypes = {
  title: PropTypes.string,
  context: PropTypes.shape({
    priority: PropTypes.string,
    dueDate: PropTypes.string,
    estimatedMinutes: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  onApplyEstimate: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
