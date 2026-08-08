const aiProvider = require('../integrations/ai/ai.provider');

/**
 * Validates task breakdown input parameters.
 */
const validateBreakdownInput = ({ title, context }) => {
  if (!title || typeof title !== 'string' || !title.trim()) {
    const err = new Error('Task title is required and must be a non-empty string.');
    err.status = 400;
    throw err;
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 500) {
    const err = new Error('Task title cannot exceed 500 characters.');
    err.status = 400;
    throw err;
  }

  if (context && typeof context !== 'object') {
    const err = new Error('Task context must be a valid object if provided.');
    err.status = 400;
    throw err;
  }

  return { title: trimmedTitle, context: context || {} };
};

/**
 * Builds structured prompt for the LLM.
 */
const buildPrompt = (title, context) => {
  const contextDetails = [];
  if (context.subject) contextDetails.push(`Subject: ${context.subject}`);
  if (context.priority) contextDetails.push(`Priority: ${context.priority}`);
  if (context.dueDate) contextDetails.push(`Due Date: ${context.dueDate}`);
  if (context.estimatedMinutes) contextDetails.push(`Current Estimate: ${context.estimatedMinutes} minutes`);

  const contextBlock = contextDetails.length > 0 ? `\nTask Context:\n- ${contextDetails.join('\n- ')}` : '';

  return `You are a student productivity planner helping break down a complex study task into realistic, actionable work blocks.

Task Title: "${title}"${contextBlock}

Rules:
1. Produce 2 to 5 concrete, actionable subtasks.
2. Each subtask must be independently actionable. Avoid vague titles like "work on it" or "continue".
3. Estimate realistic focused work time in minutes per subtask (prefer 15–60 minute blocks).
4. Keep the summary concise (1–2 sentences explaining the approach).
5. Return ONLY a valid JSON object matching this exact schema:

{
  "summary": "Brief 1-2 sentence breakdown summary",
  "subtasks": [
    {
      "title": "Clear actionable subtask title",
      "estimatedMinutes": 25
    }
  ],
  "totalEstimatedMinutes": 90
}`;
};

/**
 * Parses and validates raw LLM output against application constraints.
 */
const parseAndValidateOutput = (rawText) => {
  let parsed;
  try {
    // Strip markdown code fences if model returned ```json ... ```
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch {
    const err = new Error('AI provider returned an invalid JSON response format.');
    err.status = 502;
    throw err;
  }

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Malformed AI response.');
    err.status = 502;
    throw err;
  }

  // Validate summary
  const summary = typeof parsed.summary === 'string' && parsed.summary.trim()
    ? parsed.summary.trim()
    : 'Actionable focus breakdown generated for your task.';

  // Validate subtasks array (min 2, max 5)
  if (!Array.isArray(parsed.subtasks) || parsed.subtasks.length < 2) {
    const err = new Error('AI breakdown must contain at least 2 subtasks.');
    err.status = 502;
    throw err;
  }

  const validSubtasks = parsed.subtasks.slice(0, 5).map((item, idx) => {
    const title = item && typeof item.title === 'string' && item.title.trim()
      ? item.title.trim()
      : `Subtask ${idx + 1}`;
    const est = item && typeof item.estimatedMinutes === 'number' && item.estimatedMinutes > 0
      ? Math.round(item.estimatedMinutes)
      : 25;
    return { title, estimatedMinutes: est };
  });

  // Calculate canonical sum
  const totalEstimatedMinutes = validSubtasks.reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return {
    summary,
    subtasks: validSubtasks,
    totalEstimatedMinutes,
  };
};

/**
 * Main service method for task breakdown: orchestrates validation, prompt building, LLM call, and response validation.
 */
const breakDownTask = async ({ title, context }) => {
  const { title: validTitle, context: validContext } = validateBreakdownInput({ title, context });
  const prompt = buildPrompt(validTitle, validContext);

  try {
    const rawOutput = await aiProvider.generateText(prompt);
    return parseAndValidateOutput(rawOutput);
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.code === 'MISSING_API_KEY') {
      const err = new Error('AI planning is temporarily unavailable.');
      err.status = 503;
      throw err;
    }
    const err = new Error('AI planning is temporarily unavailable.');
    err.status = 502;
    throw err;
  }
};

/**
 * Validates task estimation input parameters.
 */
