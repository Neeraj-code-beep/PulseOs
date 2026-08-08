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

/**
 * Calls backend POST /api/ai/estimate to generate realistic task duration estimate.
 * @param {string} title - Task title.
 * @param {Object} [context] - Optional task context (priority, dueDate, currentEstimate).
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const estimateTaskTimeApi = async (title, context) => {
  const res = await API.post('api/ai/estimate', { title, context });
  return res.data;
};

/**
 * Calls backend POST /api/ai/schedule to generate proposed focus schedule blocks.
 * @param {Object} payload - { title, estimatedMinutes, context, availability: { date, startTime, endTime } }
 * @returns {Promise<Object>} API response payload { success, message, data }.
 */
export const proposeScheduleApi = async (payload) => {
  const res = await API.post('api/ai/schedule', payload);
  return res.data;
};

