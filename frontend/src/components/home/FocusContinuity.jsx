import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Square, ExternalLink, Flame } from 'lucide-react';
import { FocusContext } from '../../context/FocusContext';
import { Button } from '../ui/Button';

export const FocusContinuity = () => {
  const navigate = useNavigate();
  const {
    timerState,
    remainingSeconds,
    selectedTaskId,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useContext(FocusContext);

  if (timerState !== 'RUNNING' && timerState !== 'PAUSED') {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isRunning = timerState === 'RUNNING';

  return (
    <div className="p-4 sm:p-5 rounded-[var(--radius-xl)] bg-[var(--bg-surface-elevated)] border-2 border-[var(--focus)]/60 shadow-lg relative overflow-hidden transition-all my-2">
      {/* Background Subtle Pulsing Accent */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--focus-soft)]/50 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Left Status & Countdown */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--focus-soft)] text-[var(--focus)] flex items-center justify-center shrink-0 border border-[var(--focus)]/30">
            <Flame size={24} className={isRunning ? 'animate-pulse' : ''} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--focus)] text-white">
                {isRunning ? 'Focus Active' : 'Session Paused'}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {selectedTaskId ? 'Bound Task' : 'Unbound Focus Session'}
              </span>
            </div>

            <div className="text-2xl font-bold font-timer text-[var(--text-primary)] tracking-tight mt-0.5">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isRunning ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={pauseTimer}
              icon={Pause}
              className="border-[var(--focus)]/40 text-[var(--focus)] hover:bg-[var(--focus-soft)] font-semibold"
            >
              <span>Pause</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={resumeTimer}
              icon={Play}
              className="bg-[var(--focus)] hover:bg-[var(--focus)]/90 font-semibold"
            >
              <span>Resume</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/focus')}
            icon={ExternalLink}
            className="text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface)] font-medium"
          >
            <span>Open Focus Workspace</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={resetTimer}
            icon={Square}
            className="text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 font-medium"
          >
            <span>End</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FocusContinuity;
