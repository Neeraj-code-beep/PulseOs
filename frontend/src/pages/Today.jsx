import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TodoContext } from '../context/TodoContext';
import { HeroWorkspace } from '../components/home/HeroWorkspace';
import { DailyPlanCard } from '../components/ai/DailyPlanCard';
import { DailyWorkspace } from '../components/home/DailyWorkspace';
import { Methodology } from '../components/home/Methodology';
import { FocusPreview } from '../components/home/FocusPreview';
import { PlanningPreview } from '../components/home/PlanningPreview';
import { InsightsPreview } from '../components/home/InsightsPreview';
import { FinalCTA } from '../components/home/FinalCTA';

export const Today = () => {
  const navigate = useNavigate();
  const { todos, isLoading, updateTodo } = useContext(TodoContext);

  const todayTodos = todos.filter((t) => {
    if (t.completed) return false;
    if (!t.dueDate) return true;
    const d = new Date(t.dueDate);
    return d <= new Date();
  });

  const completedToday = todos.filter((t) => t.completed);

  const now = new Date();
  const nextReminderTodo = todos
    .filter((t) => t.reminderTime && !t.completed && !t.reminderSent && new Date(t.reminderTime) > now)
    .sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime))[0] || null;

  const handleToggleComplete = async (id, isCompleted) => {
    await updateTodo(id, undefined, undefined, isCompleted);
  };

  return (
    <div className="flex flex-col gap-4 -mt-2">
      {/* 1. Hero Workspace Showcase */}
      <HeroWorkspace
        openCount={todayTodos.length}
        completedCount={completedToday.length}
        onPlanClick={() => navigate('/tasks?add=true')}
        onFocusClick={() => navigate('/focus')}
      />

      {/* 2. AI Daily Focus Recommendations Card */}
      <DailyPlanCard />

      {/* 3. Daily Execution Workspace */}
      <DailyWorkspace
        todos={todos}
        isLoading={isLoading}
        onToggleComplete={handleToggleComplete}
        nextReminderTodo={nextReminderTodo}
      />

      {/* 4. Methodology Story (Dark Contrast Section) */}
      <Methodology />

      {/* 5. Focus Preview */}
      <FocusPreview />

      {/* 6. Smart Planning Preview */}
      <PlanningPreview />

      {/* 7. Productivity Insights Preview */}
      <InsightsPreview />

      {/* 8. Final Action Call */}
      <FinalCTA />
    </div>
  );
};
