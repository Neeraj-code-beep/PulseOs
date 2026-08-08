# PulseOS — AI Productivity System Architecture

## Overview
The AI Productivity Layer in PulseOS operates directly within the student's task planning workflow as a productivity engine (**PLAN → FOCUS → IMPROVE**). It is NOT a generic chatbot.

**Phase 5C.1** introduced **AI Task Breakdown**: breaking complex study goals into 2–5 concrete work blocks with realistic time estimates.

**Phase 5C.2** adds **AI Time Estimation** and **Smart Schedule Proposals**: estimating realistic focused work duration for any task, and generating deterministic focus-block schedules within a student's availability window.

---

## 1. Provider Abstraction Architecture

```
[ Frontend: TaskEditor.jsx ]
         │
         ├──► [ TaskBreakdownPanel.jsx ] ──► aiApi.jsx (POST /api/ai/breakdown)
         ├──► [ TaskEstimatorPanel.jsx ] ──► aiApi.jsx (POST /api/ai/estimate)
         └──► [ ScheduleProposalPanel.jsx ] ──► aiApi.jsx (POST /api/ai/schedule)
                                                    │
                                                    ▼
                                            [ AiRoutes.js ]
                                                    │
                                                    ▼
                                          [ ai.controller.js ]
                                                    │
                                                    ▼
                              [ ai.service.js ] (Validation, Prompt Engineering,
                                                 JSON Parsing, Schedule Algorithm)
                                                    │
                                        ┌───────────┴──────────┐
                                        ▼                      ▼
                              [ ai.provider.js ]     [ Deterministic Schedule
                              (Google Gemini SDK)      Algorithm (no LLM) ]
                                        │
                                        ▼
                            [ Google Gemini LLM
                              (gemini-2.0-flash) ]
```

### Responsibility Separation
- **AI Provider**: Handles LLM communication (time estimation, task breakdown). Used ONLY when AI inference is needed.
- **Application Logic**: Deterministic schedule block generation. No LLM calls. Predictable, testable mathematics.

---

## 2. Security & Environment Rules
- **Backend-Only Keys**: `GEMINI_API_KEY` (or `AI_API_KEY`) is stored exclusively in `backend/.env`.
- **No Secret Exposure**: Neither the frontend nor error payloads ever receive the API key or raw stack traces.
- **Untrusted Output Protection**: AI-generated text is rendered strictly as plain text React string children (no `dangerouslySetInnerHTML`).

---

## 3. API Contracts

### 3.1 Task Breakdown
**`POST /api/ai/breakdown`**
```json
{ "title": "Prepare DSA assignment", "context": { "priority": "high", "dueDate": "2026-08-10" } }
```
**Response (200):** `{ success, message, data: { summary, subtasks[], totalEstimatedMinutes } }`

### 3.2 Time Estimation
**`POST /api/ai/estimate`**
```json
{ "title": "Prepare DSA assignment", "context": { "priority": "high", "dueDate": "2026-08-10" } }
```
**Response (200):**
```json
{
  "success": true,
  "message": "Task time estimated successfully.",
  "data": { "estimatedMinutes": 90, "reason": "The task involves implementation and testing." }
}
```

### 3.3 Smart Schedule Proposal
**`POST /api/ai/schedule`**
```json
{
  "title": "Prepare DSA assignment",
  "estimatedMinutes": 90,
  "context": { "priority": "high", "dueDate": "2026-08-10" },
  "availability": { "date": "2026-08-08", "startTime": "16:00", "endTime": "20:00" }
}
```
**Response (200 — fits):**
```json
{
  "success": true,
  "message": "Schedule proposal generated successfully.",
  "data": {
    "fitsAvailability": true,
    "date": "2026-08-08",
    "blocks": [
      { "startTime": "16:00", "endTime": "16:45", "title": "Prepare DSA assignment", "durationMinutes": 45, "type": "focus" },
      { "startTime": "16:45", "endTime": "16:55", "title": "Short break", "durationMinutes": 10, "type": "break" },
      { "startTime": "16:55", "endTime": "17:40", "title": "Prepare DSA assignment", "durationMinutes": 45, "type": "focus" }
    ],
    "totalFocusMinutes": 90,
    "totalBreakMinutes": 10
  }
}
```
**Response (200 — insufficient availability):**
```json
{ "data": { "fitsAvailability": false, "availableMinutes": 120, "requiredMinutes": 180, "blocks": [] } }
```

---

## 4. Deterministic Scheduling Algorithm
The schedule algorithm uses application logic (no LLM):
1. Parse availability window into start/end minutes from midnight.
2. If `estimatedMinutes > availableMinutes`, return `fitsAvailability: false` immediately.
3. Determine focus chunk size: 45 min default (30 for tasks ≤50m, 35 for ≤75m).
4. Generate non-overlapping focus blocks within bounds.
5. Insert breaks (10 min after ≥45m blocks, 5 min otherwise) between focus blocks — only if they fit.
6. Verify final block does not exceed `endTime`.

---

## 5. Input Validation & Error Safety
- **Title Validation**: Required, trimmed, max 500 characters. `400 Bad Request` on invalid input.
- **Availability Validation**: `date` (YYYY-MM-DD), `startTime` (HH:mm), `endTime` (HH:mm) all required; `startTime < endTime` enforced.
- **Estimation Output Validation**: `estimatedMinutes` must be a positive finite number; normalized to integer. `reason` capped at 200 characters.
- **Provider Error Masking**: `502 Bad Gateway` or `503 Service Unavailable` with user-friendly messages.
- **No Database Schema Mutation**: Phases 5C.1–5C.2 do NOT add `subtasks[]` or schedule records to MongoDB. All results are preview-only.

---

## 6. Future: Multi-Day Scheduling
Phase 5C.2 supports single-day scheduling only. Multi-day scheduling across availability windows belongs to a future phase (5D+). The current system explicitly returns `fitsAvailability: false` when a task exceeds the single availability window, rather than silently truncating or auto-expanding.




