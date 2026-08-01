import { useFocus } from '../../context/useFocus';

export const TimerDisplay = () => {
  const { remainingSeconds, totalPlannedSeconds, timerState } = useFocus();

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progress =
    totalPlannedSeconds > 0
      ? Math.min(1, Math.max(0, 1 - remainingSeconds / totalPlannedSeconds))
      : 0;

  // SVG Circular progress math
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex flex-col items-center justify-center p-6">
      {/* SVG Ring Visual Instrument */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 250 250">
          <circle
            cx="125"
            cy="125"
            r={radius}
            className="stroke-[var(--border)] fill-none"
            strokeWidth="6"
          />
          <circle
            cx="125"
            cy="125"
            r={radius}
            className="stroke-[var(--focus)] fill-none transition-all duration-300 ease-out"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Digital Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-5xl sm:text-6xl font-bold font-timer tracking-tight text-[var(--text-primary)]">
            {formattedTime}
          </div>

          <div className="mt-2 text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {timerState === 'RUNNING' && <span className="text-[var(--focus)]">● Focusing</span>}
            {timerState === 'PAUSED' && <span className="text-[var(--warning)]">❚❚ Paused</span>}
            {timerState === 'COMPLETED' && <span className="text-[var(--success)]">✓ Completed</span>}
            {timerState === 'IDLE' && <span>Ready</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
