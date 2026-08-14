# PulseOS Focus / Pomodoro Engine — Technical Documentation

## Overview

PulseOS integrates a dedicated Focus & Deep Work engine connecting task management with time tracking. Users can attach incomplete tasks to a standard 25-minute Pomodoro cycle or custom timer interval (1–180 minutes). Completed focus sessions are stored in MongoDB as `FocusSession` documents and automatically increment `Todo.focusTimeSpent` in minutes.

---

## Focus Architecture

```
React App (AppLayout)
  └── FocusProvider (Context Layer)
        ├── Timer State Machine ('IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED')
        ├── Timestamp-based accuracy (targetEndTime = Date.now() + remainingSeconds * 1000)
        ├── Route navigation persistence & beforeunload warnings
        └── Focus API Service (focusApi.jsx)
```

---

## FocusSession Schema

**Model File:** `backend/src/models/FocusSession.js`

```javascript
{
  taskId: { type: Schema.Types.ObjectId, ref: 'ToDo', default: null },
  taskTitle: { type: String, default: null }, // Historical title snapshot
  mode: { type: String, enum: ['pomodoro', 'custom'], required: true },
  plannedMinutes: { type: Number, required: true, min: 1 },
  actualSeconds: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['completed', 'cancelled'], required: true },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date, required: true }
}
```

---

## Extended Todo Schema

**Model File:** `backend/src/models/Todo.js`

```javascript
focusTimeSpent: {
  type: Number,
  default: 0,
  min: 0
}
```

`focusTimeSpent` accumulates total completed focus time in **MINUTES**.

---

## API Contracts

### 1. Create/Complete Focus Session
- **POST** `/api/focus/sessions`
- **Body**:
  ```json
  {
    "taskId": "65b...",
    "mode": "pomodoro",
    "plannedMinutes": 25,
    "actualSeconds": 1500,
    "status": "completed",
    "startedAt": "2026-08-02T01:00:00.000Z",
    "endedAt": "2026-08-02T01:25:00.000Z"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Focus session created successfully.",
    "data": {
      "session": { ... },
      "task": { ...updatedTodo }
    }
  }
  ```

### 2. Get Recent Focus Sessions
- **GET** `/api/focus/sessions?limit=10`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Focus sessions retrieved successfully.",
    "data": [ ...sessions ]
  }
  ```

### 3. Get Focus Summary
- **GET** `/api/focus/summary`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Focus summary retrieved successfully.",
    "data": {
      "focusSecondsToday": 3000,
      "completedSessionsToday": 2,
      "totalFocusSeconds": 15000,
      "totalCompletedSessions": 10
    }
  }
  ```

---

## Timer Accuracy & Timestamp Strategy

To prevent browser tab throttling, page refresh data loss, and timer drift:
1. When timer starts or resumes: `targetEndTime = Date.now() + remainingSeconds * 1000` and generates a unique `clientSessionId`.
2. Active `RUNNING` or `PAUSED` timer state is saved to `sessionStorage` (`pulse_focus_session`).
3. On page refresh/remount, if a `RUNNING` timer is restored, remaining time is recalculated using actual wall-clock time: `remainingSeconds = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000))`. If the restored timer is already past `targetEndTime`, it completes immediately.
4. Every 250ms tick: `remainingSeconds = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000))`.
5. When `remainingSeconds === 0`, `handleTimerCompletion()` fires using a `completionGuardedRef` guard and sends `clientSessionId` to the backend. The backend enforces unique `clientSessionId` idempotency via MongoDB index, guaranteeing **exactly one** API session record is created per completion and `focusTimeSpent` is incremented only once.

---

## Cancel & Reset Behavior

- **< 60 seconds elapsed**: Resetting discards the session without saving and clears `sessionStorage`.
- **≥ 60 seconds elapsed**: Resetting during `RUNNING` or `PAUSED` logs a `status: 'cancelled'` session record (with `clientSessionId_cancelled`) to preserve study history without crediting `focusTimeSpent` on the Todo. Clears `sessionStorage`.

---

## Deep Link & Navigation Integration

- **Task Menu Deep Link**: `/focus?task=<todoId>` preselects the targeted task in `FocusTaskSelector`.
- **Today Focus CTA**: Navigates to `/focus?task=<nextIncompleteTaskId>`.
- **Navbar Focus Indicator**: Displays an animated pulse dot when a focus timer is actively `RUNNING`.
- **Document Title**: Updates to `24:32 ▶ · Focus · PulseOS` while active.
