import { useContext } from 'react';
import { useFocus } from '../../context/useFocus';
import { TodoContext } from '../../context/TodoContext';
import { CheckCircle2, Play, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export const SessionComplete = () => {
  const { plannedMinutes, selectedTaskId, resetTimer } = useFocus();
  const { todos, updateTodo } = useContext(TodoContext);

  const selectedTodo = todos.find((t) => (t._id || t.id) === selectedTaskId);

  const handleMarkComplete = async () => {
    if (!selectedTaskId) return;
    await updateTodo(selectedTaskId, undefined, undefined, true);
    resetTimer();
  };

  return (
    <div className="w-full bg-[var(--bg-surface)] border border-[var(--focus)]/30 rounded-[var(--radius-lg)] p-6 text-center flex flex-col items-center gap-4 shadow-lg animate-in fade-in zoom-in-95 duration-200">
      <div className="p-3 rounded-full bg-[var(--focus-soft)] text-[var(--focus)]">
        <CheckCircle2 size={36} />
      </div>

      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] font-sans">
          Focus Session Complete!
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Great work! Logged <span className="font-bold text-[var(--focus)]">{plannedMinutes} minutes</span> of focused study time.
        </p>
      </div>

      {selectedTodo && (
        <div className="w-full max-w-sm p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs flex items-center justify-between">
          <span className="text-[var(--text-muted)]">Attached task:</span>
          <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
            {selectedTodo.title}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        <Button
          variant="primary"
          onClick={resetTimer}
          icon={Play}
          size="sm"
          className="bg-[var(--focus)] text-white hover:bg-[var(--focus)]/90"
        >
          Start Another Session
        </Button>

        {selectedTodo && !selectedTodo.completed && (
          <Button
            variant="secondary"
            onClick={handleMarkComplete}
            icon={Check}
            size="sm"
          >
            Mark Task Complete
          </Button>
        )}
      </div>
    </div>
  );
};
