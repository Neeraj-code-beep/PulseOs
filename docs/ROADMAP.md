# PulseOS — Product Development Roadmap

## Phase 1: Remediation & Technical Standardizing (Completed)
- [x] Fix `reminderTime` naming end-to-end
- [x] Extract `todo.controller.js`
- [x] Standardize JSON API response contract
- [x] Resolve ESLint context export errors

---

## Phase 2A: Product & Design Blueprint (Completed)
- [x] Product Specification (`PRODUCT-SPEC.md`)
- [x] Design System (`DESIGN-SYSTEM.md`)
- [x] UX Workflows (`UX-FLOWS.md`)

---

## Phase 2B: Frontend Design Foundation & Application Shell (Completed)
- [x] Install `react-router-dom`, `lucide-react`, `framer-motion`
- [x] CSS design tokens & Light/Dark theme provider (`ThemeProvider`, `ThemeToggle`)
- [x] Core primitives (`<Button>`, `<Card>`, `<Input>`, `<Badge>`)
- [x] Responsive layout shell (`AppLayout` with Top desktop header & Mobile bottom nav)
- [x] React Router setup (`/app`, `/tasks`, `/focus`, `/analytics`, `*`)

---

## Phase 3: Task Workspace & Planning Experience (Completed)
- [x] Schema extension (`dueDate`, `priority`, `estimatedMinutes`, `reminderTime`, `reminderSent`)
- [x] Task component architecture (`TaskQuickAdd`, `TaskItem`, `TaskList`, `TaskEditor`, `TaskFilters`, `TaskEmptyState`)
- [x] Filtering and deterministic sorting

---

## Phase 4A: Real-Time Reminders & Socket.IO Infrastructure (Completed)
- [x] Socket.IO initialization architecture (`sockets/socket.js`)
- [x] Node-cron background reminder scheduler (`scheduler/reminder.scheduler.js`)
- [x] Contextual browser notification permission UX & Toastify fallback

---

## Phase 4B: Focus / Pomodoro Engine & Task Binding (Completed)
- [x] Mongoose `FocusSession` model & schema extension on `Todo` (`focusTimeSpent`)
- [x] Express focus controller & routes (`POST /api/focus/sessions`, `GET /api/focus/sessions`, `GET /api/focus/summary`)
- [x] Atomic `$inc` crediting of completed focus minutes on Todo
- [x] Frontend `FocusProvider` & `useFocus` hook with timestamp-based timer accuracy & canonical state machine (`IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`)
- [x] Focus component suite (`TimerDisplay`, `TimerControls`, `FocusModeSelector`, `FocusTaskSelector`, `SessionComplete`)
- [x] Deep link integration (`/focus?task=<id>`), navbar active indicator, & document title updates
- [x] Technical documentation (`docs/FOCUS-SYSTEM.md`)

---

## Phase 5: Productivity Analytics & AI Task Planning (Next Phase)
- Build `/analytics` workspace with daily/weekly focus charts
- Integrate AI Task Breakdown and Time Estimation API endpoints
- Build contextual AI Assistant drawer component
