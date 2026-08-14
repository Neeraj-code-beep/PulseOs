# PulseOS — User Experience & Workflow Specifications

## 1. Task Creation & Progressive Disclosure Flow
1. **Quick Add Trigger**: User clicks `+ Add a task...` on `/tasks` or `New task` in the top header.
2. **Compact Composer**: Expands smoothly displaying the primary field: *"What needs your attention?"*
3. **Secondary Metadata Controls**:
   - `Due Date`: Date picker (`<input type="date">`) specifying task completion deadline.
   - `Reminder`: Date/time picker (`<input type="datetime-local">`) specifying notification alert time.
   - `Priority`: Select dropdown (`Low`, `Medium`, `High`).
   - `Estimate`: Number input (`estimatedMinutes`).
4. **Keyboard Accessibility**: `Enter` submits the form; `Escape` cancels and collapses the composer.

---

## 2. Notification Permission Flow (Contextual UX)
1. **Trigger**: User sets or updates `reminderTime` on a task via `TaskQuickAdd` or `TaskEditor`.
2. **Permission Check**:
   - **Granted**: Form submits silently without prompting.
   - **Default (Unset)**: `NotificationPermissionDialog` app modal is shown before calling browser API. Explains value of reminders. User clicks "Allow notifications" -> native browser prompt shown. User clicks "Not now" -> proceeds without native prompt.
   - **Denied**: Informational toast displayed: *"Browser notifications are blocked. Your reminder will still appear inside PulseOS while the app is open."* Proceeds without error.
3. **No Intrusive Prompts**: Permission is NEVER requested on page load or app mount.

---

## 3. Real-Time Reminder Delivery Flow
1. **Scheduler Event**: Backend cron (runs every 60s) or reconnect catch-up detects due reminder, performs atomic claim (`reminderSent: true`), and emits `todo:reminder` event via Socket.IO.
2. **Frontend Listener**: `ReminderListener` receives event.
3. **Dual Delivery**:
   - **In-App Toast**: React Toastify displays `🔔 Reminder: <title>` (auto-closes in 6s).
   - **Browser System Notification**: If Notification API permission is granted, triggers OS notification tagged `todo-reminder-<id>`.
4. **Local State Sync**: `markReminderSentLocally(id)` updates TodoContext state so task UI displays "Sent" badge without requiring full page refetch.

---

## 4. Full-Page Homepage Composition & Section Rhythm (/app)
The Product Home `/app` operates as a hybrid personal dashboard and product showcase:
1. **HeroWorkspace**: Editorial headline (*"Make today count."*), live metric bar, primary CTAs (`Plan my day`, `Start focus`), and bespoke code-built **Pulse Board** interactive illustration.
2. **DailyWorkspace**: Real task execution list paired with an integrated focus instrument sidebar rail.
3. **Methodology**: High-contrast dark charcoal band (`#1D1D1A`) presenting the connected **Plan → Focus → Improve** horizontal narrative.
4. **FocusPreview**: Visual focus timer instrument preview displaying standard Pomodoro interval structure and task binding.
5. **PlanningPreview**: Illustrative task breakdown decomposition preview.
6. **InsightsPreview**: CSS-rendered weekly rhythm velocity chart visualizer.
7. **FinalCTA & Footer**: End-of-page action call and global dark footer with developer attribution to Neeraj Mishra.

---

## 5. Tasks Workspace 2-Zone Layout (/tasks)
Desktop view (≥ 1024px) utilizes a 2-zone desktop composition:
- **Left Main Workspace (70%)**: Task quick add composer, filter tabs (`Today`, `Upcoming`, `All Tasks`, `Completed`), and single-container list surface (`TaskList`).
- **Right Planning Rail (30%)**: Workload summary box displaying tasks due today, total estimated workload in hours/minutes, next scheduled reminder (filters out past & sent reminders), and focus CTA.

---

