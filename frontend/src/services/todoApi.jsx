import API from './Api';

/**
 * Fetches all todos for the authenticated user.
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const getTodosApi = async () => {
  const res = await API.get('api/todos');
  return res.data;
};

/**
 * Creates a new todo for the authenticated user.
 * @param {Object} payload - Task creation payload (title, dueDate, reminderTime, priority, estimatedMinutes, tags, subtasks).
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const createTodoApi = async (payload) => {
  const res = await API.post('api/todos', payload);
  return res.data;
};

/**
 * Updates a todo owned by the authenticated user.
 * @param {string} id - Todo ID.
 * @param {Object} payload - Fields to update.
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const updateTodoApi = async (id, payload) => {
  const res = await API.patch(`api/todos/${id}`, payload);
  return res.data;
};

/**
 * Deletes a todo owned by the authenticated user.
 * @param {string} id - Todo ID.
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const deleteTodoApi = async (id) => {
  const res = await API.delete(`api/todos/${id}`);
  return res.data;
};
