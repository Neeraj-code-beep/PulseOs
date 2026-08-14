import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { FocusContext } from './FocusContext';
import { TodoContext } from './TodoContext';
import { AuthContext } from './AuthContext';
import { createFocusSessionApi } from '../services/focusApi';
import { toast } from 'react-toastify';
import { showBrowserNotification } from '../utils/Notification';

const STORAGE_KEY = 'pulse_focus_session';

const getInitialFocusState = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1) {
      return parsed;
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

export const FocusProvider = ({ children }) => {
  const { replaceTodo, todos } = useContext(TodoContext);
  const { user } = useContext(AuthContext);

  const initialPersisted = getInitialFocusState();

  // Mode: 'pomodoro' | 'custom'
  const [mode, setMode] = useState(initialPersisted?.mode || 'pomodoro');
  const [plannedMinutes, setPlannedMinutes] = useState(initialPersisted?.plannedMinutes || 25);
  const [selectedTaskId, setSelectedTaskId] = useState(initialPersisted?.taskId || null);
  const [taskTitle, setTaskTitle] = useState(initialPersisted?.taskTitle || null);

  // Timestamps & Identifiers
  const [startedAt, setStartedAt] = useState(() => initialPersisted?.startedAt ? new Date(initialPersisted.startedAt) : null);
  const clientSessionIdRef = useRef(initialPersisted?.clientSessionId || null);

  // Initial calculation for remainingSeconds on mount
  const calculateInitialRemaining = () => {
    if (!initialPersisted) return 25 * 60;
    if (initialPersisted.timerState === 'PAUSED') {
      return initialPersisted.remainingSeconds;
    }
    if (initialPersisted.timerState === 'RUNNING' && initialPersisted.targetEndTime) {
      const now = Date.now();
      return Math.max(0, Math.ceil((initialPersisted.targetEndTime - now) / 1000));
    }
    return initialPersisted.remainingSeconds ?? (initialPersisted.plannedMinutes * 60);
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateInitialRemaining);
  const [timerState, setTimerState] = useState(() => {
    if (!initialPersisted) return 'IDLE';
    if (initialPersisted.timerState === 'PAUSED') return 'PAUSED';
    if (initialPersisted.timerState === 'RUNNING') return 'RUNNING';
    return 'IDLE';
  });

  const targetEndTimeRef = useRef(initialPersisted?.targetEndTime || null);
  const timerIntervalRef = useRef(null);
  const completionGuardedRef = useRef(false);

  const totalPlannedSeconds = plannedMinutes * 60;

  // Clear focus state on logout / user change
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem(STORAGE_KEY);
      setTimerState('IDLE');
      setMode('pomodoro');
      setPlannedMinutes(25);
      setRemainingSeconds(25 * 60);
      setSelectedTaskId(null);
      setTaskTitle(null);
      setStartedAt(null);
      targetEndTimeRef.current = null;
      clientSessionIdRef.current = null;
      completionGuardedRef.current = false;
    }
  }, [user]);

  // Save active timer state to sessionStorage
  const saveStateToStorage = useCallback((overrides = {}) => {
    const currentState = overrides.timerState || timerState;
    if (currentState !== 'RUNNING' && currentState !== 'PAUSED') {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload = {
      version: 1,
      clientSessionId: clientSessionIdRef.current,
      taskId: selectedTaskId,
      taskTitle,
      mode,
      timerState: currentState,
      plannedMinutes,
      remainingSeconds: overrides.remainingSeconds !== undefined ? overrides.remainingSeconds : remainingSeconds,
      targetEndTime: targetEndTimeRef.current,
      startedAt: startedAt ? startedAt.toISOString() : new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore sessionStorage error
    }
  }, [timerState, selectedTaskId, taskTitle, mode, plannedMinutes, remainingSeconds, startedAt]);

  // Sync title when taskId changes
  useEffect(() => {
    if (selectedTaskId && todos) {
      const found = todos.find((t) => t._id === selectedTaskId);
      if (found) setTaskTitle(found.title);
    }
  }, [selectedTaskId, todos]);

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
    sessionStorage.removeItem(STORAGE_KEY);

    const endedAt = new Date();
    const start = startedAt || new Date(endedAt.getTime() - totalPlannedSeconds * 1000);
    const sessionId = clientSessionIdRef.current || `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const res = await createFocusSessionApi({
        clientSessionId: sessionId,
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

        const title = res.data.session?.taskTitle || taskTitle;
        const msg = title
          ? `Focus session complete! ${plannedMinutes}m added to "${title}".`
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
  }, [mode, plannedMinutes, selectedTaskId, startedAt, totalPlannedSeconds, replaceTodo, taskTitle]);

  // Handle immediate completion if restored timer is already past targetEndTime
  useEffect(() => {
    if (initialPersisted && initialPersisted.timerState === 'RUNNING' && initialPersisted.targetEndTime) {
      const now = Date.now();
      if (now >= initialPersisted.targetEndTime) {
        handleTimerCompletion();
      }
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main countdown tick loop (timestamp accuracy)
  useEffect(() => {
    if (timerState === 'RUNNING') {
      timerIntervalRef.current = setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const now = Date.now();
        const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));

        setRemainingSeconds(diff);
        saveStateToStorage({ timerState: 'RUNNING', remainingSeconds: diff });

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
  }, [timerState, handleTimerCompletion, saveStateToStorage]);

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
        saveStateToStorage();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [timerState, saveStateToStorage]);

  // Control Actions
  const startTimer = () => {
    if (timerState === 'RUNNING') return;

    completionGuardedRef.current = false;
    const now = new Date();
    setStartedAt(now);
    clientSessionIdRef.current = `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setTimerState('RUNNING');
    saveStateToStorage({ timerState: 'RUNNING' });
  };

  const pauseTimer = () => {
    if (timerState !== 'RUNNING') return;
    let currentRemaining = remainingSeconds;
    if (targetEndTimeRef.current) {
      const now = Date.now();
      currentRemaining = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setRemainingSeconds(currentRemaining);
    }
    setTimerState('PAUSED');
    saveStateToStorage({ timerState: 'PAUSED', remainingSeconds: currentRemaining });
  };

  const resumeTimer = () => {
    if (timerState !== 'PAUSED') return;
    targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
    setTimerState('RUNNING');
    saveStateToStorage({ timerState: 'RUNNING' });
  };

  const resetTimer = async () => {
    const elapsedSeconds = totalPlannedSeconds - remainingSeconds;
    const currentClientSessionId = clientSessionIdRef.current;

    // Meaningful elapsed time >= 60s -> log as cancelled
    if ((timerState === 'RUNNING' || timerState === 'PAUSED') && elapsedSeconds >= 60) {
      try {
        const endedAt = new Date();
        const start = startedAt || new Date(endedAt.getTime() - elapsedSeconds * 1000);
        await createFocusSessionApi({
          clientSessionId: currentClientSessionId ? `${currentClientSessionId}_cancelled` : undefined,
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
    sessionStorage.removeItem(STORAGE_KEY);
    setTimerState('IDLE');
    setRemainingSeconds(plannedMinutes * 60);
    setStartedAt(null);
    targetEndTimeRef.current = null;
    clientSessionIdRef.current = null;
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
