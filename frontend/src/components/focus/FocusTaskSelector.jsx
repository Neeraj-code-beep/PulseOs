import { useContext } from 'react';
import { TodoContext } from '../../context/TodoContext';
import { useFocus } from '../../context/useFocus';
import { CheckSquare, Clock } from 'lucide-react';
import { formatEstimate } from '../../utils/taskUtils';

export const FocusTaskSelector = () => {
  const { todos } = useContext(TodoContext);
  const { selectedTaskId, setSelectedTaskId, timerState } = useFocus();
  const isDisabled = timerState !== 'IDLE';

  // Only incomplete tasks
  const incompleteTodos = todos.filter((t) => !t.completed);
  const selectedTodo = todos.find((t) => (t._id || t.id) === selectedTaskId);

  return (
    <div className="flex flex-col gap-2 w-full">
      <label htmlFor="focus-target-task-select" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
        <span>Target Task</span>
        {selectedTodo && (
          <span className="text-[11px] font-mono text-[var(--focus)] normal-case font-normal">
            Attached
          </span>
        )}
      </label>

      <div className="relative">
        <select
          id="focus-target-task-select"
          disabled={isDisabled}
          value={selectedTaskId || ''}
          onChange={(e) => setSelectedTaskId(e.target.value || null)}
          aria-label="Target task for focus session"
          className={`w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] font-medium outline-none cursor-pointer appearance-none transition-colors ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--border-strong)]'
          }`}
        >
          <option value="">-- No task attached (General Focus) --</option>
          {incompleteTodos.map((todo) => {
            const id = todo._id || todo.id;
            const est = formatEstimate(todo.estimatedMinutes);
            const spent = todo.focusTimeSpent ? `${todo.focusTimeSpent}m logged` : '';
            const meta = [est, spent].filter(Boolean).join(' · ');

            return (
              <option key={id} value={id}>
                {todo.title} {meta ? `(${meta})` : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Selected Task Snapshot Details */}
      {selectedTodo && (
        <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] text-xs flex flex-col gap-1.5">
          <div className="flex items-center justify-between font-medium">
            <span className="text-[var(--text-primary)] truncate">{selectedTodo.title}</span>
            {selectedTodo.priority === 'high' && (
              <span className="text-[10px] font-semibold text-[var(--danger)] bg-[var(--danger)]/10 px-1.5 py-0.2 rounded shrink-0">
                HIGH
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-soft)]">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {selectedTodo.estimatedMinutes ? `${selectedTodo.estimatedMinutes}m est.` : 'No est.'}
            </span>
            <span>
              {selectedTodo.focusTimeSpent ? `${selectedTodo.focusTimeSpent}m total focus` : '0m logged'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
