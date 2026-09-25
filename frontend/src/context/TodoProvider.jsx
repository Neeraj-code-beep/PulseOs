import { useEffect, useState } from 'react';
import {
  getTodosApi,
  createTodoApi,
  updateTodoApi,
  deleteTodoApi,
} from '../services/todoApi';
import { toast } from 'react-toastify';
import { TodoContext } from './TodoContext';
import { useAuth } from './useAuth';

// Helper to normalize task data ensuring tags and subtasks default to arrays
const normalizeTodo = (t) => {
  if (!t) return t;
  return {
    ...t,
    tags: Array.isArray(t.tags) ? t.tags : [],
    subtasks: Array.isArray(t.subtasks)
      ? t.subtasks.map((st) => ({
          ...st,
          completed: Boolean(st.completed),
          completedAt: st.completedAt || null,
        }))
      : [],
  };
};

const TodoProvider = ({ children }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [todos, settodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // GET todos
  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTodosApi();
      if (res && res.success && Array.isArray(res.data)) {
        settodos(res.data.map(normalizeTodo));
      } else if (Array.isArray(res)) {
        settodos(res.map(normalizeTodo));
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to fetch tasks';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Synchronize local state when a reminder fires
  const markReminderSentLocally = (id) => {
    settodos((prev) =>
      prev.map((t) =>
        (t._id || t.id) === id ? { ...t, reminderSent: true } : t,
      ),
    );
  };

  // ADD Todo
  const addTodo = async (taskData) => {
    const payload = typeof taskData === 'string' ? { title: taskData } : { ...taskData };
    if (!payload.title || !payload.title.trim()) return;

    try {
      const res = await createTodoApi(payload);
      if (res && res.success && res.data) {
        const normalized = normalizeTodo(res.data);
        settodos((prev) => [normalized, ...prev]);
        toast.success('Task Created');
        return normalized;
      } else {
        fetchTodos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  };

  // DELETE Todo
  const deleteTodo = async (id) => {
    try {
      const res = await deleteTodoApi(id);
      if (res && res.success) {
        settodos((prev) => prev.filter((todo) => (todo._id || todo.id) !== id));
        toast.success('Task Deleted');
      } else {
        fetchTodos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // UPDATE Todo
  const updateTodo = async (id, updateFields, reminderTime, completed) => {
    try {
      let payload = {};
      if (typeof updateFields === 'object' && updateFields !== null) {
        payload = { ...updateFields };
      } else {
        if (updateFields !== undefined) payload.title = updateFields;
        if (reminderTime !== undefined) payload.reminderTime = reminderTime;
        if (completed !== undefined) payload.completed = completed;
      }

      const res = await updateTodoApi(id, payload);
      if (res && res.success && res.data) {
        const normalized = normalizeTodo(res.data);
        settodos((prev) =>
          prev.map((todo) =>
            (todo._id || todo.id) === id ? normalized : todo,
          ),
        );
        toast.success('Task Updated');
        return normalized;
      } else {
        fetchTodos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  };

  // REPLACE single Todo in local state
  const replaceTodo = (updatedTodo) => {
    if (!updatedTodo || (!updatedTodo._id && !updatedTodo.id)) return;
    const targetId = updatedTodo._id || updatedTodo.id;
    const normalized = normalizeTodo(updatedTodo);
    settodos((prev) =>
      prev.map((todo) =>
        (todo._id || todo.id) === targetId ? normalized : todo,
      ),
    );
  };

  // Subtask Helpers
  const addSubtask = async (taskId, title) => {
    if (!title || typeof title !== 'string' || !title.trim()) return;
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.subtasks) ? target.subtasks : [];
    const updatedSubtasks = [...existing, { title: title.trim(), completed: false }];
    return updateTodo(taskId, { subtasks: updatedSubtasks });
  };

  const updateSubtask = async (taskId, subtaskId, updates) => {
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.subtasks) ? target.subtasks : [];
    const updatedSubtasks = existing.map((sub) =>
      (sub._id || sub.id) === subtaskId ? { ...sub, ...updates } : sub,
    );
    return updateTodo(taskId, { subtasks: updatedSubtasks });
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.subtasks) ? target.subtasks : [];
    const updatedSubtasks = existing.map((sub) =>
      (sub._id || sub.id) === subtaskId ? { ...sub, completed: !sub.completed } : sub,
    );
    return updateTodo(taskId, { subtasks: updatedSubtasks });
  };

  const addSubtasks = async (taskId, newItems) => {
    if (!taskId) return;
    if (!Array.isArray(newItems) || newItems.length === 0) return;
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;

    const existing = Array.isArray(target.subtasks) ? target.subtasks : [];
    const existingTitles = new Set(
      existing.map((s) => (s.title || '').trim().toLowerCase())
    );

    const seen = new Set();
    const toAdd = [];

    for (const item of newItems) {
      const rawTitle = typeof item === 'string' ? item : item?.title;
      if (!rawTitle || typeof rawTitle !== 'string') continue;
      const cleanTitle = rawTitle.trim();
      if (!cleanTitle || cleanTitle.length > 300) continue;
      const lower = cleanTitle.toLowerCase();
      if (existingTitles.has(lower) || seen.has(lower)) continue;
      seen.add(lower);
      toAdd.push({ title: cleanTitle, completed: false, completedAt: null });
    }

    if (toAdd.length === 0) {
      toast.info('All suggested subtasks already exist.');
      return target;
    }

    const updatedSubtasks = [...existing, ...toAdd];
    return updateTodo(taskId, { subtasks: updatedSubtasks });
  };

  const deleteSubtask = async (taskId, subtaskId) => {
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.subtasks) ? target.subtasks : [];
    const updatedSubtasks = existing.filter((sub) => (sub._id || sub.id) !== subtaskId);
    return updateTodo(taskId, { subtasks: updatedSubtasks });
  };

  // Tag Helpers
  const updateTaskTags = async (taskId, tags) => {
    const tagsArray = Array.isArray(tags) ? tags : [];
    return updateTodo(taskId, { tags: tagsArray });
  };

  const setTaskTags = async (taskId, tags) => {
    return updateTaskTags(taskId, tags);
  };

  const addTaskTag = async (taskId, tag) => {
    if (!tag || typeof tag !== 'string' || !tag.trim()) return;
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.tags) ? target.tags : [];
    const cleanTag = tag.trim().toLowerCase();
    if (existing.includes(cleanTag)) return target;
    const updatedTags = [...existing, cleanTag];
    return updateTodo(taskId, { tags: updatedTags });
  };

  const removeTaskTag = async (taskId, tag) => {
    if (!tag || typeof tag !== 'string') return;
    const target = todos.find((t) => (t._id || t.id) === taskId);
    if (!target) return;
    const existing = Array.isArray(target.tags) ? target.tags : [];
    const cleanTag = tag.trim().toLowerCase();
    const updatedTags = existing.filter((t) => t.toLowerCase() !== cleanTag);
    return updateTodo(taskId, { tags: updatedTags });
  };

  useEffect(() => {
    if (!isAuthLoading) {
      if (isAuthenticated) {
        fetchTodos();
      } else {
        settodos([]);
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, isAuthLoading]);

  return (
    <TodoContext.Provider
      value={{
        todos,
        isLoading,
        error,
        fetchTodos,
        addTodo,
        deleteTodo,
        updateTodo,
        markReminderSentLocally,
        replaceTodo,
        addSubtask,
        addSubtasks,
        updateSubtask,
        toggleSubtask,
        deleteSubtask,
        updateTaskTags,
        setTaskTags,
        addTaskTag,
        removeTaskTag,
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export default TodoProvider;
