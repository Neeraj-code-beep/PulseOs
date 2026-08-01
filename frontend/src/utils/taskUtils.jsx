// Date and Time Formatting Helpers for PulseOS Tasks

export const formatDateDisplay = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isOverdue = date < new Date(today.setHours(0, 0, 0, 0));

  if (isSameDay(date, new Date())) {
    return { text: 'Today', isOverdue: false, isToday: true };
  }

  if (isSameDay(date, tomorrow)) {
    return { text: 'Tomorrow', isOverdue: false, isToday: false };
  }

  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  if (isOverdue) {
    return { text: `Overdue · ${dateStr}`, isOverdue: true, isToday: false };
  }

  return { text: dateStr, isOverdue: false, isToday: false };
};

export const formatEstimate = (minutes) => {
  if (!minutes || isNaN(minutes) || minutes < 1) return null;
  const mins = Math.round(minutes);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};