const validateEstimationInput = ({ title, context }) => {
  if (!title || typeof title !== 'string' || !title.trim()) {
    const err = new Error('Task title is required and must be a non-empty string.');
    err.status = 400;
    throw err;
  }

  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 500) {
    const err = new Error('Task title cannot exceed 500 characters.');
    err.status = 400;
    throw err;
  }

  if (context && typeof context !== 'object') {
    const err = new Error('Task context must be a valid object if provided.');
    err.status = 400;
    throw err;
  }

  return { title: trimmedTitle, context: context || {} };
};

/**
 * Builds structured prompt for task time estimation.
 */
const buildEstimationPrompt = (title, context) => {
  const contextDetails = [];
  if (context.priority) contextDetails.push(`Priority: ${context.priority}`);
  if (context.dueDate) contextDetails.push(`Due Date: ${context.dueDate}`);
  if (context.currentEstimate) contextDetails.push(`Current Estimate: ${context.currentEstimate} minutes`);

  const contextBlock = contextDetails.length > 0 ? `\nTask Context:\n- ${contextDetails.join('\n- ')}` : '';

  return `You are a student productivity planning assistant.
Estimate realistic focused work time in minutes for the provided task.

Task Title: "${title}"${contextBlock}

Rules:
1. Give one realistic estimate in minutes (positive integer, preferably between 15 and 240).
2. Prefer practical focused-work blocks suitable for student work.
3. Do not assume requirements that are not implied.
4. Do not overestimate just to be safe.
5. Provide a concise reason for the estimate (maximum 200 characters, no essay).
6. Return ONLY a valid JSON object matching this exact schema:

{
  "estimatedMinutes": 90,
  "reason": "Brief concise explanation of why this duration is realistic."
}`;
};

/**
 * Parses and validates LLM output for task time estimation.
 */
const parseAndValidateEstimationOutput = (rawText) => {
  let parsed;
  try {
    const cleanedText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanedText);
  } catch {
    const err = new Error('AI provider returned an invalid JSON response format.');
    err.status = 502;
    throw err;
  }

  if (!parsed || typeof parsed !== 'object') {
    const err = new Error('Malformed AI response.');
    err.status = 502;
    throw err;
  }

  const rawMinutes = Number(parsed.estimatedMinutes);
  if (!Number.isFinite(rawMinutes) || rawMinutes <= 0) {
    const err = new Error('AI provider returned an invalid duration estimate.');
    err.status = 502;
    throw err;
  }

  const estimatedMinutes = Math.round(rawMinutes);

  const reason = typeof parsed.reason === 'string' && parsed.reason.trim()
    ? parsed.reason.trim().slice(0, 200)
    : 'Realistic focused work time estimate for this task.';

  return {
    estimatedMinutes,
    reason,
  };
};

/**
 * Main service method for AI Task Time Estimation.
 */
const estimateTaskTime = async ({ title, context }) => {
  const { title: validTitle, context: validContext } = validateEstimationInput({ title, context });
  const prompt = buildEstimationPrompt(validTitle, validContext);

  try {
    const rawOutput = await aiProvider.generateText(prompt);
    return parseAndValidateEstimationOutput(rawOutput);
  } catch (error) {
    if (error.status) {
      throw error;
    }
    if (error.code === 'MISSING_API_KEY') {
      const err = new Error('AI planning is temporarily unavailable.');
      err.status = 503;
      throw err;
    }
    const err = new Error('AI planning is temporarily unavailable.');
    err.status = 502;
    throw err;
  }
};

/**
 * Helper to parse time string "HH:mm" into total minutes from midnight.
 */
