# PulseOS Reminder System — Technical Documentation

## Overview

PulseOS provides a real-time task reminder engine. When a user sets a `reminderTime` on a task, the backend scheduler detects when it becomes due and delivers the reminder to the connected browser client via Socket.IO. The browser shows both an in-app toast and a system browser notification.

This is a **single-user** architecture with **no authentication**.

---

## Task Reminder Lifecycle

```
User sets reminderTime on task
        ↓
MongoDB stores reminderTime (UTC Date)
Frontend converts local datetime-local → ISO → API
        ↓
Backend cron scheduler (every 60 seconds)
checks: reminderTime ≤ now AND reminderSent == false AND completed == false
        ↓
Atomic claim: findOneAndUpdate sets reminderSent = true
Only emits if claim succeeds (duplicate protection)
        ↓
Socket.IO emits `todo:reminder` to all connected clients
        ↓
Frontend ReminderListener receives event
        ↓
1. Local todo state updated (reminderSent → true)
2. In-app toast shown (React Toastify)
3. Browser Notification API fires (if permission granted)
```

---

## Timezone Handling

- `datetime-local` HTML input produces **local browser time**
- Frontend converts to ISO 8601 (`new Date(value).toISOString()`) before sending to the API
- MongoDB stores all dates as **UTC Date objects**
- Backend scheduler compares `Date` objects directly (never string comparisons)
- Frontend displays using `toLocaleTimeString()` for user's local timezone

---

## Socket.IO Event Contract

### Event: `todo:reminder`

**Direction:** Server → Client

**Payload:**
```json
{
  "id": "MongoDB ObjectId as string",
  "title": "Task title",
  "reminderTime": "ISO 8601 date string"
}
```

No other task fields are sent. Minimal payload by design.

---

## Scheduler Behavior

**File:** `backend/src/scheduler/reminder.scheduler.js`

- Uses `node-cron` with `* * * * *` (every minute)
- Started once in `server.js` after MongoDB connection and Socket.IO initialization
- Query: `{ reminderTime: { $ne: null, $lte: now }, reminderSent: false, completed: false }`

### Atomic Duplicate Protection

For each candidate todo, the scheduler performs:

```javascript
findOneAndUpdate(
  { _id: todo._id, reminderSent: false },
  { $set: { reminderSent: true } },
  { new: true }
)
```

Only if the update returns a document (claim succeeded) does the scheduler emit the Socket.IO event. This prevents duplicate emissions across overlapping scheduler ticks.

### Zero-Connected-Client Safety

Before processing any reminders, the scheduler checks `getConnectedClientCount()`. If **zero clients** are connected:

- Reminders are **NOT claimed**
- `reminderSent` stays `false`
- Reminders remain pending

When a client reconnects, the next scheduler tick (or immediate catch-up) delivers them.

**Rationale:** If the backend blindly marked `reminderSent = true` with no connected clients, the user would permanently miss the reminder.

---

## Immediate Catch-Up on Reconnect

When a Socket.IO client connects, the backend triggers `processDueReminders()` after a 1-second delay. This means:

- If a reminder became due during disconnection, it is delivered within ~1 second of reconnecting
- The user doesn't have to wait up to 60 seconds for the next cron tick

Uses lazy `require()` to avoid circular dependency between `socket.js` and `reminder.scheduler.js`.

---

## Notification Permission UX

**Permission is NOT requested on page load.**

Permission is requested **contextually** — only when the user first sets or edits a `reminderTime`:

1. If permission is `'granted'` → proceed silently
2. If permission is `'default'` → show `NotificationPermissionDialog` explaining the feature
3. If permission is `'denied'` → show in-app toast: "Browser notifications are blocked. Your reminder will still appear inside PulseOS while the app is open."

The browser's native permission prompt is only triggered after the user clicks "Allow notifications" in the custom dialog.

---

## `reminderSent` Semantics

`reminderSent` currently means:

> "The backend has atomically claimed this reminder and emitted it via Socket.IO."

It does **NOT** guarantee:
- The browser was open
- The notification was seen
- The browser notification API succeeded

**Future:** Web Push + Service Worker delivery would introduce more robust delivery confirmation.

---

## Reminder Edit/Clear Behavior

| Action | `reminderTime` | `reminderSent` |
|--------|----------------|----------------|
| Set new reminder | New Date | `false` |
| Edit existing reminder | Updated Date | Reset to `false` |
| Clear reminder (set null) | `null` | Reset to `false` |
| Reminder fires | Unchanged | `true` |
| Complete task before fire | Unchanged | Unchanged (scheduler skips) |

---

## Completed Task Behavior

The scheduler query includes `completed: false`. If a task is completed before its reminder fires, no reminder is emitted. The `reminderTime` is preserved for historical record.

---

## Known Limitations

1. **Browser must be open.** Reminders only work when the PulseOS browser tab is open and has an active Socket.IO connection. Closed browser = no notification.

2. **No offline delivery.** There is no Service Worker or Web Push implementation yet. This is planned for a future phase.

3. **Single-user only.** No user authentication, no socket rooms, no per-user targeting. All connected clients receive all reminders.

4. **1-minute granularity.** The cron scheduler runs every 60 seconds. A reminder set for 10:30:45 may fire between 10:30:00 and 10:31:00.

5. **No retry on delivery failure.** If the Socket.IO emit fails silently, `reminderSent` is already `true`. No retry mechanism exists.

---

## File Map

### Backend
| File | Responsibility |
|------|---------------|
| `backend/src/sockets/socket.js` | Socket.IO initialization, connection events, catch-up trigger |
| `backend/src/scheduler/reminder.scheduler.js` | Cron scheduling, due reminder query, atomic claim, emission |
| `backend/src/models/Todo.js` | `reminderTime` and `reminderSent` schema fields |
| `backend/src/controllers/todo.controller.js` | CRUD with reminderSent reset logic |
| `backend/server.js` | HTTP server, Socket.IO init, scheduler start |

### Frontend
| File | Responsibility |
|------|---------------|
| `frontend/src/context/SocketContext.jsx` | React context for socket instance |
| `frontend/src/context/SocketProvider.jsx` | Socket.IO client connection lifecycle |
| `frontend/src/context/useSocket.jsx` | Hook to consume socket context |
| `frontend/src/utils/Notification.jsx` | Browser Notification API utilities |
| `frontend/src/utils/useNotificationPermission.jsx` | Permission state + dialog trigger hook |
| `frontend/src/components/notifications/NotificationPermissionDialog.jsx` | Explanatory dialog |
| `frontend/src/components/notifications/ReminderListener.jsx` | Socket event listener + toast + browser notification |
| `frontend/src/components/tasks/TaskQuickAdd.jsx` | Permission flow integration on add |
| `frontend/src/components/tasks/TaskEditor.jsx` | Permission flow integration on edit |
| `frontend/src/components/tasks/TaskItem.jsx` | Reminder sent/upcoming state display |
