import { useState } from 'react';
import { useFocus } from '../../context/useFocus';
import { Play, Pause, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export const TimerControls = () => {
  const { timerState, remainingSeconds, totalPlannedSeconds, startTimer, pauseTimer, resumeTimer, resetTimer } = useFocus();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const elapsedSeconds = totalPlannedSeconds - remainingSeconds;
  const isMeaningfulSession = (timerState === 'RUNNING' || timerState === 'PAUSED') && elapsedSeconds >= 60;

  const handleResetClick = () => {
    if (isMeaningfulSession && !showConfirmReset) {
      setShowConfirmReset(true);
      return;
    }
    setShowConfirmReset(false);
    resetTimer();
  };

  const handleCancelReset = () => {
    setShowConfirmReset(false);
  };

  if (showConfirmReset) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-[var(--radius-md)] text-xs animate-in fade-in duration-150">
        <AlertCircle size={15} className="text-[var(--danger)] shrink-0" />
        <span className="text-[var(--text-primary)] font-medium">End & log session?</span>
        <Button
          variant="danger"
          size="sm"
          onClick={handleResetClick}
          className="text-xs px-2.5 py-1"
          aria-label="Confirm ending focus session"
        >
          Confirm
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancelReset}
          className="text-xs px-2 py-1"
          aria-label="Cancel ending focus session"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {timerState === 'IDLE' && (
        <Button
          variant="primary"
          onClick={startTimer}
          className="px-6 py-2.5 bg-[var(--focus)] hover:bg-[var(--focus)]/90 text-white font-semibold text-xs rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer shadow-md transition-all hover:-translate-y-0.5"
          aria-label="Start focus session timer"
        >
          <Play size={15} fill="currentColor" />
          <span>Start Focus</span>
        </Button>
      )}

      {timerState === 'RUNNING' && (
        <>
          <Button
            variant="secondary"
            onClick={pauseTimer}
            className="px-5 py-2 text-xs font-semibold flex items-center gap-2"
            aria-label="Pause focus timer"
          >
            <Pause size={15} fill="currentColor" />
            <span>Pause</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleResetClick}
            className="px-4 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 font-semibold flex items-center gap-1.5"
            aria-label="End focus session"
          >
            <RotateCcw size={14} />
            <span>End Session</span>
          </Button>
        </>
      )}

      {timerState === 'PAUSED' && (
        <>
          <Button
            variant="primary"
            onClick={resumeTimer}
            className="px-6 py-2.5 bg-[var(--focus)] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
            aria-label="Resume focus timer"
          >
            <Play size={15} fill="currentColor" />
            <span>Resume</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleResetClick}
            className="px-4 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 font-semibold flex items-center gap-1.5"
            aria-label="Reset focus timer"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </Button>
        </>
      )}

      {timerState === 'COMPLETED' && (
        <Button
          variant="primary"
          onClick={resetTimer}
          className="px-6 py-2.5 bg-[var(--focus)] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
          aria-label="Start another focus session"
        >
          <CheckCircle2 size={15} />
          <span>Start Another Session</span>
        </Button>
      )}
    </div>
  );
};
