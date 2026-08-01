import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Calendar, Bell, Flag, Clock, X } from 'lucide-react';
import { useNotificationPermission } from '../../utils/useNotificationPermission';
import { NotificationPermissionDialog } from '../notifications/NotificationPermissionDialog';

export const TaskEditor = ({ task, onSave, onClose }) => {
  const { showDialog, checkAndPromptPermission, handleConfirmAllow, handleDismiss } =
    useNotificationPermission();

  const [title, setTitle] = useState(task.title || '');
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  );
  const [reminderTime, setReminderTime] = useState(
    task.reminderTime
      ? new Date(task.reminderTime).toISOString().slice(0, 16)
      : '',
  );
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task.estimatedMinutes || '',
  );
  const [isLoading, setIsLoading] = useState(false);

  const executeSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        reminderTime: reminderTime ? new Date(reminderTime).toISOString() : null,
        priority,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      });
      onClose();
    } catch {
      // Handled in provider
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !title.trim()) return;

    // Check if reminderTime was changed (new or different from original)
    const originalReminder = task.reminderTime
      ? new Date(task.reminderTime).toISOString().slice(0, 16)
      : '';
    const reminderChanged = reminderTime && reminderTime !== originalReminder;

    if (reminderChanged) {
      checkAndPromptPermission(() => {
        executeSave();
      });
    } else {
      executeSave();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
      >
        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-2xl flex flex-col gap-4"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
            <h2 className="text-sm font-bold font-sans">Edit Task</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
          />

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Calendar size={12} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Bell size={12} /> Reminder
              </label>
              <input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none text-xs"
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] self-start cursor-pointer"
                >
                  Clear reminder
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Flag size={12} /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="p-1.5 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] outline-none cursor-pointer text-xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1">
                <Clock size={12} /> Estimate (mins)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 60"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="py-1 px-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-soft)]">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
              Save changes
            </Button>
          </div>
        </form>
      </div>

      <NotificationPermissionDialog
        isOpen={showDialog}
        onConfirm={handleConfirmAllow}
        onCancel={handleDismiss}
      />
    </>
  );
};
