import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircle2, Calendar, ListTodo } from 'lucide-react';

export const TaskEmptyState = ({ activeFilter, onAddClick }) => {
  const configs = {
    today: {
      icon: CheckCircle2,
      title: 'Nothing due today.',
      description: 'Use the space to get ahead on upcoming assignments or take a break.',
      iconColor: 'text-[var(--success)]',
    },
    upcoming: {
      icon: Calendar,
      title: 'Your upcoming schedule is clear.',
      description: 'No future tasks are currently scheduled.',
      iconColor: 'text-[var(--primary)]',
    },
    completed: {
      icon: CheckCircle2,
      title: 'No completed tasks yet.',
      description: 'Finish a task to see your progress recorded here.',
      iconColor: 'text-[var(--text-muted)]',
    },
    all: {
      icon: ListTodo,
      title: 'No tasks found.',
      description: 'Add your first task to start organizing your study workload.',
      iconColor: 'text-[var(--primary)]',
    },
  };

  const config = configs[activeFilter] || configs.all;
  const Icon = config.icon;

  return (
    <Card className="p-10 text-center flex flex-col items-center justify-center gap-3 border-dashed my-4">
      <div className={`p-3 bg-[var(--bg-surface-elevated)] rounded-full ${config.iconColor}`}>
        <Icon size={32} />
      </div>
      <div>
        <h3 className="font-bold text-base">{config.title}</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
          {config.description}
        </p>
      </div>
      {onAddClick && activeFilter !== 'completed' && (
        <Button variant="secondary" size="sm" onClick={onAddClick} className="mt-2">
          Add Task
        </Button>
      )}
    </Card>
  );
};
