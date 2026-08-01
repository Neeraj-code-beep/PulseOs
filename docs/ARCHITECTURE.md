# PulseOS / Productive App - Current Architecture & System Design

## Overview
PulseOS is a single-user full-stack task management and productivity application. This document details the **CURRENT** system architecture following Phase 4B Focus/Pomodoro Engine & Task Binding.

---

## High-Level Architecture Diagram

```
[ React 19 Client (Vite + React Router 7) ]
  ├── Router & Application Shell (AppLayout.jsx)
  │     ├── Top Desktop Header (Active Focus Indicator) + Mobile Bottom Nav
  │     └── Routes: /app (Today), /tasks (Tasks), /focus (Focus), /analytics (Analytics)
  ├── Focus Components (src/components/focus/)
  │     ├── TimerDisplay.jsx (SVG circular progress + font-timer numerals)
  │     ├── TimerControls.jsx (IDLE, RUNNING, PAUSED, COMPLETED controls)
  │     ├── FocusModeSelector.jsx (Pomodoro 25m vs Custom duration choices)
  │     ├── FocusTaskSelector.jsx (Incomplete task binding + snapshot details)
  │     └── SessionComplete.jsx (Restrained completion feedback + mark task complete)
  ├── Task Components (src/components/tasks/)
  │     ├── TaskItem.jsx (Task card with focusTimeSpent metadata & deep link)
  │     └── ...
  ├── Context Layer
  │     ├── ThemeProvider & useTheme
  │     ├── TodoProvider & TodoContext (with replaceTodo for instant state updates)
  │     ├── SocketProvider & SocketContext
  │     └── FocusProvider & useFocus (Timestamp-based timer state machine)
  └── Services (focusApi.jsx & Api.jsx)
            │
            │ HTTP REST (JSON)        Socket.IO (WebSocket)
            ▼                         ▼
[ Express 5 Node.js Server + Socket.IO ]
  ├── Focus Routes & Controller (routes/FocusRoutes.js & controllers/focus.controller.js)
  │     ├── POST /api/focus/sessions (Creates session & increments Todo.focusTimeSpent via $inc)
  │     ├── GET  /api/focus/sessions (Paginated recent sessions list)
  │     └── GET  /api/focus/summary  (Today & all-time focus statistics)
  ├── Todo Routes & Controller (routes/TodoRoutes.js & controllers/todo.controller.js)
  └── Reminder Scheduler (scheduler/reminder.scheduler.js)
            │
            ▼
[ MongoDB Database ]
  ├── Collection: todos (Schema extended with focusTimeSpent)
  └── Collection: focussessions (Schema: taskId, taskTitle, mode, plannedMinutes, actualSeconds, status, startedAt, endedAt)
```

---

## Provider Tree

```
ThemeProvider
  └── TodoProvider
        └── SocketProvider
              └── FocusProvider
                    ├── ReminderListener (headless)
                    ├── App (routes + pages)
                    └── ToastContainer
```
