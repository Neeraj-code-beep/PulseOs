import PropTypes from 'prop-types';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Calendar,
  Bell,
  Flag,
  Clock,
  X,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Check,
  Tag,
  ListChecks,
} from 'lucide-react';
import { useNotificationPermission } from '../../utils/useNotificationPermission';
import { NotificationPermissionDialog } from '../notifications/NotificationPermissionDialog';
import { TaskBreakdownPanel } from '../ai/TaskBreakdownPanel';
import { TaskEstimatorPanel } from '../ai/TaskEstimatorPanel';
import { ScheduleProposalPanel } from '../ai/ScheduleProposalPanel';
import { useTodo } from '../../context/useTodo';

export const TaskEditor = ({ task, onSave, onClose }) => {
  const {
    todos,
    addSubtask,
    addSubtasks,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    addTaskTag,
    removeTaskTag,
  } = useTodo();

  const { showDialog, checkAndPromptPermission, handleConfirmAllow, handleDismiss } =
    useNotificationPermission();

  const taskId = task._id || task.id;
  const currentTask = todos.find((t) => (t._id || t.id) === taskId) || task;
  const subtasks = Array.isArray(currentTask.subtasks) ? currentTask.subtasks : [];
  const tags = Array.isArray(currentTask.tags) ? currentTask.tags : [];

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
  const [aiMode, setAiMode] = useState(null); // null | 'breakdown' | 'estimate' | 'schedule'

  // Subtask UI state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskError, setSubtaskError] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');

  // Tag UI state
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState('');

  // Subtask actions
  const handleAddSubtask = async () => {
    const clean = newSubtaskTitle.trim();
    if (!clean) return;
    if (clean.length > 300) {
      setSubtaskError('Subtask title cannot exceed 300 characters');
      return;
    }
    setSubtaskError('');
    try {
      await addSubtask(taskId, clean);
      setNewSubtaskTitle('');
    } catch (err) {
      setSubtaskError(err.response?.data?.message || 'Failed to add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtask(taskId, subtaskId);
    } catch {
      // Handled in provider
    }
  };

  const handleStartEditSubtask = (sub) => {
    setEditingSubtaskId(sub._id || sub.id);
    setEditingSubtaskTitle(sub.title || '');
  };

  const handleSaveSubtaskTitle = async (subtaskId) => {
    const clean = editingSubtaskTitle.trim();
    if (!clean) return;
    try {
      await updateSubtask(taskId, subtaskId, { title: clean });
      setEditingSubtaskId(null);
      setEditingSubtaskTitle('');
    } catch {
      // Handled in provider
    }
  };

  const handleCancelEditSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      await deleteSubtask(taskId, subtaskId);
    } catch {
      // Handled in provider
    }
  };

  // Tag actions
  const handleAddTag = async () => {
    const clean = newTag.trim().toLowerCase();
    if (!clean) return;
    if (clean.length > 30) {
      setTagError('Tag cannot exceed 30 characters');
      return;
    }
    if (tags.includes(clean)) {
      setTagError('Tag already exists');
      return;
    }
    if (tags.length >= 5) {
      setTagError('Maximum 5 tags allowed');
      return;
    }
    setTagError('');
    try {
      await addTaskTag(taskId, clean);
      setNewTag('');
    } catch (err) {
      setTagError(err.response?.data?.message || 'Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      await removeTaskTag(taskId, tagToRemove);
    } catch {
      // Handled in provider
    }
  };

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

    // Check if reminderTime was changed
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

  const handleApplyBreakdown = async (aiSubtasks, totalMins) => {
    if (totalMins) {
      setEstimatedMinutes(totalMins);
    }
    if (!taskId) {
      setSubtaskError('Task must be saved before adding persistent subtasks.');
      throw new Error('Task must be saved before adding persistent subtasks.');
    }
    await addSubtasks(taskId, aiSubtasks);
    setAiMode(null);
  };

  const handleApplyEstimate = (mins) => {
    if (mins) {
      setEstimatedMinutes(mins);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <form
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
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

          {/* Title */}
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            required
          />

          {/* 2x2 Grid: Due Date, Reminder, Priority, Estimate */}
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

          {/* Tags Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-soft)]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Tag size={13} className="text-[var(--accent)]" />
                <span>Tags</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)]">
                  ({tags.length}/5)
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 min-h-6">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] font-mono"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-[var(--text-muted)] hover:text-[var(--danger)] rounded-xs p-0.5 cursor-pointer"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}

              {tags.length < 5 && (
                <div className="inline-flex items-center">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => {
                      setNewTag(e.target.value);
                      if (tagError) setTagError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="+ Add tag..."
                    maxLength={30}
                    className="w-24 px-2 py-0.5 text-xs bg-transparent border border-dashed border-[var(--border)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:w-32 focus:border-[var(--primary)] transition-all font-mono"
                  />
                </div>
              )}
            </div>

            {tagError && (
              <span className="text-[10px] text-[var(--danger)] font-mono">{tagError}</span>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-soft)]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ListChecks size={13} className="text-[var(--primary)]" />
                <span>Subtasks</span>
                {subtasks.length > 0 && (
                  <span className="text-[10px] font-normal text-[var(--text-muted)]">
                    ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                  </span>
                )}
              </label>
              {!isAddingSubtask && (
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-[11px] font-medium text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Add subtask
                </button>
              )}
            </div>

            {/* Existing Subtasks List */}
            {subtasks.length > 0 && (
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {subtasks.map((sub) => {
                  const subId = sub._id || sub.id;
                  const isEditing = editingSubtaskId === subId;

                  return (
                    <div
                      key={subId}
                      className="group flex items-center justify-between gap-2 p-1.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] hover:border-[var(--border)] transition-colors text-xs"
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editingSubtaskTitle}
                            onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveSubtaskTitle(subId);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleCancelEditSubtask();
                              }
                            }}
                            autoFocus
                            maxLength={300}
                            className="flex-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSubtaskTitle(subId)}
                            className="p-1 text-[var(--focus)] hover:bg-[var(--bg-surface)] rounded cursor-pointer"
                            aria-label="Save subtask title"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditSubtask}
                            className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] rounded cursor-pointer"
                            aria-label="Cancel editing"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sub.completed || false}
                              onChange={() => handleToggleSubtask(subId)}
                              className="sr-only"
                            />
                            <div
                              className={`w-3.5 h-3.5 rounded-[3px] border transition-all flex items-center justify-center shrink-0 ${
                                sub.completed
                                  ? 'bg-[var(--focus)] border-[var(--focus)] text-white'
                                  : 'border-[var(--border-strong)] hover:border-[var(--primary)]'
                              }`}
                            >
                              {sub.completed && <Check size={9} strokeWidth={3} />}
                            </div>
                            <span
                              className={`truncate text-xs text-[var(--text-primary)] ${
                                sub.completed ? 'line-through text-[var(--text-muted)]' : ''
                              }`}
                            >
                              {sub.title}
                            </span>
                          </label>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleStartEditSubtask(sub)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] rounded cursor-pointer"
                              aria-label="Edit subtask"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(subId)}
                              className="p-1 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded cursor-pointer"
                              aria-label="Delete subtask"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Subtask Input */}
            {isAddingSubtask && (
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => {
                      setNewSubtaskTitle(e.target.value);
                      if (subtaskError) setSubtaskError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                        setSubtaskError('');
                      }
                    }}
                    autoFocus
                    placeholder="Subtask title (press Enter to add)..."
                    maxLength={300}
                    className="flex-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--primary)]"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="py-1 px-2.5 text-xs shrink-0"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingSubtask(false);
                      setNewSubtaskTitle('');
                      setSubtaskError('');
                    }}
                    className="py-1 px-2 text-xs shrink-0"
                  >
                    Cancel
                  </Button>
                </div>
                {subtaskError && (
                  <span className="text-[10px] text-[var(--danger)] font-mono">{subtaskError}</span>
                )}
              </div>
            )}
          </div>

          {/* AI Productivity Engine Section */}
          {aiMode === null && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--border-soft)]">
              <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] w-full tracking-wider">
                PULSE ASSISTANT
              </span>

              <button
                type="button"
                onClick={() => setAiMode('breakdown')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] transition-all cursor-pointer shadow-xs hover:border-[var(--border-soft)]"
              >
                <Sparkles size={13} className="text-[var(--accent)]" />
                <span>Break down</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode('estimate')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] transition-all cursor-pointer shadow-xs hover:border-[var(--border-soft)]"
              >
                <Clock size={13} className="text-[var(--accent)]" />
                <span>Estimate with Pulse</span>
              </button>

              <button
                type="button"
                onClick={() => setAiMode('schedule')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] transition-all cursor-pointer shadow-xs hover:border-[var(--border-soft)]"
              >
                <Calendar size={13} className="text-[var(--accent)]" />
                <span>Smart Schedule</span>
              </button>
            </div>
          )}

          {aiMode === 'breakdown' && (
            <TaskBreakdownPanel
              title={title}
              context={{ priority, dueDate, estimatedMinutes }}
              onApplyBreakdown={handleApplyBreakdown}
              onClose={() => setAiMode(null)}
            />
          )}

          {aiMode === 'estimate' && (
            <TaskEstimatorPanel
              title={title}
              context={{ priority, dueDate, estimatedMinutes }}
              onApplyEstimate={handleApplyEstimate}
              onClose={() => setAiMode(null)}
            />
          )}

          {aiMode === 'schedule' && (
            <ScheduleProposalPanel
              taskId={task._id}
              title={title}
              estimatedMinutes={estimatedMinutes}
              context={{ priority, dueDate }}
              onClose={() => setAiMode(null)}
            />
          )}

          {/* Action Buttons */}
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

TaskEditor.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    title: PropTypes.string,
    dueDate: PropTypes.string,
    reminderTime: PropTypes.string,
    priority: PropTypes.string,
    estimatedMinutes: PropTypes.number,
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
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
