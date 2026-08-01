import { useState, useContext, useEffect, useRef } from 'react';
import { TodoContext } from '../../context/TodoContext';
import { Button } from '../ui/Button';
import { Plus, Calendar, Bell, Flag, Clock, X } from 'lucide-react';
import { useNotificationPermission } from '../../utils/useNotificationPermission';
import { NotificationPermissionDialog } from '../notifications/NotificationPermissionDialog';

export const TaskQuickAdd = ({ autoFocus = false, onComplete }) => {
  const { addTodo } = useContext(TodoContext);
  const { showDialog, checkAndPromptPermission, handleConfirmAllow, handleDismiss } =
    useNotificationPermission();

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      setIsExpanded(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [autoFocus]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setTitle('');
    setDueDate('');
    setReminderTime('');
    setPriority('medium');
    setEstimatedMinutes('');
    setActiveTab(null);
    if (onComplete) onComplete();
  };

  const executeAddTodo = async () => {
    setIsLoading(true);
    try {
      await addTodo({
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        reminderTime: reminderTime ? new Date(reminderTime).toISOString() : null,
        priority,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      });

      setTitle('');
      setDueDate('');
      setReminderTime('');
      setPriority('medium');
      setEstimatedMinutes('');
      setActiveTab(null);
      if (onComplete) onComplete();
    } catch {
      // Handled in provider
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !title.trim()) return;

    if (reminderTime) {
      checkAndPromptPermission(() => {
        executeAddTodo();
      });
    } else {
      executeAddTodo();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs text-xs font-medium"
      >
        <Plus size={15} className="text-[var(--primary)]" />
        <span>Add a task...</span>
      </button>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 shadow-md flex flex-col gap-3 transition-all"
      >
        <div className="flex items-center justify-between gap-2">
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs your attention?"
            className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] border-none outline-none"
          />
          <button
            type="button"
            onClick={handleCancel}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progressive Control Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border-soft)] text-xs">
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'due' ? null : 'due')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border text-[11px] transition-colors cursor-pointer ${
              dueDate
                ? 'bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary)]/30'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            <Calendar size={13} />
            <span>{dueDate || 'Due'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'reminder' ? null : 'reminder')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border text-[11px] transition-colors cursor-pointer ${
              reminderTime
                ? 'bg-[var(--accent-soft)] text-[var(--warning)] border-[var(--warning)]/30'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            <Bell size={13} />
            <span>{reminderTime ? new Date(reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reminder'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'priority' ? null : 'priority')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border text-[11px] transition-colors cursor-pointer ${
              priority === 'high'
                ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            <Flag size={13} />
            <span className="capitalize">{priority}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'estimate' ? null : 'estimate')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] border text-[11px] transition-colors cursor-pointer ${
              estimatedMinutes
                ? 'bg-[var(--focus-soft)] text-[var(--focus)] border-[var(--focus)]/30'
                : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            <Clock size={13} />
            <span>{estimatedMinutes ? `${estimatedMinutes}m` : 'Estimate'}</span>
          </button>
        </div>

        {/* Expanded Sub-Input Panel */}
        {activeTab && (
          <div className="p-3 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] border border-[var(--border-soft)] text-xs">
            {activeTab === 'due' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Set Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-[var(--bg-surface)] p-1.5 rounded border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            )}

            {activeTab === 'reminder' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[var(--text-muted)]">Set Reminder Time</label>
                <input
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-[var(--bg-surface)] p-1.5 rounded border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            )}

            {activeTab === 'priority' && (
              <div className="flex items-center gap-2">
                {['low', 'medium', 'high'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded text-xs capitalize cursor-pointer ${
                      priority === p
                        ? 'bg-[var(--primary)] text-white font-medium'
                        : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'estimate' && (
              <div className="flex items-center gap-2">
                {[15, 25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins.toString())}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                      estimatedMinutes === mins.toString()
                        ? 'bg-[var(--focus)] text-white font-medium'
                        : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
                <input
                  type="number"
                  placeholder="Custom"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  className="w-20 bg-[var(--bg-surface)] p-1 rounded border border-[var(--border)] text-xs text-[var(--text-primary)] outline-none"
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-soft)]">
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={!title.trim()}
          >
            Add task
          </Button>
        </div>
      </form>

      <NotificationPermissionDialog
        isOpen={showDialog}
        onConfirm={handleConfirmAllow}
        onCancel={handleDismiss}
      />
    </>
  );
};
