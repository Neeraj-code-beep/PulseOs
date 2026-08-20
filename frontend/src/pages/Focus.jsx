import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFocus } from '../context/useFocus';
import { TimerDisplay } from '../components/focus/TimerDisplay';
import { TimerControls } from '../components/focus/TimerControls';
import { FocusModeSelector } from '../components/focus/FocusModeSelector';
import { FocusTaskSelector } from '../components/focus/FocusTaskSelector';
import { SessionComplete } from '../components/focus/SessionComplete';
import { getFocusSessionsApi, getFocusSummaryApi } from '../services/focusApi';
import { Flame, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { SectionEyebrow } from '../components/ui/SectionEyebrow';
import { EditorialHeading } from '../components/ui/EditorialHeading';

export const Focus = () => {
  const [searchParams] = useSearchParams();
  const deepLinkTaskId = searchParams.get('task');

  const { setSelectedTaskId, timerState, startTimer, pauseTimer, resumeTimer } = useFocus();

  const [summary, setSummary] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const prevTimerStateRef = useRef(timerState);

  // Handle deep link from task action (/focus?task=<id>)
  useEffect(() => {
    if (deepLinkTaskId) {
      setSelectedTaskId(deepLinkTaskId);
    }
  }, [deepLinkTaskId, setSelectedTaskId]);

  // Fetch summary & recent sessions
  const fetchFocusData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [sumRes, sessRes] = await Promise.all([
        getFocusSummaryApi(),
        getFocusSessionsApi(10),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (sessRes.success) setRecentSessions(sessRes.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on initial mount
  useEffect(() => {
    fetchFocusData();
  }, [fetchFocusData]);

  // Refetch summary data only on completion or reset to IDLE state (prevent polling/overfetching)
  useEffect(() => {
    if (prevTimerStateRef.current !== timerState) {
      if (timerState === 'COMPLETED' || (prevTimerStateRef.current === 'COMPLETED' && timerState === 'IDLE')) {
        fetchFocusData();
      }
      prevTimerStateRef.current = timerState;
    }
  }, [timerState, fetchFocusData]);

  // Keyboard shortcut: Space bar toggles start/pause/resume when not focused inside an input field
  useEffect(() => {
    const handleKeyDown = (e) => {
      const targetTag = e.target?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'select' || targetTag === 'textarea' || e.target?.isContentEditable) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerState === 'IDLE') {
          startTimer();
        } else if (timerState === 'RUNNING') {
          pauseTimer();
        } else if (timerState === 'PAUSED') {
          resumeTimer();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timerState, startTimer, pauseTimer, resumeTimer]);

  const formatSeconds = (sec = 0) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.round((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="border-b border-[var(--border-soft)] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <SectionEyebrow dotColor="var(--focus)">
            Deep Work Engine
          </SectionEyebrow>
          <EditorialHeading size="sm" className="mt-2">
            Focus Workspace
          </EditorialHeading>
        </div>

        {/* Dynamic State-Aware Status Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold self-start sm:self-auto border transition-colors ${
            timerState === 'RUNNING'
              ? 'bg-[var(--focus-soft)] text-[var(--focus)] border-[var(--focus)]/30'
              : timerState === 'PAUSED'
              ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30'
              : timerState === 'COMPLETED'
              ? 'bg-[var(--focus-soft)] text-[var(--focus)] border-[var(--focus)]/30'
              : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border-[var(--border-soft)]'
          }`}
        >
          <Flame size={14} className={timerState === 'RUNNING' ? 'animate-pulse text-[var(--focus)]' : ''} />
          <span>
            {timerState === 'RUNNING' && 'Focus Active'}
            {timerState === 'PAUSED' && 'Session Paused'}
            {timerState === 'COMPLETED' && 'Session Complete'}
            {timerState === 'IDLE' && 'Ready to Focus'}
          </span>
        </div>
      </div>

      {/* Main 2-Zone Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Timer Instrument (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 shadow-md flex flex-col items-center gap-4 relative">
            {timerState === 'COMPLETED' ? (
              <SessionComplete />
            ) : (
              <>
                <TimerDisplay />
                <TimerControls />
              </>
            )}
          </div>
        </div>

        {/* Right Zone: Task Binding, Settings, & Today Summary (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Mode & Duration Config */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col gap-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Timer Configuration
            </h2>
            <FocusModeSelector />
          </div>

          {/* Task Selector */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col gap-4">
            <FocusTaskSelector />
          </div>

          {/* Today Focus Summary Box */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Today's Focus Summary
              </h2>
              {isError && (
                <button
                  onClick={fetchFocusData}
                  className="text-[11px] text-[var(--danger)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} /> Retry
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="h-14 bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)] animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <Clock size={12} /> Focus Time
                  </span>
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {formatSeconds(summary?.focusSecondsToday || 0)}
                  </span>
                </div>

                <div className="p-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)] flex flex-col gap-1">
                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                    <CheckCircle size={12} /> Sessions
                  </span>
                  <span className="text-lg font-bold font-mono text-[var(--text-primary)]">
                    {summary?.completedSessionsToday || 0}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Focus Sessions Surface */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-xs flex flex-col gap-4 mt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Recent Focus Sessions
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 bg-[var(--bg-surface-elevated)] rounded animate-pulse" />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-muted)]">
            No focus sessions yet. Choose a task and start your first block.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-soft)] text-xs">
            {recentSessions.map((sess) => {
              const dateStr = new Date(sess.endedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const mins = Math.round(sess.actualSeconds / 60);

              return (
                <div key={sess._id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        sess.status === 'completed' ? 'bg-[var(--focus)]' : 'bg-[var(--danger)]'
                      }`}
                    />
                    <span className="font-medium text-[var(--text-primary)] truncate">
                      {sess.taskTitle || 'General Focus Session'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[var(--text-muted)] font-mono shrink-0">
                    <span>{mins}m</span>
                    <span className="capitalize">{sess.status}</span>
                    <span>{dateStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
