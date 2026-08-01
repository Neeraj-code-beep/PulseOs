import { TaskItem } from './TaskItem';

export const TaskList = ({ todos, onToggleComplete, onDelete, onEdit }) => {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] divide-y divide-[var(--border-soft)] shadow-xs overflow-hidden">
      {todos.map((todo) => {
        const id = todo._id || todo.id;
        return (
          <TaskItem
            key={id}
            todo={todo}
            onToggleComplete={onToggleComplete}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
};
