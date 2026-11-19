// Date, Time, and Task Workflow Utilities for PulseOS

/**
 * Safely parses a date input into a local Date object without unexpected UTC-midnight shifts.
 * Handles Date instances, ISO timestamps, and date-only strings (YYYY-MM-DD).
 * @param {Date|string|number} dateInput
 * @returns {Date|null}
 */
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : new Date(dateInput.getTime());
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;
    // Check for date-only format YYYY-MM-DD or UTC-midnight timestamps representing date-only selections
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z?)?$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      if (month < 0 || month > 11 || day < 1 || day > 31) return null;
      const d = new Date(year, month, day);
      if (isNaN(d.getTime())) return null;
      if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
      return d;
    }
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Returns a new Date instance set to local start of day (00:00:00.000).
 * Never mutates the input date.
 * @param {Date|string|number} [d=new Date()]
 * @returns {Date}
 */
export const getStartOfDay = (d = new Date()) => {
  const date = parseLocalDate(d) || new Date();
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

/**
 * Returns a new Date instance set to local end of day (23:59:59.999).
 * Never mutates the input date.
 * @param {Date|string|number} [d=new Date()]
 * @returns {Date}
 */
export const getEndOfDay = (d = new Date()) => {
  const date = parseLocalDate(d) || new Date();
  const copy = new Date(date.getTime());
  copy.setHours(23, 59, 59, 999);
  return copy;
};

/**
 * Checks if two dates fall on the exact same local calendar day.
 * Never mutates either input.
 * @param {Date|string|number} d1
 * @param {Date|string|number} d2
 * @returns {boolean}
 */
export const isSameDay = (d1, d2) => {
  const date1 = parseLocalDate(d1);
  const date2 = parseLocalDate(d2);
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Checks whether a due date is on or before the end of the current local day.
 * Includes both tasks due anytime today and overdue tasks.
 * @param {Date|string|number} dateInput
 * @returns {boolean}
 */
export const isDueTodayOrOverdue = (dateInput) => {
  if (!dateInput) return false;
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return false;
  return d <= getEndOfDay();
};

/**
 * Checks whether a due date is strictly after the end of the current local day.
 * @param {Date|string|number} dateInput
 * @returns {boolean}
 */
export const isUpcoming = (dateInput) => {
  if (!dateInput) return false;
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return false;
  return d > getEndOfDay();
};

/**
 * Checks whether a due date is strictly prior to the start of today (local midnight).
 * Tasks due today (even earlier in the day) are considered 'today', not overdue.
 * @param {Date|string|number} dateInput
 * @returns {boolean}
 */
export const isOverdue = (dateInput) => {
  if (!dateInput) return false;
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return false;
  return d < getStartOfDay();
};

/**
 * Classifies an uncompleted task's due date for the execution workspace tabs.
 * Returns 'today' | 'upcoming'.
 * - Tasks with valid future due dates -> 'upcoming'
 * - Tasks due today or overdue -> 'today'
 * - Tasks with missing or invalid due dates -> 'today' (ensures no open task is silently hidden)
 * @param {Date|string|number} dueDate
 * @returns {'today'|'upcoming'}
 */
export const classifyTaskDueDate = (dueDate) => {
  if (isUpcoming(dueDate)) {
    return 'upcoming';
  }
  return 'today';
};

/**
 * Determines whether a task was completed on the user's local current calendar day.
 * - Incomplete tasks return false.
 * - Completed tasks without a valid completedAt timestamp return false (no unevidenced attribution).
 * - Completed tasks with an invalid completedAt timestamp return false.
 * - Completed tasks with a valid completedAt on the current local day return true.
 * @param {Object} todo - The task object
 * @param {Date|string|number} [now=new Date()] - Reference date (defaults to current moment)
 * @returns {boolean}
 */
export const isCompletedToday = (todo, now = new Date()) => {
  if (!todo || typeof todo !== 'object') return false;
  if (!todo.completed) return false;
  if (!todo.completedAt) return false;
  return isSameDay(todo.completedAt, now);
};

/**
 * Validates whether a calendar date is mathematically valid (rejects overflows like Feb 31 or month 99).
 * @param {number} year
 * @param {number} month - 1-indexed month (1 to 12)
 * @param {number} day - 1-indexed day (1 to 31)
 * @returns {boolean}
 */
export const isValidCalendarDate = (year, month, day) => {
  if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    !isNaN(d.getTime()) &&
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  );
};

/**
 * Determines whether a date input represents an ambiguous legacy timestamp.
 * An ambiguous legacy date is an unmarked historical timestamp (non-midnight offset OR unmarked UTC-midnight).
 * Only timestamps with explicit provenance (dueDateFormatVersion === 2) or valid date-only strings are canonical.
 * @param {Date|string|number|Object} dateInput - Date string, Date object, or task object
 * @param {number|null} [formatVersion=null] - Optional explicit provenance version marker
 * @returns {boolean}
 */
export const isAmbiguousLegacyDate = (dateInput, formatVersion = null) => {
  if (!dateInput) return false;

  let rawDate = dateInput;
  let version = formatVersion;

  if (typeof dateInput === 'object' && !(dateInput instanceof Date) && dateInput !== null) {
    rawDate = dateInput.dueDate;
    version = dateInput.dueDateFormatVersion !== undefined ? dateInput.dueDateFormatVersion : formatVersion;
  }

  if (!rawDate) return false;

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed) return false;

    // Date-only string is canonical if valid
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      return false;
    }

    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}:?\d{2}))?$/i.exec(trimmed);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      if (!isValidCalendarDate(year, month, day)) {
        return false;
      }

      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return false;

      const isUtcMidnight =
        d.getUTCHours() === 0 &&
        d.getUTCMinutes() === 0 &&
        d.getUTCSeconds() === 0 &&
        d.getUTCMilliseconds() === 0 &&
        (trimmed.endsWith('Z') || trimmed.includes('+00') || trimmed.includes('-00'));

      // Explicitly marked version 2 is proven canonical
      if (isUtcMidnight && (version === 2 || version === '2')) {
        return false;
      }

      // Both non-midnight legacy timestamps and unmarked UTC-midnight timestamps are legacy/unverified
      return true;
    }

    return false;
  }

  return false;
};

