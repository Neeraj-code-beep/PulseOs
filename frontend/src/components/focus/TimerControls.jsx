import { useFocus } from '../../context/useFocus';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export const TimerControls = () => {
  const { timerState, startTimer, pauseTimer, resumeTimer, resetTimer } = useFocus();

  return (
    <div className="flex items-center justify-center gap-3">
      {timerState === 'IDLE' && (
        <Button
          variant="primary"
          onClick={startTimer}
          className="px-6 py-2.5 bg-[var(--focus)] hover:bg-[var(--focus)]/90 text-white font-semibold text-xs rounded-[var(--radius-md)] flex items-center gap-2 cursor-pointer shadow-md transition-all hover:-translate-y-0.5"
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
          >
            <Pause size={15} fill="currentColor" />
            <span>Pause</span>
          </Button>
          <Button
            variant="ghost"
            onClick={resetTimer}
            className="px-4 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 font-semibold flex items-center gap-1.5"
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
          >
            <Play size={15} fill="currentColor" />
            <span>Resume</span>
          </Button>
          <Button
            variant="ghost"
            onClick={resetTimer}
            className="px-4 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10 font-semibold flex items-center gap-1.5"
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
        >
          <CheckCircle2 size={15} />
          <span>Start Another Session</span>
        </Button>
      )}
    </div>
  );
};
