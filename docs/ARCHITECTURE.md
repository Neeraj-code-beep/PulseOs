# PulseOS / Productive App - Current Architecture & System Design

## Overview
PulseOS is a multi-user full-stack task management and productivity application featuring JWT authentication and user-scoped productivity data isolation. This document details the **CURRENT** system architecture following Phase 5D Authentication & User Data Ownership.

---

## High-Level Architecture Diagram

```
[ React 19 Client (Vite + React Router 7) ]
  ├── Router & Application Shell (AppLayout.jsx + ProtectedRoute.jsx)
  │     ├── Public Routes: /login, /register
  │     ├── Protected Routes: /app (Today), /tasks (Tasks), /focus (Focus), /analytics (Analytics)
  │     └── Top Desktop Header (User Profile + Logout) + Mobile Bottom Nav
  ├── Context Layer
  │     ├── ThemeProvider & useTheme
  │     ├── AuthProvider & useAuth (JWT token restoration, login, register, logout)
  │     ├── TodoProvider & TodoContext (User-scoped tasks)
  │     ├── SocketProvider & SocketContext
  │     └── FocusProvider & useFocus (Timestamp-based timer state machine)
  └── Services (authApi.jsx, focusApi.jsx, analyticsApi.jsx, aiApi.jsx & Api.jsx with JWT Bearer interceptor)
            │
            │ HTTP REST (JSON)        Socket.IO (WebSocket)
            ▼                         ▼
[ Express 5 Node.js Server + Socket.IO ]
  ├── Auth Routes, Controller, Service & Middleware (Phase 5D)
  │     ├── POST /api/auth/register (Account registration & password hashing with bcryptjs)
  │     ├── POST /api/auth/login    (Authentication & JWT token generation)
  │     ├── GET  /api/auth/me       (Token validation & user profile retrieval)
  │     └── auth.middleware.js      (Verifies Bearer JWT & populates req.user.userId)
  ├── AI Routes & Controller (Secured with authMiddleware)
  ├── Analytics Routes, Controller & Service (User-scoped aggregations via req.user.userId)
  ├── Focus Routes & Controller (User-scoped session logging & task binding)
  ├── Todo Routes & Controller (User-scoped CRUD)
  └── Reminder Scheduler (scheduler/reminder.scheduler.js)
            │
            ▼
[ MongoDB Database ]
  ├── Collection: users (Schema: name, email, passwordHash, timestamps)
  ├── Collection: todos (Schema: userId, title, completed, completedAt, dueDate, priority, estimatedMinutes, reminderTime, reminderSent, focusTimeSpent)
  └── Collection: focussessions (Schema: userId, taskId, taskTitle, mode, plannedMinutes, actualSeconds, status, startedAt, endedAt)
```

---

## Provider Tree

```
ThemeProvider
  └── AuthProvider
        └── TodoProvider
              └── SocketProvider
                    └── FocusProvider
                          ├── ReminderListener (headless)
                          ├── App (routes + pages)
                          └── ToastContainer
```