/**
 * Classifies a due date's provenance and format version.
 * - 'NONE': Missing or empty
 * - 'INVALID': Malformed, NaN, or mathematically impossible date (e.g. 2026-99-99)
 * - 'CANONICAL': Proven calendar date (valid date-only OR exact UTC-midnight with explicit version marker 2)
 * - 'LEGACY_AMBIGUOUS': Historical timestamp with unverified creator timezone (unmarked UTC-midnight or non-midnight offset)
 * @param {Date|string|number|Object} dateInput - Date string, Date object, or task object
 * @param {number|null} [formatVersion=null] - Optional explicit provenance version marker
 * @returns {'NONE'|'INVALID'|'CANONICAL'|'LEGACY_AMBIGUOUS'}
 */
export const classifyDueDateProvenance = (dateInput, formatVersion = null) => {
  if (dateInput === null || dateInput === undefined) return 'NONE';

  let rawDate = dateInput;
  let version = formatVersion;

  if (typeof dateInput === 'object' && !(dateInput instanceof Date) && dateInput !== null) {
    rawDate = dateInput.dueDate;
    version = dateInput.dueDateFormatVersion !== undefined ? dateInput.dueDateFormatVersion : formatVersion;
  }

  if (rawDate === null || rawDate === undefined) return 'NONE';

  if (typeof rawDate === 'string') {
    const trimmed = rawDate.trim();
    if (!trimmed) return 'NONE';

    // 1. Date-only format
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]);
      const day = Number(dateOnlyMatch[3]);
      return isValidCalendarDate(year, month, day) ? 'CANONICAL' : 'INVALID';
    }

    // 2. ISO timestamp format
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}:?\d{2}))?$/i.exec(trimmed);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);
      if (!isValidCalendarDate(year, month, day)) {
        return 'INVALID';
      }

      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return 'INVALID';

      const isUtcMidnight =
        d.getUTCHours() === 0 &&
        d.getUTCMinutes() === 0 &&
        d.getUTCSeconds() === 0 &&
        d.getUTCMilliseconds() === 0 &&
        (trimmed.endsWith('Z') || trimmed.includes('+00') || trimmed.includes('-00'));

      // Proven canonical ONLY if UTC midnight AND version 2
      if (isUtcMidnight && (version === 2 || version === '2')) {
        return 'CANONICAL';
      }

      // Unmarked UTC-midnight or non-midnight offset timestamp
      return 'LEGACY_AMBIGUOUS';
    }

    return 'INVALID';
  }

  if (rawDate instanceof Date) {
    if (isNaN(rawDate.getTime())) return 'INVALID';
    const isUtcMidnight =
      rawDate.getUTCHours() === 0 &&
      rawDate.getUTCMinutes() === 0 &&
      rawDate.getUTCSeconds() === 0 &&
      rawDate.getUTCMilliseconds() === 0;
    return isUtcMidnight && (version === 2 || version === '2') ? 'CANONICAL' : 'LEGACY_AMBIGUOUS';
  }

  return 'INVALID';
};

