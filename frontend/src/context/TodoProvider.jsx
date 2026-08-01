import { useEffect, useState } from 'react';
import API from '../services/Api';
import { toast } from 'react-toastify';
import { TodoContext } from './TodoContext';

const TodoProvider = ({ children }) => {
  const [todos, settodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // GET todos
  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await API.get('api/todos');
      if (res.data && res.data.success) {
        settodos(res.data.data);
      } else if (Array.isArray(res.data)) {
        settodos(res.data);
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
      const res = await API.post('api/todos', payload);
      if (res.data && res.data.success && res.data.data) {
        settodos((prev) => [res.data.data, ...prev]);
        toast.success('Task Created');
        return res.data.data;
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
      const res = await API.delete(`api/todos/${id}`);
      if (res.data && res.data.success) {
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

      const res = await API.patch(`api/todos/${id}`, payload);
      if (res.data && res.data.success && res.data.data) {
        settodos((prev) =>
          prev.map((todo) =>
            (todo._id || todo.id) === id ? res.data.data : todo,
          ),
        );
        toast.success('Task Updated');
        return res.data.data;
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
    settodos((prev) =>
      prev.map((todo) =>
        (todo._id || todo.id) === targetId ? updatedTodo : todo,
      ),
    );
  };

  useEffect(() => {
    fetchTodos();
  }, []);

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
      }}
    >
      {children}
    </TodoContext.Provider>
  );
};

export default TodoProvider;