## 6. AI Task Breakdown Flow (Contextual Planning)
1. **Trigger**: User opens `TaskEditor` modal for any task and clicks `Break down` under the PULSE ASSISTANT section.
2. **Initial State**: `TaskBreakdownPanel` expands inside the editor modal explaining: *"Turn a large task into focused work blocks."*
3. **Execution**: User clicks `Generate breakdown`. UI transitions to loading state: *"Planning your focus blocks…"* while backend calls `POST /api/ai/breakdown`.
4. **Structured Result**: Renders AI summary and 2–5 numbered work blocks (01, 02, 03...) with estimated minutes per block and total duration.
5. **Apply Action**: User clicks `Apply breakdown`. Updates `estimatedMinutes` field in `TaskEditor` form. User clicks `Save changes` to persist to database.
6. **Error Grace**: If AI API fails or key is missing, displays user-friendly error *"Pulse couldn't create a breakdown right now."* with `Try again` and `Close` options without exposing server stack traces.

---

## 7. AI Time Estimation Flow (Phase 5C.2)
1. **Trigger**: User opens `TaskEditor` modal and clicks `Estimate with Pulse` under PULSE ASSISTANT section.
2. **Initial State**: `TaskEstimatorPanel` expands explaining: *"How long will this realistically take?"*
3. **Execution**: User clicks `Estimate time`. Loading state shows: *"Estimating a realistic focus time…"* while backend calls `POST /api/ai/estimate`.
4. **Result**: Displays estimated focus duration (e.g. `90 min`) with a concise explanation.
5. **Apply Action**: User clicks `Use 90 min`. Updates `estimatedMinutes` field in editor. Task is NOT modified until user saves.
6. **Dismiss**: User can dismiss without applying the estimate.

---

## 8. Smart Schedule Proposal Flow (Phase 5C.2)
1. **Trigger**: User opens `TaskEditor` modal and clicks `Smart Schedule` under PULSE ASSISTANT section.
2. **Initial State**: `ScheduleProposalPanel` shows availability form with Date, Start Time, and End Time fields.
3. **Execution**: User fills availability (e.g. 4:00 PM – 8:00 PM) and clicks `Build schedule`. Backend calls `POST /api/ai/schedule`.
4. **Result (fits)**: Displays `YOUR PROPOSED FOCUS PLAN` with chronological focus blocks and short breaks. Shows total focus and break minutes.
5. **Result (insufficient)**: If task needs more time than available, shows warning: *"This task needs more time than the selected availability."* with `Adjust window` option.
6. **Actions**: `Use this plan` navigates to Focus page with the task selected. `Adjust` returns to the availability form. `Dismiss` closes the panel.
7. **No Database Mutation**: Schedule proposals are preview-only. No schedule records are persisted.

---

## 9. Integrated AI Productivity Workflow
The complete PLAN → FOCUS → IMPROVE workflow from TaskEditor:
```
Tasks → Edit task → PULSE ASSISTANT
         ├── Break down   → Generate work blocks → Apply breakdown
         ├── Estimate      → Get AI estimate → Use estimate
         └── Smart Schedule → Set availability → Build schedule → Focus
```
Each action is independent. A user can break down, estimate, or schedule in any order.

---

## 10. Real-Time User-Scoped Socket & Realtime Analytics Synchronization Flow (Phase 5E)
1. **Authenticated Socket Connection**: When a user logs in, `SocketProvider` passes the JWT token in the WebSocket handshake. The server verifies the token and joins room `user:<userId>`.
2. **User-Scoped Reminder Delivery**: When a scheduled reminder is due, `reminder.scheduler.js` emits `todo:reminder` specifically to room `user:<userId>`. No cross-user leakage or global broadcasts occur.
3. **Event Trigger**: When a focus session is saved or a task is updated/completed, the backend emits `productivity:updated` (payload `{ type: 'focus_completed' | 'task_completed' | 'task_updated' }`) to room `user:<userId>`.
4. **Analytics Refetch**: The `Analytics` page socket listener catches `productivity:updated` and executes a single debounced (300ms) refetch of the consolidated `GET /api/analytics/dashboard?days=currentPeriod` endpoint, updating overview metrics, trend charts, task performance, and recent focus sessions in one optimized network round-trip.
