import PropTypes from 'prop-types';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatDateDisplay, formatEstimate } from '../../utils/taskUtils';
import {
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Bell,
  Check,
  ListChecks,
} from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';

export const TaskItem = ({ todo, onToggleComplete, onDelete, onEdit }) => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const triggerRef = useRef(null);
  const id = todo._id || todo.id;

  const dateInfo = formatDateDisplay(todo.dueDate);
  const formattedEst = formatEstimate(todo.estimatedMinutes);

  const subtasks = Array.isArray(todo.subtasks) ? todo.subtasks : [];
  const tags = Array.isArray(todo.tags) ? todo.tags : [];
  const completedSubtasksCount = subtasks.filter((s) => s.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const hasTags = tags.length > 0;
  const hasContextDetails = hasSubtasks || hasTags;

  return (
    <Motion.div
      layout="position"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
      animate={{ opacity: todo.completed ? 0.6 : 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -4 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex items-start sm:items-center justify-between px-3.5 sm:px-4 py-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] transition-colors"
    >
      <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0 pr-2">
        {/* Accessible Custom Circular Checkbox Control with spring microinteraction */}
        <label className="relative flex items-center justify-center cursor-pointer shrink-0 mt-0.5 sm:mt-0 p-1 -m-1 min-w-[28px] min-h-[28px]">
          <input
            type="checkbox"
            checked={todo.completed || false}
            onChange={(e) => onToggleComplete(id, e.target.checked)}
            className="sr-only"
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
          <Motion.div
            animate={
              todo.completed && !shouldReduceMotion
                ? { scale: [0.85, 1.12, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`w-4 h-4 rounded-full border transition-colors flex items-center justify-center ${
              todo.completed
                ? 'bg-[var(--focus)] border-[var(--focus)] text-white shadow-xs'
                : 'border-[var(--border-strong)] group-hover:border-[var(--primary)]'
            }`}
          >
            <AnimatePresence>
              {todo.completed && (
                <Motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                  animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center justify-center"
                >
                  <Check size={10} strokeWidth={3} />
                </Motion.div>
              )}
            </AnimatePresence>
          </Motion.div>
        </label>

        {/* Title, Context & Inline Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0 flex-1">
          <div className="flex flex-col gap-1 min-w-0 flex-1 pr-1 sm:pr-3">
            <span
              className={`text-xs sm:text-sm font-medium text-[var(--text-primary)] break-words ${
                todo.completed ? 'line-through text-[var(--text-muted)]' : ''
              }`}
            >
              {todo.title}
            </span>

            {/* Context details: Tags and Subtask Progress */}
            {hasContextDetails && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono rounded bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-soft)]"
                  >
                    #{tag}
                  </span>
                ))}
                {hasSubtasks && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono ${
                      completedSubtasksCount === subtasks.length
                        ? 'text-[var(--focus)] font-medium'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <ListChecks size={11} />
                    {completedSubtasksCount}/{subtasks.length} subtasks
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Metadata items — Responsive wrap to prevent mobile blowout */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--text-muted)] font-mono shrink-0 sm:shrink-0 pt-0.5 sm:pt-0">
            {/* Priority Indicator — Only show if High or Low */}
            {todo.priority === 'high' && (
              <span className="text-[10px] sm:text-[11px] font-semibold text-[var(--danger)] bg-[var(--danger)]/10 px-1.5 py-0.2 rounded shrink-0">
                HIGH
              </span>
            )}
            {todo.priority === 'low' && (
              <span className="text-[10px] sm:text-[11px] text-[var(--text-muted)] shrink-0">
                low
              </span>
            )}

            {/* Due Date */}
            {dateInfo && (
              <span
                className={`flex items-center gap-1 font-sans text-[11px] sm:text-xs shrink-0 ${
                  dateInfo.isOverdue && !todo.completed
                    ? 'text-[var(--danger)] font-medium'
                    : dateInfo.isToday && !todo.completed
                      ? 'text-[var(--primary)] font-medium'
                      : ''
                }`}
              >
                <Calendar size={12} />
                {dateInfo.text}
              </span>
            )}

            {/* Reminder */}
            {todo.reminderTime && (
              <span
                className={`flex items-center gap-1 font-sans text-[11px] sm:text-xs shrink-0 ${
                  todo.reminderSent
                    ? 'text-[var(--text-muted)] line-through'
                    : 'text-[var(--warning)]'
                }`}
              >
                <Bell size={12} />
                {todo.reminderSent
                  ? 'Sent'
                  : new Date(todo.reminderTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
              </span>
            )}

            {/* Estimate */}
            {formattedEst && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
                <Clock size={12} />
                {formattedEst}
              </span>
            )}

            {/* Focus Logged */}
            {todo.focusTimeSpent > 0 && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-[var(--focus)] font-medium shrink-0">
                <Clock size={12} />
                {todo.focusTimeSpent}m focused
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overflow Action Trigger & Portal Dropdown */}
      <div className="shrink-0">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setShowMenu((prev) => !prev)}
          className="p-1.5 sm:p-1 min-w-[36px] min-h-[36px] sm:min-w-[28px] sm:min-h-[28px] flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] opacity-80 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity cursor-pointer focus-visible:opacity-100"
          aria-label={`Options for ${todo.title}`}
          aria-haspopup="true"
          aria-expanded={showMenu}
        >
          <MoreVertical size={16} />
        </button>

        <DropdownMenu
          isOpen={showMenu}
          onClose={() => setShowMenu(false)}
          triggerRef={triggerRef}
          align="end"
        >
          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              onEdit(todo);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] text-left cursor-pointer w-full"
            role="menuitem"
          >
            <Edit2 size={13} /> Edit
          </button>
          {!todo.completed && (
            <button
              type="button"
              onClick={() => {
                setShowMenu(false);
                navigate(`/focus?task=${id}`);
              }}
              className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--focus)] hover:bg-[var(--focus-soft)] text-left cursor-pointer w-full"
              role="menuitem"
            >
              <Clock size={13} /> Focus
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setShowMenu(false);
              setShowConfirmDelete(true);
            }}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 text-left cursor-pointer w-full"
            role="menuitem"
          >
            <Trash2 size={13} /> Delete
          </button>
        </DropdownMenu>
      </div>

      {/* Inline Delete Confirmation with functional micro-animation */}
      <AnimatePresence>
        {showConfirmDelete && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-20 bg-[var(--bg-surface-elevated)] border border-[var(--danger)]/30 rounded-[var(--radius-md)] px-4 flex items-center justify-between gap-2 shadow-xs"
          >
            <span className="text-xs font-medium text-[var(--danger)]">
              Delete task &quot;{todo.title}&quot;?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="Cancel task deletion"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="px-3 py-1 text-xs bg-[var(--danger)] text-white font-medium rounded-md hover:opacity-90 cursor-pointer transition-opacity"
                aria-label="Confirm task deletion"
              >
                Delete
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
};

TaskItem.propTypes = {
  todo: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string.isRequired,
    dueDate: PropTypes.string,
    reminderTime: PropTypes.string,
    reminderSent: PropTypes.bool,
    priority: PropTypes.string,
    estimatedMinutes: PropTypes.number,
    focusTimeSpent: PropTypes.number,
    completed: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    subtasks: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        id: PropTypes.string,
        title: PropTypes.string,
        completed: PropTypes.bool,
        completedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      }),
    ),
  }).isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};
