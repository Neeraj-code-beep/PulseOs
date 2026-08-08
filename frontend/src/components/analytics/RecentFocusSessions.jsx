import PropTypes from 'prop-types';
import { Clock, RefreshCw, AlertCircle } from 'lucide-react';

const formatDuration = (sec) => {
  if (!sec || sec <= 0) return '0m';
  const mins = Math.round(sec / 60);
  if (mins === 0) return `${sec}s`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (isToday) {
    return `Today · ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateStr} · ${timeStr}`;
};

export const RecentFocusSessions = ({ sessions, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        <div className="h-4 w-36 bg-[var(--border-soft)] rounded animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-[var(--border-soft)] rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col items-center justify-center gap-2 text-center">
        <AlertCircle size={20} className="text-red-500" />
        <span className="text-xs font-bold text-[var(--text-primary)]">
          Could not load recent focus sessions
        </span>
        <p className="text-[11px] text-[var(--text-secondary)]">{error}</p>
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1 text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--border-soft)] cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const list = sessions || [];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-6 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
        <div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider font-mono">
            RECENT ACTIVITY
          </span>
          <h2 className="text-base font-bold text-[var(--text-primary)] mt-0.5">
            Focus session log
          </h2>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Last {list.length}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="py-8 px-4 border border-dashed border-[var(--border)] rounded-[var(--radius-md)] text-center flex flex-col items-center justify-center gap-2">
          <div className="p-2 bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] rounded-full">
            <Clock size={18} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">
            YOUR FOCUS HISTORY
          </span>
          <p className="text-xs text-[var(--text-muted)] max-w-xs">
            No sessions yet. Your completed focus blocks will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-soft)]">
          {list.map((session) => {
            const isCompleted = session.status === 'completed';
            return (
              <div
                key={session._id}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-medium text-[var(--text-primary)] truncate">
                    {session.taskTitle || 'Unbound focus block'}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                    <span className="capitalize font-mono">{session.mode || 'pomodoro'}</span>
                    <span>·</span>
                    <span>{formatRelativeTime(session.startedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {formatDuration(session.actualSeconds)}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                      isCompleted
                        ? 'bg-[var(--focus-soft)] text-[var(--focus)] border-[var(--focus)]/20'
                        : 'bg-[var(--border-soft)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {isCompleted ? 'Completed' : 'Cancelled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

RecentFocusSessions.propTypes = {
  sessions: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      taskTitle: PropTypes.string,
      mode: PropTypes.string,
      actualSeconds: PropTypes.number,
      status: PropTypes.string,
      startedAt: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  onRetry: PropTypes.func,
};
