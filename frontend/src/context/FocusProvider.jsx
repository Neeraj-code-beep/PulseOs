import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { FocusContext } from './FocusContext';
import { TodoContext } from './TodoContext';
import { createFocusSessionApi } from '../services/focusApi';
import { toast } from 'react-toastify';
import { showBrowserNotification } from '../utils/Notification';

export const FocusProvider = ({ children }) => {
  const { replaceTodo } = useContext(TodoContext);

  // Mode: 'pomodoro' | 'custom'
  const [mode, setMode] = useState('pomodoro');
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Canonical state: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  const [timerState, setTimerState] = useState('IDLE');
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);

  // Timestamps
  const [startedAt, setStartedAt] = useState(null);
  const targetEndTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const completionGuardedRef = useRef(false);

  // Recalculate total planned seconds
  const totalPlannedSeconds = plannedMinutes * 60;

  // Sync default duration when mode changes
  const handleSetMode = (newMode) => {
    if (timerState !== 'IDLE') return;
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setPlannedMinutes(25);
      setRemainingSeconds(25 * 60);
    }
  };

  const handleSetPlannedMinutes = (mins) => {
    if (timerState !== 'IDLE') return;
    const bounded = Math.max(1, Math.min(180, mins));
    setPlannedMinutes(bounded);
    setRemainingSeconds(bounded * 60);
  };

  // Completion handler
  const handleTimerCompletion = useCallback(async () => {
    if (completionGuardedRef.current) return;
    completionGuardedRef.current = true;

    setTimerState('COMPLETED');
    setRemainingSeconds(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const endedAt = new Date();
    const start = startedAt || new Date(endedAt.getTime() - totalPlannedSeconds * 1000);

    try {
      const res = await createFocusSessionApi({
        taskId: selectedTaskId || null,
        mode,
        plannedMinutes,
        actualSeconds: totalPlannedSeconds,
        status: 'completed',
        startedAt: start.toISOString(),
        endedAt: endedAt.toISOString(),
      });

      if (res.success && res.data) {
        if (res.data.task && replaceTodo) {
          replaceTodo(res.data.task);
        }

        const taskTitle = res.data.session?.taskTitle;
        const msg = taskTitle
          ? `Focus session complete! ${plannedMinutes}m added to "${taskTitle}".`
          : `Focus session complete! ${plannedMinutes}m logged.`;

        toast.success(msg, { autoClose: 5000 });

        showBrowserNotification({
          title: 'PulseOS Focus Session Complete',
          body: msg,
          tag: `focus-complete-${Date.now()}`,
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save focus session');
    }
  }, [mode, plannedMinutes, selectedTaskId, startedAt, totalPlannedSeconds, replaceTodo]);

  // Main countdown tick loop (timestamp accuracy)
  useEffect(() => {
    if (timerState === 'RUNNING') {
      timerIntervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));

        setRemainingSeconds(diff);

        if (diff <= 0) {
          clearInterval(timerIntervalRef.current);
          handleTimerCompletion();
        }
      }, 250);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState, handleTimerCompletion]);

  // Document Title update
  useEffect(() => {
    if (timerState === 'RUNNING' || timerState === 'PAUSED') {
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const statusIcon = timerState === 'RUNNING' ? '▶' : '❚❚';
      document.title = `${formatted} ${statusIcon} · Focus · PulseOS`;
    } else {
      document.title = 'PulseOS';
    }
  }, [remainingSeconds, timerState]);

  // Page leave protection during RUNNING/PAUSED
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (timerState === 'RUNNING' || timerState === 'PAUSED') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timerState]);

  // Control Actions
  const startTimer = () => {
    if (timerState === 'RUNNING') return;

    completionGuardedRef.current = false;
    const now = new Date();
    setStartedAt(now);

    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setTimerState('RUNNING');
  };

  const pauseTimer = () => {
    if (timerState !== 'RUNNING') return;
    if (targetEndTimeRef.current) {
      const now = Date.now();
      const currentRemaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setRemainingSeconds(currentRemaining);
    }
    setTimerState('PAUSED');
  };

  const resumeTimer = () => {
    if (timerState !== 'PAUSED') return;
    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setTimerState('RUNNING');
  };

  const resetTimer = async () => {
    const elapsedSeconds = totalPlannedSeconds - remainingSeconds;

    // Meaningful elapsed time >= 60s -> log as cancelled
    if ((timerState === 'RUNNING' || timerState === 'PAUSED') && elapsedSeconds >= 60) {
      try {
        const endedAt = new Date();
        const start = startedAt || new Date(endedAt.getTime() - elapsedSeconds * 1000);
        await createFocusSessionApi({
          taskId: selectedTaskId || null,
          mode,
          plannedMinutes,
          actualSeconds: elapsedSeconds,
          status: 'cancelled',
          startedAt: start.toISOString(),
          endedAt: endedAt.toISOString(),
        });
        toast.info('Session cancelled & logged.');
      } catch {
        // Handled silently
      }
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setTimerState('IDLE');
    setRemainingSeconds(plannedMinutes * 60);
    setStartedAt(null);
    targetEndTimeRef.current = null;
    completionGuardedRef.current = false;
  };

  return (
    <FocusContext.Provider
      value={{
        mode,
        setMode: handleSetMode,
        plannedMinutes,
        setPlannedMinutes: handleSetPlannedMinutes,
        selectedTaskId,
        setSelectedTaskId,
        timerState,
        remainingSeconds,
        totalPlannedSeconds,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
};

export default FocusProvider;