/**
 * Formats a date for UI presentation.
 * Returns an object containing both `text` and `label` properties for safe component consumption.
 * Distinguishes canonical calendar dates, invalid dates, and ambiguous legacy dates.
 * @param {Date|string|number|Object} dateInput - Date string, Date object, or task object
 * @param {number|null} [formatVersion=null] - Optional explicit provenance version marker
 * @returns {{ text: string, label: string, isOverdue: boolean, isToday: boolean, isInvalid: boolean, isLegacy: boolean, legacyWarning: string|null }|null}
 */
export const formatDateDisplay = (dateInput, formatVersion = null) => {
  if (dateInput === null || dateInput === undefined) return null;

  let rawDate = dateInput;
  let version = formatVersion;

  if (typeof dateInput === 'object' && !(dateInput instanceof Date) && dateInput !== null) {
    rawDate = dateInput.dueDate;
    version = dateInput.dueDateFormatVersion !== undefined ? dateInput.dueDateFormatVersion : formatVersion;
  }

  if (rawDate === null || rawDate === undefined) return null;
  if (typeof rawDate === 'string' && !rawDate.trim()) return null;

  const provenance = classifyDueDateProvenance(rawDate, version);
  if (provenance === 'INVALID') {
    return { text: 'Invalid Date', label: 'Invalid Date', isOverdue: false, isToday: false, isInvalid: true, isLegacy: false, legacyWarning: null };
  }

  const date = parseLocalDate(rawDate);
  if (!date || isNaN(date.getTime())) {
    return { text: 'Invalid Date', label: 'Invalid Date', isOverdue: false, isToday: false, isInvalid: true, isLegacy: false, legacyWarning: null };
  }

  const legacy = provenance === 'LEGACY_AMBIGUOUS';
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const overdue = isOverdue(date);

  let text;
  let isToday = false;

  if (isSameDay(date, today)) {
    text = 'Today';
    isToday = true;
  } else if (isSameDay(date, tomorrow)) {
    text = 'Tomorrow';
  } else {
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    text = overdue ? `Overdue · ${dateStr}` : dateStr;
  }

  return {
    text,
    label: text,
    isOverdue: overdue,
    isToday,
    isInvalid: false,
    isLegacy: legacy,
    legacyWarning: legacy ? `${text} (Legacy date · Unverified timezone)` : null,
  };
};

/**
 * Formats an estimate in minutes into a human-readable duration (e.g., 45m, 2h 15m).
 * @param {number} minutes
 * @returns {string|null}
 */
