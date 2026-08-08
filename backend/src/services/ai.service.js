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
 * Main service method: orchestrates validation, prompt building, LLM call, and response validation.
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

module.exports = {
  breakDownTask,
  validateBreakdownInput,
  buildPrompt,
  parseAndValidateOutput,
};
