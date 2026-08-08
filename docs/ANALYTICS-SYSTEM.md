# Analytics System & Foundation

## Overview
The Analytics Data Foundation (Phase 5A) provides real-time, real-data productivity metrics aggregated from `FocusSession` and `Todo` models.

## Architecture
```
Route (GET /api/analytics/*)
  ↓
Controller (analytics.controller.js)
  ↓
Analytics Service (analytics.service.js)
  ↓
Mongoose Models (Todo & FocusSession)
  ↓
MongoDB Aggregations & Queries
  ↓
Standard API Response
```

## Metrics Definitions

### 1. Productivity Overview (`GET /api/analytics/overview`)
- **`focusTodayMinutes`**: Sum of `actualSeconds` across completed `FocusSession` records whose `startedAt` falls within today's calendar boundary (00:00:00 to 23:59:59 local server time). Calculated as `Math.round(totalSeconds / 60)`.
- **`focusWeekMinutes`**: Sum of `actualSeconds` across completed `FocusSession` records whose `startedAt` falls within the current local calendar week (Monday 00:00:00 to Sunday 23:59:59).
- **`completedTasksToday`**: Count of `Todo` documents with `completed: true` where `completedAt` falls within today's calendar boundary.
- **`completedTasksWeek`**: Count of `Todo` documents with `completed: true` where `completedAt` falls within the current Monday-Sunday calendar week.
- **`sessionsToday`**: Count of completed `FocusSession` documents started today.
- **`sessionsWeek`**: Count of completed `FocusSession` documents started this week.
- **`averageSessionMinutes`**: Average actual session duration in minutes across all completed `FocusSession` records all-time (`Math.round(totalSeconds / count / 60)`). Returns `0` when no completed sessions exist.
- **`totalFocusMinutes`**: Accumulated total actual focus minutes across all completed `FocusSession` records all-time.

### 2. Focus Trend (`GET /api/analytics/focus-trend?days=7`)
- **Supported Parameters**: `days` = `7`, `14`, or `30` (defaults to `7`). Any other value returns `400 Bad Request`.
- **Output Structure**: Chronological array of points from oldest to newest covering every calendar day in the requested window.
- **Zero-Activity Days**: Days with 0 completed sessions are explicitly returned with `focusMinutes: 0` and `sessions: 0`.

### 3. Task Performance (`GET /api/analytics/task-performance`)
- **`plannedMinutes`**: Sum of `estimatedMinutes` across all `Todo` documents where `estimatedMinutes > 0`.
- **`focusedMinutes`**: Total actual focus minutes recorded across all completed `FocusSession` records.
- **`completionRate`**: Percentage of completed tasks relative to total tasks (`Math.round((completed / total) * 100)`). Returns `0` if total tasks is 0.
- **`plannedVsActualRatio`**: `focusedMinutes / plannedMinutes` rounded to 2 decimal places. Returns `0` if `plannedMinutes` is 0.

## Date Boundaries & Timezone Strategy
- Uses calendar boundaries derived from the server's local timezone:
  - Today: `00:00:00.000` to `23:59:59.999`
  - Week: Current Monday `00:00:00.000` to Sunday `23:59:59.999`
- Avoids rolling naive 24-hour / 7-day windows to match calendar day expectation.

## FocusSession Source of Truth
- `FocusSession` history is the sole source of truth for focus duration analytics. `Todo.focusTimeSpent` is an accumulated cache for quick task-level UI display, while analytics metrics calculate exclusively from completed `FocusSession` entries (`status: 'completed'`).

## `completedAt` Semantics
- Added `completedAt: Date | null` field to the `Todo` schema.
- Set to `new Date()` when `completed` transitions `false → true`.
- Set to `null` when `completed` transitions `true → false`.
- Unrelated updates preserve `completedAt`.

## API Contracts & Response Format
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

## Zero-Data Behavior
For a fresh or empty database, all endpoints return valid responses with zero values (`0` minutes, `0` sessions, `0` tasks) without exceptions or missing fields.