export const formatEstimate = (minutes) => {
  if (!minutes || isNaN(minutes) || minutes < 1) return null;
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

/**
 * Formats a Date/timestamp into local "YYYY-MM-DDTHH:mm" suitable for <input type="datetime-local">.
 * Preserves user's exact local time without UTC offset corruption.
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export const formatDateTimeLocal = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Formats a Date/timestamp/string into local "YYYY-MM-DD" suitable for <input type="date">.
 * @param {Date|string|number} dateInput
 * @returns {string}
 */
export const formatDateInput = (dateInput) => {
  if (!dateInput) return '';
  const d = parseLocalDate(dateInput);
  if (!d || isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${year}-${month}-${day}`;
};

/**
 * Safely converts an optional date/time input to an ISO string for API payload serialization.
 * Returns an object with { valid: boolean, value: string|null, error: string|null }.
 *
 * - Empty / null / undefined values return { valid: true, value: null, error: null }.
 * - Valid date-only strings (YYYY-MM-DD) serialize canonically to UTC midnight (YYYY-MM-DDT00:00:00.000Z)
 *   preserving calendar-date semantics across all client and server timezones.
 * - Valid timestamps/Dates serialize to full ISO strings with timezone preservation.
 * - Invalid non-empty values return { valid: false, value: null, error: "<field> is not a valid date." }.
 *
 * @param {string|Date|number} dateInput - The date input value from state/form
 * @param {string} [fieldName='Date'] - Name of field for error messaging (e.g., 'Due date', 'Reminder time')
 * @returns {{ valid: boolean, value: string|null, error: string|null }}
 */
export const serializeIsoDate = (dateInput, fieldName = 'Date') => {
  if (dateInput === null || dateInput === undefined) {
    return { valid: true, value: null, error: null };
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) {
      return { valid: true, value: null, error: null };
    }
    // Check if it's a date-only format YYYY-MM-DD
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
      const year = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const day = Number(dateOnlyMatch[3]);
      if (month < 0 || month > 11 || day < 1 || day > 31) {
        return { valid: false, value: null, error: `${fieldName} contains an invalid calendar date.` };
      }
      const utcTime = Date.UTC(year, month, day);
      const d = new Date(utcTime);
      if (isNaN(d.getTime()) || d.getUTCFullYear() !== year || d.getUTCMonth() !== month || d.getUTCDate() !== day) {
        return { valid: false, value: null, error: `${fieldName} contains an invalid calendar date.` };
      }
      return { valid: true, value: d.toISOString(), error: null };
    }

    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
      return { valid: false, value: null, error: `${fieldName} is not a valid date or time.` };
    }
    return { valid: true, value: d.toISOString(), error: null };
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      return { valid: false, value: null, error: `${fieldName} is an invalid Date object.` };
    }
    return { valid: true, value: dateInput.toISOString(), error: null };
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return { valid: false, value: null, error: `${fieldName} is an invalid timestamp.` };
    }
    return { valid: true, value: d.toISOString(), error: null };
  }

  return { valid: false, value: null, error: `${fieldName} is invalid.` };
};

/**
 * Validates form dates for task creation/editing.
 * @param {Object} params
 * @param {string|Date|null} [params.dueDate]
 * @param {string|Date|null} [params.reminderTime]
 * @returns {{ valid: boolean, dueDate: string|null, reminderTime: string|null, error: string|null }}
 */
export const validateTaskFormDates = ({ dueDate, reminderTime } = {}) => {
  const dueResult = serializeIsoDate(dueDate, 'Due date');
  if (!dueResult.valid) {
    return { valid: false, dueDate: null, reminderTime: null, error: dueResult.error };
  }

  const reminderResult = serializeIsoDate(reminderTime, 'Reminder time');
  if (!reminderResult.valid) {
    return { valid: false, dueDate: null, reminderTime: null, error: reminderResult.error };
  }

  return {
    valid: true,
    dueDate: dueResult.value,
    reminderTime: reminderResult.value,
    error: null,
  };
};

/**
 * Safely extracts a numeric epoch millisecond timestamp from an input.
 * Returns `fallback` (defaults to null) if input is missing, invalid, or produces NaN.
 * Distinguishes invalid dates (null) from valid epoch 0 timestamps (0).
 * @param {Date|string|number} dateInput
 * @param {number|null} [fallback=null]
 * @returns {number|null}
 */
export const safeTimestamp = (dateInput, fallback = null) => {
  if (dateInput === null || dateInput === undefined || dateInput === '') return fallback;
  if (typeof dateInput === 'number') {
    return isNaN(dateInput) ? fallback : dateInput;
  }
  const d = new Date(dateInput);
  const time = d.getTime();
  return isNaN(time) ? fallback : time;
};

/**
 * Deterministic multi-criteria task sorting comparator for the execution workspace.
 * 1. Uncompleted tasks before completed tasks.
 * 2. Due date proximity (earlier due dates first, tasks with due dates before unscheduled tasks).
 * 3. Priority weighting (high > medium > low).
 * 4. Creation time recency (valid timestamps prioritized; corrupted dates placed after valid dates).
 * 5. Deterministic tie-breaker by task ID.
 * @param {Object} a
 * @param {Object} b
 * @returns {number}
 */
export const compareTasksForExecution = (a, b) => {
  if (a.completed !== b.completed) {
    return a.completed ? 1 : -1;
  }

  const dA = a.dueDate ? parseLocalDate(a.dueDate) : null;
  const dB = b.dueDate ? parseLocalDate(b.dueDate) : null;
  const timeA = dA ? dA.getTime() : null;
  const timeB = dB ? dB.getTime() : null;

  if (timeA !== null && timeB !== null) {
    if (timeA !== timeB) return timeA - timeB;
  } else if (timeA !== null) {
    return -1;
  } else if (timeB !== null) {
    return 1;
  }

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const pA = priorityWeight[a.priority] || 2;
  const pB = priorityWeight[b.priority] || 2;
  if (pA !== pB) return pB - pA;

  const cA = safeTimestamp(a.createdAt, null);
  const cB = safeTimestamp(b.createdAt, null);
  if (cA !== null && cB !== null) {
    if (cA !== cB) return cB - cA;
  } else if (cA !== null) {
    return -1;
  } else if (cB !== null) {
    return 1;
  }

  const idA = String(a._id || a.id || '');
  const idB = String(b._id || b.id || '');
  return idA.localeCompare(idB);
};

/**
 * Deterministic Next Best Action selection algorithm.
 * Selects the highest priority focus target from uncompleted tasks:
 * 1. Overdue tasks take absolute precedence.
 * 2. Priority weighting (high > medium > low).
 * 3. Due date proximity.
 * 4. Creation time recency (valid timestamps prioritized; corrupted dates placed after valid dates).
 * 5. Deterministic tie-breaker by task ID.
 * @param {Array<Object>} todos
 * @returns {Object|null}
 */
export const getNextBestAction = (todos = []) => {
  if (!Array.isArray(todos)) return null;
  const uncompleted = todos.filter((t) => !t.completed);
  if (uncompleted.length === 0) return null;

  const sorted = [...uncompleted].sort((a, b) => {
    const aDateInfo = formatDateDisplay(a);
    const bDateInfo = formatDateDisplay(b);

    // 1. Overdue tasks take absolute precedence
    if (aDateInfo?.isOverdue && !bDateInfo?.isOverdue) return -1;
    if (!aDateInfo?.isOverdue && bDateInfo?.isOverdue) return 1;

    // 2. Priority weighting
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    if (pA !== pB) return pB - pA;

    // 3. Due date proximity
    const dA = parseLocalDate(a.dueDate);
    const dB = parseLocalDate(b.dueDate);
    const timeA = dA ? dA.getTime() : null;
    const timeB = dB ? dB.getTime() : null;

    if (timeA !== null && timeB !== null) {
      if (timeA !== timeB) return timeA - timeB;
    } else if (timeA !== null) {
      return -1;
    } else if (timeB !== null) {
      return 1;
    }

    // 4. Creation time (distinguishes valid timestamps from invalid nulls)
    const cA = safeTimestamp(a.createdAt, null);
    const cB = safeTimestamp(b.createdAt, null);
    if (cA !== null && cB !== null) {
      if (cA !== cB) return cB - cA;
    } else if (cA !== null) {
      return -1;
    } else if (cB !== null) {
      return 1;
    }

    // 5. Deterministic tie-breaker by task ID
    const idA = String(a._id || a.id || '');
    const idB = String(b._id || b.id || '');
    return idA.localeCompare(idB);
  });

  return sorted[0];
};

/**
 * Generates the user-facing rationale and badge variant for the recommended next action.
 * @param {Object|null} bestTask
 * @returns {{ text: string, variant: 'danger'|'primary'|'accent'|'neutral' }}
 */
export const getNextActionRationale = (bestTask) => {
  if (!bestTask) {
    return { text: 'All active tasks completed!', variant: 'neutral' };
  }
  const dateInfo = formatDateDisplay(bestTask);
  if (dateInfo?.isInvalid) {
    return { text: 'Invalid Due Date · Review Task', variant: 'danger' };
  }
  if (dateInfo?.isOverdue) {
    return { text: 'Overdue Priority', variant: 'danger' };
  }
  if (bestTask.priority === 'high') {
    return { text: 'High Priority Assignment', variant: 'primary' };
  }
  if (dateInfo && dateInfo.text) {
    return { text: `Due ${dateInfo.text}`, variant: 'accent' };
  }
  return { text: 'Recommended Next Focus Target', variant: 'neutral' };
};

/**
 * Registers the 'todo:reminder' event listener on a socket with payload validation.
 * Returns an unregister cleanup function.
 * @param {Object} socket - Socket instance with .on and .off methods
 * @param {Function} onReminder - Callback invoked when a valid reminder payload arrives
 * @returns {Function} cleanup - Function to unregister the listener
 */
export const registerReminderHandler = (socket, onReminder) => {
  if (!socket || typeof socket.on !== 'function') return () => {};

  const handler = (payload) => {
    if (!payload || !payload.id || !payload.title) return;
    if (typeof onReminder === 'function') {
      onReminder(payload);
    }
  };

  socket.on('todo:reminder', handler);
  return () => {
    if (typeof socket.off === 'function') {
      socket.off('todo:reminder', handler);
    }
  };
};

/**
 * Validates a subject tag according to PulseOS tag rules.
 * - Must be a string.
 * - Normalized by trimming and converting to lowercase.
 * - Cannot be empty or whitespace-only.
 * - Cannot exceed 30 characters.
 * - Cannot duplicate an existing tag in existingTags.
 * - Cannot exceed maximum of 5 tags total.
 *
 * @param {*} rawTag - Candidate tag value
 * @param {Array<string>} [existingTags=[]] - Currently assigned tags
 * @returns {{ valid: boolean, tag: string|null, error: string|null }}
 */
export const validateTaskTag = (rawTag, existingTags = []) => {
  if (typeof rawTag !== 'string') {
    return { valid: false, tag: null, error: 'Tag must be a valid text string.' };
  }
  const clean = rawTag.trim().toLowerCase();
  if (!clean) {
    return { valid: false, tag: null, error: 'Tag cannot be empty.' };
  }
  if (clean.length > 30) {
    return { valid: false, tag: null, error: 'Tag cannot exceed 30 characters.' };
  }
  const currentTags = Array.isArray(existingTags)
    ? existingTags.map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : t))
    : [];
  if (currentTags.includes(clean)) {
    return { valid: false, tag: null, error: 'Tag already exists.' };
  }
  if (currentTags.length >= 5) {
    return { valid: false, tag: null, error: 'Maximum 5 tags allowed.' };
  }
  return { valid: true, tag: clean, error: null };
};
