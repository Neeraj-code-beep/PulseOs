import API from './Api';

/**
 * Calls backend POST /api/ai/breakdown to generate structured AI task breakdown.
 * @param {string} title - Task title.
 * @param {Object} [context] - Optional task context (subject, priority, dueDate, estimatedMinutes).
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const breakDownTaskApi = async (title, context) => {
  const res = await API.post('api/ai/breakdown', { title, context });
  return res.data;
};
