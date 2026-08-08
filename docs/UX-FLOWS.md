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
1. **Trigger**: User opens `TaskEditor` modal for any task and clicks `Break down with Pulse` (Sparkles icon).
2. **Initial State**: `TaskBreakdownPanel` expands inside the editor modal explaining: *"Turn a large task into focused work blocks."*
3. **Execution**: User clicks `Generate breakdown`. UI transitions to loading state: *"Planning your focus blocks…"* while backend calls `POST /api/ai/breakdown`.
4. **Structured Result**: Renders AI summary and 2–5 numbered work blocks (01, 02, 03...) with estimated minutes per block and total duration.
5. **Apply Action**: User clicks `Apply breakdown`. Updates `estimatedMinutes` field in `TaskEditor` form. User clicks `Save changes` to persist to database.
6. **Error Grace**: If AI API fails or key is missing, displays user-friendly error *"Pulse couldn't create a breakdown right now."* with `Try again` and `Close` options without exposing server stack traces.
