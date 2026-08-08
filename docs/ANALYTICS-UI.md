# Productivity Insights Workspace (Analytics UI)

## Overview
The Productivity Insights Workspace (`/analytics`) transforms raw focus session and task completion data into a calm, personal study intelligence dashboard.

## Component Architecture
```
Analytics.jsx (Page Orchestrator)
  ├── AnalyticsHeader.jsx (Title, Subtitle, 7D/14D/30D Period Selector)
  ├── AnalyticsMetricStrip.jsx (Overview metrics strip with subtle dividers)
  ├── FocusTrendChart.jsx (Recharts bar chart with Forest Green styling & custom tooltip)
  ├── Secondary Grid (2-column layout on desktop)
  │     ├── TaskPerformance.jsx (Planned vs Focused comparison bar & Completion rate)
  │     └── RecentFocusSessions.jsx (Session history list with status badges)
  └── InsightSummary.jsx (Deterministic, metric-driven rhythm observations)
```

## Chart Design Decisions
- **Color Palette**: Forest Green (`#2F7D68` / `var(--focus)`), Warm Surface (`#FBFAF7` / `var(--bg-surface)`), Muted Text (`#96938C`).
- **Tooltip**: Custom HTML tooltip styled with warm surface background, thin border, and formatted date/duration text.
- **Zero-Value Days**: Days with 0 completed sessions are rendered with muted zero-bars, preserving exact calendar spacing without scale distortion.
- **Micro-Summary**: Calculates the user's strongest focus day dynamically (e.g. "Your strongest day was Thursday").

## Data Orchestration & Error Isolation
- **Overview, Task Performance, Recent Sessions**: Fetched on page mount.
- **Focus Trend**: Fetched on mount and refetched whenever period selector (`7`, `14`, `30`) changes without reloading the rest of the page.
- **Sectional Error States**: If the trend chart API fails, overview metrics and recent sessions remain functional and retryable independently.

## Accessibility
- **Screen Reader Context**: `FocusTrendChart.jsx` includes a `sr-only` aria-live region summarizing the trend data textually.
- **Period Selector**: Uses `role="group"` and `aria-pressed` for active period pills.
- **Reduced Motion**: Animations check `prefers-reduced-motion` and disable non-essential motion.
