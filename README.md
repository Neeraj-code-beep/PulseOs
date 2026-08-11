# PulseOS

PulseOS is a modern, full-stack productivity operating system built with Node.js, Express, MongoDB, React, and Socket.IO. It combines task management, Pomodoro focus tracking, real-time productivity synchronization, user-scoped data security, analytical insights, and Google Gemini AI features into a unified workspace.

---

## 📌 Project Overview

PulseOS provides a complete productivity workflow for managing tasks, executing focus sessions, tracking habits and metrics, and generating AI-assisted task schedules.

### Key Capabilities
- **JWT Authentication & Security**: End-to-end user isolation securing all endpoints, database records, and Socket.IO rooms.
- **Task Management**: Full task CRUD supporting priority scoring, estimated duration, due dates, and custom reminder scheduling.
- **Real-Time Synchronized Reminders**: Socket.IO room messaging (`user:<userId>`) combined with background cron scheduling (`node-cron`) and native browser notification integration.
- **Focus Engine**: Dynamic Pomodoro and Custom focus session timer with task binding, persistence (`FocusSession`), and instant metric updates.
- **Productivity Analytics**: Analytics dashboard tracking streak counts, focus time trends (7, 14, 30 days), and planned vs. actual task performance metrics.
- **AI Productivity Suite**: Google Gemini 2.0 (`@google/genai`) integration offering task breakdown, time estimation, smart availability scheduling, and structured daily focus planning.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS (Design Tokens, HSL Color Palette, Modern Typography, Responsive Flex/Grid Layouts, Dark/Light Themes)
- **State & Communication**: Axios, Socket.IO Client, React Router DOM v7, Lucide Icons

### Backend
- **Runtime & Server**: Node.js, Express 5
- **Database & ORM**: MongoDB, Mongoose 9
- **Real-Time Messaging**: Socket.IO 4
- **Task Scheduler**: node-cron 4
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **AI Provider**: Google Gemini SDK (`@google/genai`)

```
PulseOS Architecture Architecture:
Routes -> Controllers -> Services -> Models / Integrations
                             │
                             ├── Socket.IO & Cron Scheduler
                             └── Gemini AI Provider Integration
```

---

## 📂 Repository Structure

```bash
PulseOS/
├── backend/
│   ├── server.js               # Server entry point & socket/scheduler initialization
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── controllers/        # Route handlers (auth, todo, focus, analytics, ai)
│   │   ├── services/           # Core domain & business logic
│   │   ├── models/             # Mongoose schemas (User, Todo, FocusSession)
│   │   ├── middleware/         # Auth verification & error handling
│   │   ├── routes/             # REST route declarations
│   │   ├── sockets/            # Socket.IO connection & user room management
│   │   ├── scheduler/          # Background cron reminder dispatcher
│   │   ├── integrations/ai/    # Gemini 2.0 API provider integration
│   │   └── tests/              # Test suites (auth, ownership, analytics, socket, ai)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # UI components (tasks, focus, analytics, ai, auth, layout)
│   │   ├── context/            # React context providers (AuthContext, SocketContext, ThemeContext)
│   │   ├── pages/              # Application views (Today, Tasks, Focus, Analytics, Login, Register)
│   │   ├── services/           # API HTTP clients & notification utilities
│   │   └── styles/             # CSS design tokens & theme declarations
│   ├── package.json
│   └── vite.config.js
│
├── docs/                       # System specification & architectural documentation
└── README.md
```

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

Configure the following environment variables in `backend/.env`:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Server listening port | `3000` |
| `MONGO_URL` | MongoDB connection URI | `mongodb://localhost:27017/pulseos` |
| `CORS_ORIGIN` | Allowed client origin(s) | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_jwt_secret_key_here` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key (backend-only) | `your_gemini_api_key_here` |
| `AI_MODEL` | Gemini model name | `gemini-2.0-flash` |

*Note: Frontend environment configuration can optionally override the API endpoint via `VITE_API_URL` and `VITE_SOCKET_URL` (defaults to `http://localhost:3000`).*

---

## 🔧 Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

### 1. Clone Repository

```bash
git clone https://github.com/Neeraj-code-beep/PulseOs.git
cd PulseOs
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file based on example template
cp .env.example .env
# Set your MONGO_URL, JWT_SECRET, and GEMINI_API_KEY inside backend/.env

# Start development server
npm run dev
```
*Backend server runs at: `http://localhost:3000`*

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```
*Frontend client runs at: `http://localhost:5173`*

---

## 🌐 REST API Endpoints

All endpoints except `/api/auth/register` and `/api/auth/login` require a valid JWT Bearer token in the `Authorization` header (`Authorization: Bearer <token>`).

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create user account
- `POST /api/auth/login` - Authenticate user & receive JWT
- `GET /api/auth/me` - Fetch authenticated user profile

### Todos (`/api/todos`)
- `GET /api/todos` - Retrieve user's todo list
- `POST /api/todos` - Create a new todo
- `PATCH /api/todos/:id` - Update an existing todo
- `DELETE /api/todos/:id` - Delete a todo

### Focus Sessions (`/api/focus`)
- `POST /api/focus/sessions` - Record completed focus session
- `GET /api/focus/sessions` - Retrieve focus session history
- `GET /api/focus/summary` - Get total focus metrics summary

### Analytics (`/api/analytics`)
- `GET /api/analytics/overview` - Today metrics, streak counts, summary stats
- `GET /api/analytics/focus-trend` - Historical focus trend (7, 14, 30 days)
- `GET /api/analytics/task-performance` - Estimated vs. actual focus time performance

### AI Assistant (`/api/ai`)
- `POST /api/ai/breakdown` - Break down task into structured subtasks
- `POST /api/ai/estimate` - Estimate task completion time
- `POST /api/ai/schedule` - Propose focus schedule blocks within availability
- `POST /api/ai/daily-plan` - Synthesize user data into a daily focus plan

---

## 🧪 Verification & Testing

### Running Backend Unit & Integration Tests

```bash
cd backend
node src/tests/auth.test.js
node src/tests/ownership.test.js
node src/tests/analytics.test.js
node src/tests/socket.test.js
node src/tests/ai.test.js
node src/tests/aiPlan.test.js
```

### Running Frontend Validation

```bash
cd frontend

# Code style & ESLint check
npm run lint

# Production build verification
npm run build
```

---

## ✨ Implemented vs. Future Scope

### Implemented Features
- User registration, login, and JWT session handling
- Task CRUD with priority, due date, duration, and reminders
- Background reminder cron job & Socket.IO real-time client alerts
- Pomodoro timer with task binding & FocusSession history
- Analytics dashboard (streaks, focus trends, task performance)
- Gemini AI task breakdown, time estimation, smart scheduling, and daily planning
- Responsive Warm Editorial design system with dark/light themes

### Future Improvements
- Multi-device push notification service worker (WebPush API)
- Google Calendar / iCal bi-directional synchronization
- Collaborative shared workspace & team task delegation
- Voice input assistant for rapid task creation

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).
