# PulseOS — Product Specification

## 1. Product Vision & Positioning
**PulseOS** is an integrated student productivity workspace built around the **PLAN → FOCUS → IMPROVE** methodology. It bridges task management, time division, focused execution, and performance feedback into a single, cohesive interface.

---

## 2. Target User Profile & Problem Statement
- **Target User**: Students, developers, and self-directed learners managing coursework, revision, coding projects, and exam preparation.
- **Core Problem**: Users know *what* they must achieve, but struggle with time division, task estimation, overcoming initiation friction, and maintaining uninterrupted focus.
- **Product Solution**: Unified workspace combining structured task lists, contextual AI workload planning, immersive focus timers, and automatic productivity analytics.

---

## 3. Information Architecture & Navigation Structure

```
[ Top Navbar / Mobile Navigation ]
  ├── App Logo & Active View Switcher
  │     ├── /app (Today Dashboard)
  │     ├── /tasks (Task Workspace & Planning)
  │     ├── /focus (Focus & Pomodoro Timer Workspace)
  │     └── /analytics (Productivity Insights)
  └── Global Actions (Quick Add + Contextual AI Drawer)
```

---

## 4. Task Domain Model (Implemented Phase 3)

| Field Name | Type | Validation / Semantics | Default |
| :--- | :--- | :--- | :--- |
| `title` | String | Required, trimmed, non-empty | N/A |
| `completed` | Boolean | Task completion status | `false` |
| `dueDate` | Date | "When should this task be finished?" | `null` |
| `priority` | String | Enum: `['low', 'medium', 'high']` | `'medium'` |
| `estimatedMinutes` | Number | Positive number (min: 1) representing estimated duration | `null` |
| `reminderTime` | Date | "When should PulseOS notify me?" | `null` |
| `reminderSent` | Boolean | Managed by backend reminder scheduler | `false` |

---

## 5. Feature Scope Matrix (MVP / V1 / FUTURE)

| Feature Area | MVP (Implemented & Active) | V1 (Enhancements) | Future |
| :--- | :--- | :--- | :--- |
| **Tasks** | Title, DueDate, Priority (Low/Med/High), EstimatedMinutes, ReminderTime | Subtasks, Tags | Multi-user Collaboration |
| **Focus** | Pomodoro & Custom Timer, Task Binding, Auto Session Log | Ambient Sounds, Streak Tracking | Shared Study Rooms |
| **AI** | Task Breakdown, Time Estimator, Smart Schedule Proposer | Contextual Focus Tips | Voice Assistant |
| **Analytics**| Daily/Weekly Focus Hours, Completion Rate, Trend Chart | Task Category Breakdown | Semester Goals |
| **Reminders**| In-app Toast & Browser Notification API via Socket.IO | Web Push Service Worker | SMS/Email Alerts |

---

## 6. Key Product Differentiators
1. **Unified Task-Focus Loop**: Focus sessions are bound directly to active tasks, automatically logging completed time and updating task state upon timer completion.
2. **Contextual AI Time Division**: AI estimates task effort and generates realistic, break-padded time blocks based on available student hours.
3. **Calm, High-Polish UX**: Distraction-free focus view inspired by Stripe and Vercel minimalist design standards.
