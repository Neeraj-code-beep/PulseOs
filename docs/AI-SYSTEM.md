# PulseOS — AI Task Breakdown & Planning System Architecture

## Overview
Phase 5C.1 introduces the **AI Productivity Layer** to PulseOS. Unlike generic chatbots, the AI system operates directly within the student's task planning workflow as a productivity engine (**PLAN → FOCUS → IMPROVE**).

The initial feature is **AI Task Breakdown**: breaking complex study goals into 2–5 concrete work blocks with realistic time estimates.

---

## 1. Provider Abstraction Architecture

```
[ Frontend: TaskEditor.jsx ]
         │
         ▼
[ TaskBreakdownPanel.jsx ]
         │
         ▼
[ aiApi.jsx (POST /api/ai/breakdown) ]
         │
         ▼
[ AiRoutes.js ]
         │
         ▼
[ ai.controller.js ]
         │
         ▼
[ ai.service.js ] (Validation, Prompt Engineering, JSON Schema Parsing)
         │
         ▼
[ ai.provider.js ] (Google Gemini @google/genai SDK Integration)
         │
         ▼
[ Google Gemini LLM (gemini-2.0-flash) ]
```

---

## 2. Security & Environment Rules
- **Backend-Only Keys**: `GEMINI_API_KEY` (or `AI_API_KEY`) is stored exclusively in `backend/.env`.
- **No Secret Exposure**: Neither the frontend nor error payloads ever receive the API key or raw stack traces.
- **Untrusted Output Protection**: AI-generated text is rendered strictly as plain text React string children (no `dangerouslySetInnerHTML`).

---

## 3. API Contract

### Request
`POST /api/ai/breakdown`
```json
{
  "title": "Prepare DSA assignment",
  "context": {
    "subject": "Data Structures",
    "priority": "high",
    "dueDate": "2026-08-10",
    "estimatedMinutes": 60
  }
}
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "Task breakdown generated successfully.",
  "data": {
    "summary": "Break the assignment into research, implementation, and review.",
    "subtasks": [
      {
        "title": "Review assignment requirements",
        "estimatedMinutes": 15
      },
      {
        "title": "Implement core solutions",
        "estimatedMinutes": 50
      },
      {
        "title": "Test and review solutions",
        "estimatedMinutes": 25
      }
    ],
    "totalEstimatedMinutes": 90
  }
}
```

---

## 4. Input Validation & Error Safety
- **Title Validation**: Required, trimmed, max 500 characters. `400 Bad Request` returned on missing/invalid input.
- **Provider Error Masking**: `502 Bad Gateway` or `503 Service Unavailable` returned with user-friendly messages (`"AI planning is temporarily unavailable."`).
- **No Database Schema Mutation**: Phase 5C.1 does NOT add `subtasks[]` to MongoDB. "Apply breakdown" updates `estimatedMinutes` on the task form.
