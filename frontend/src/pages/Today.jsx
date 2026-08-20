import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TodoContext } from '../context/TodoContext';
import { TodayHero } from '../components/home/TodayHero';
import { FocusContinuity } from '../components/home/FocusContinuity';
import { NextBestAction } from '../components/home/NextBestAction';
import { TodayProgress } from '../components/home/TodayProgress';
import { DailyPlanCard } from '../components/ai/DailyPlanCard';
import { DailyWorkspace } from '../components/home/DailyWorkspace';

export const Today = () => {
  const navigate = useNavigate();
  const { todos, isLoading, updateTodo } = useContext(TodoContext);

  const openTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  const now = new Date();
  const nextReminderTodo = todos
    .filter((t) => t.reminderTime && !t.completed && !t.reminderSent && new Date(t.reminderTime) > now)
    .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime))[0] || null;

  const handleToggleComplete = async (id, isCompleted) => {
    await updateTodo(id, undefined, undefined, isCompleted);
  };

  return (
    <div className="flex flex-col gap-6 -mt-2 pb-12">
      {/* 1. Active Focus Continuity Banner (if timer is RUNNING/PAUSED) */}
      <FocusContinuity />

      {/* 2. Command Center Today Hero Banner */}
      <TodayHero
        openCount={openTodos.length}
        completedCount={completedTodos.length}
        onPlanClick={() => navigate('/tasks?add=true')}
        onFocusClick={() => navigate('/focus')}
      />

      {/* 3. Primary Command Center Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Next Best Action Card */}
          <NextBestAction
            todos={todos}
            onToggleComplete={handleToggleComplete}
          />

          {/* Daily Execution List */}
          <DailyWorkspace
            todos={todos}
            isLoading={isLoading}
            onToggleComplete={handleToggleComplete}
            nextReminderTodo={nextReminderTodo}
          />
        </div>

        {/* Intelligence Sidebar (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Lightweight Telemetry Progress Summary */}
          <TodayProgress todos={todos} />

          {/* AI Daily Focus Recommendations */}
          <DailyPlanCard />
        </div>
      </div>
    </div>
  );
};

export default Today;
