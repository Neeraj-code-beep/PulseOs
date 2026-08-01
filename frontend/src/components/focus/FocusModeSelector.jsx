import { useFocus } from '../../context/useFocus';

export const FocusModeSelector = () => {
  const { mode, setMode, plannedMinutes, setPlannedMinutes, timerState } = useFocus();
  const isDisabled = timerState !== 'IDLE';

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Mode Tabs */}
      <div className="grid grid-cols-2 p-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-soft)] rounded-[var(--radius-md)]">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => setMode('pomodoro')}
          className={`py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
            mode === 'pomodoro'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pomodoro (25m)
        </button>

        <button
          type="button"
          disabled={isDisabled}
          onClick={() => setMode('custom')}
          className={`py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-all cursor-pointer ${
            mode === 'custom'
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Custom
        </button>
      </div>

      {/* Custom Duration Selector */}
      {mode === 'custom' && (
        <div className="flex items-center justify-between p-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs">
          <span className="text-[var(--text-secondary)] font-medium">Duration:</span>
          <div className="flex items-center gap-2">
            {[15, 30, 45, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                disabled={isDisabled}
                onClick={() => setPlannedMinutes(mins)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors ${
                  plannedMinutes === mins
                    ? 'bg-[var(--focus-soft)] text-[var(--focus)] font-bold'
                    : 'bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {mins}m
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="180"
              disabled={isDisabled}
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(Number(e.target.value))}
              className={`w-14 p-1 bg-[var(--bg-surface-elevated)] border border-[var(--border)] rounded text-xs text-center font-mono outline-none ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