const parseTimeToMinutes = (timeStr) => {
  if (typeof timeStr !== 'string' || !/^\d{2}:\d{2}$/.test(timeStr)) {
    return null;
  }
  const [h, m] = timeStr.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

/**
 * Helper to format minutes from midnight into "HH:mm" string.
 */
const formatMinutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * Deterministic algorithm to partition focus work into non-overlapping focus blocks and break blocks.
 */
const generateScheduleBlocks = ({ title, estimatedMinutes, availability }) => {
  const startMins = parseTimeToMinutes(availability.startTime);
  const endMins = parseTimeToMinutes(availability.endTime);

  if (startMins === null || endMins === null || startMins >= endMins) {
    const err = new Error('Invalid availability window provided. Start time must be before end time.');
    err.status = 400;
    throw err;
  }

  const availableMinutes = endMins - startMins;

  if (availableMinutes <= 0) {
    const err = new Error('Availability window must be greater than zero minutes.');
    err.status = 400;
    throw err;
  }

  // Check if estimatedMinutes > availableMinutes
  if (estimatedMinutes > availableMinutes) {
    return {
      fitsAvailability: false,
      availableMinutes,
      requiredMinutes: estimatedMinutes,
      blocks: [],
      message: 'This task needs more time than the selected availability.',
    };
  }

  // Generate focus blocks (prefer 25-60 mins) and breaks (5-10 mins)
  const blocks = [];
  let currentMins = startMins;
  let remainingFocus = estimatedMinutes;

  // Determine focus block chunk size
  let defaultChunk = 45;
  if (estimatedMinutes <= 50) {
    defaultChunk = estimatedMinutes;
  } else if (estimatedMinutes <= 75) {
    defaultChunk = 35;
  }

  while (remainingFocus > 0) {
    const focusDuration = Math.min(remainingFocus, defaultChunk);
    const focusEnd = currentMins + focusDuration;

    blocks.push({
      startTime: formatMinutesToTime(currentMins),
      endTime: formatMinutesToTime(focusEnd),
      title,
      durationMinutes: focusDuration,
      type: 'focus',
    });

    remainingFocus -= focusDuration;
    currentMins = focusEnd;

    // Insert break if more focus time remains
    if (remainingFocus > 0) {
      const breakDuration = focusDuration >= 45 ? 10 : 5;
      const breakEnd = currentMins + breakDuration;

      // Check if break fits within availability.
      // If adding break exceeds endMins, reduce break or eliminate it if necessary.
      if (breakEnd + Math.min(remainingFocus, defaultChunk) <= endMins) {
        blocks.push({
          startTime: formatMinutesToTime(currentMins),
          endTime: formatMinutesToTime(breakEnd),
          title: 'Short break',
          durationMinutes: breakDuration,
          type: 'break',
        });
        currentMins = breakEnd;
      }
    }
  }

  // Verify total schedule fits availability
  const finalBlock = blocks[blocks.length - 1];
  const lastBlockEndMins = parseTimeToMinutes(finalBlock.endTime);

  if (lastBlockEndMins > endMins) {
    return {
      fitsAvailability: false,
      availableMinutes,
      requiredMinutes: estimatedMinutes,
      blocks: [],
      message: 'This task needs more time than the selected availability.',
    };
  }

  const totalFocusMinutes = blocks
    .filter((b) => b.type === 'focus')
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  const totalBreakMinutes = blocks
    .filter((b) => b.type === 'break')
    .reduce((sum, b) => sum + b.durationMinutes, 0);

  return {
    fitsAvailability: true,
    date: availability.date,
    blocks,
    totalFocusMinutes,
    totalBreakMinutes,
  };
};

/**
 * Service function for Smart Schedule Proposal.
 */
const proposeSchedule = async ({ title, estimatedMinutes, context, availability }) => {
  if (!title || typeof title !== 'string' || !title.trim()) {
    const err = new Error('Task title is required and must be a non-empty string.');
    err.status = 400;
    throw err;
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length > 500) {
    const err = new Error('Task title cannot exceed 500 characters.');
    err.status = 400;
    throw err;
  }

  if (!availability || typeof availability !== 'object') {
    const err = new Error('Availability context is required.');
    err.status = 400;
    throw err;
  }

  const { date, startTime, endTime } = availability;
  if (!date || !startTime || !endTime) {
    const err = new Error('Availability date, startTime, and endTime are required.');
    err.status = 400;
    throw err;
  }

  // Validate date format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    const err = new Error('Invalid availability date format (expected YYYY-MM-DD).');
    err.status = 400;
    throw err;
  }

  let finalEstimate = Number(estimatedMinutes);
  if (!Number.isFinite(finalEstimate) || finalEstimate <= 0) {
    // Obtain estimate via AI estimation service first
    const aiEstimateResult = await estimateTaskTime({ title: trimmedTitle, context });
    finalEstimate = aiEstimateResult.estimatedMinutes;
  } else {
    finalEstimate = Math.round(finalEstimate);
  }

  return generateScheduleBlocks({
    title: trimmedTitle,
    estimatedMinutes: finalEstimate,
    availability: { date, startTime, endTime },
  });
};

module.exports = {
  breakDownTask,
  validateBreakdownInput,
  buildPrompt,
  parseAndValidateOutput,
  estimateTaskTime,
  validateEstimationInput,
  buildEstimationPrompt,
  parseAndValidateEstimationOutput,
  proposeSchedule,
  generateScheduleBlocks,
  parseTimeToMinutes,
  formatMinutesToTime,
};

