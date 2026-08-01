import { useState, useRef, useEffect } from 'react';
import { formatDateDisplay, formatEstimate } from '../../utils/taskUtils';
import { MoreVertical, Edit2, Trash2, Calendar, Clock, Bell, Check } from 'lucide-react';

export const TaskItem = ({ todo, onToggleComplete, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const menuRef = useRef(null);
  const id = todo._id || todo.id;

  const dateInfo = formatDateDisplay(todo.dueDate);
  const formattedEst = formatEstimate(todo.estimatedMinutes);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`group relative flex items-center justify-between px-4 py-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] transition-colors ${
        todo.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
        {/* Accessible Custom Circular Checkbox Control */}
        <label className="relative flex items-center justify-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={todo.completed || false}
            onChange={(e) => onToggleComplete(id, e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
              todo.completed
                ? 'bg-[var(--focus)] border-[var(--focus)] text-white'
                : 'border-[var(--border-strong)] group-hover:border-[var(--primary)]'
            }`}
          >
            {todo.completed && <Check size={10} strokeWidth={3} />}
          </div>
        </label>

        {/* Title & Inline Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 min-w-0 flex-1">
          <span
            className={`text-sm font-medium text-[var(--text-primary)] truncate ${
              todo.completed ? 'line-through text-[var(--text-muted)]' : ''
            }`}
          >
            {todo.title}
          </span>

          {/* Metadata items */}
          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] font-mono shrink-0">
            {/* Priority Indicator — Only show if High or Low */}
            {todo.priority === 'high' && (
              <span className="text-[11px] font-semibold text-[var(--danger)] bg-[var(--danger)]/10 px-1.5 py-0.2 rounded">
                HIGH
              </span>
            )}
            {todo.priority === 'low' && (
              <span className="text-[11px] text-[var(--text-muted)]">
                low
              </span>
            )}

            {/* Due Date */}
            {dateInfo && (
              <span
                className={`flex items-center gap-1 font-sans ${
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
                className={`flex items-center gap-1 font-sans ${
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
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formattedEst}
              </span>
            )}

            {/* Focus Logged */}
            {todo.focusTimeSpent > 0 && (
              <span className="flex items-center gap-1 text-[var(--focus)] font-medium">
                <Clock size={12} />
                {todo.focusTimeSpent}m focused
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Overflow Action Trigger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-app)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Task options"
        >
          <MoreVertical size={15} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-7 z-30 w-32 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] shadow-md py-1 flex flex-col">
            <button
              onClick={() => {
                setShowMenu(false);
                onEdit(todo);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] text-left cursor-pointer"
            >
              <Edit2 size={13} /> Edit
            </button>
            {!todo.completed && (
              <a
                href={`/focus?task=${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setShowMenu(false);
                  window.location.href = `/focus?task=${id}`;
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--focus)] hover:bg-[var(--focus-soft)] text-left cursor-pointer"
              >
                <Clock size={13} /> Focus
              </a>
            )}
            <button
              onClick={() => {
                setShowMenu(false);
                setShowConfirmDelete(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 text-left cursor-pointer"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Inline Delete Confirmation */}
      {showConfirmDelete && (
        <div className="absolute inset-0 z-20 bg-[var(--bg-surface-elevated)] border border-[var(--danger)]/30 rounded-[var(--radius-md)] px-4 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-[var(--danger)]">
            Delete task?
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(id)}
              className="px-2.5 py-1 text-xs bg-[var(--danger)] text-white rounded-md cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
