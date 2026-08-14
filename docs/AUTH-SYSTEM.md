# PulseOS — Authentication & User Data Ownership System

## 1. Overview
PulseOS implements JWT-based Email/Password authentication coupled with strict single-tenant multi-user database scoping. Every productivity resource (Todos, Focus Sessions, Analytics, AI proposals, and Socket events) is bound to an authenticated `userId`.

---

## 2. Authentication Architecture

```
[ Frontend Client ] 
    ├── AuthProvider (AuthContext & useAuth hook)
    ├── LocalStorage (`pulse_token`)
    └── Axios Interceptor (Authorization: Bearer <JWT>)
              │
              ▼ REST / Socket.IO Handshake
[ Express Backend ]
    ├── authMiddleware (Verifies JWT & populates req.user.userId)
    ├── auth.service.js (bcryptjs hashing, email normalization, JWT sign)
    └── auth.controller.js (POST /register, POST /login, GET /me)
              │
              ▼ User-Scoped MongoDB Queries
[ MongoDB Database ]
    ├── users collection (name, email, passwordHash, timestamps)
    ├── todos collection (userId, title, completed, dueDate, priority, ...)
    └── focussessions collection (userId, taskId, mode, plannedMinutes, ...)
```

---

## 3. Registration & Login Specifications

### Registration (`POST /api/auth/register`)
- `name`: Required String (max 100 chars).
- `email`: Required String, normalized to lowercase, trimmed, unique index enforced in MongoDB.
- `password`: Required String (min 8 chars). Hashed using `bcryptjs` (salt rounds: 10).
- Response Contract: `{ success: true, message: "Account created successfully.", data: { user: { _id, name, email }, token } }`.

### Login (`POST /api/auth/login`)
- Accepts `email` and `password`.
- Validates credentials using `bcrypt.compare`.
- Generic error message (`Invalid email or password.`) returned on failure to prevent user enumeration attacks.
- `passwordHash` is never exposed in API responses (`select: false` set in schema).

### Session Validation (`GET /api/auth/me`)
- Requires valid `Bearer <JWT>` in `Authorization` header.
- Returns current user profile on app startup.

---

## 4. JWT Token Lifecycle & Security
- Token Payload: `{ userId: user._id }` (No sensitive passwords or PII stored in payload).
- Expiration: Configurable via `JWT_EXPIRES_IN` (Default: `7d`).
- Secret: Configured via backend-only environment variable `JWT_SECRET`. Mandatory on backend startup (server fails immediately if missing). No fallback secrets allowed.
- Socket Expiry: Socket.IO connections read `exp` from JWT on handshake and schedule a clean disconnect timer upon token expiration. When a token expires, the server emits `auth:expired`, triggering frontend session cleanup and immediate socket disconnect.
- Client Storage & Expiry: Token persisted in browser `localStorage` as `pulse_token`. Interceptor automatically attaches token to outgoing Axios requests. An Axios response interceptor traps `401 Unauthorized` responses on authenticated requests, clears `pulse_token`, and dispatches `auth:unauthorized` (guarded by an `isHandling401` lock to prevent duplicate logout cycles across parallel requests). `AuthProvider` listens for `auth:unauthorized`, uses a request counter to prevent race conditions from late async calls, clears user state cleanly, and allows standard `ProtectedRoute` guards to redirect to `/login` without aggressive page reloads.
- Public Route Guard (`PublicOnlyRoute`): Authenticated users navigating to public auth routes (`/login`, `/register`) are immediately redirected to `/app` without rendering page forms or flickering UI elements. During session initialization, a loading spinner is rendered until auth state resolves.

---

## 5. User Data Ownership Rules

1. **Identity Extraction**: `req.user.userId` derived strictly from verified JWT token. `userId` from request body, query params, or URL is ignored.
2. **Todo Scoping**: All Todo CRUD operations query `{ _id: taskId, userId }`. Attempting to access/edit another user's task returns `404 Not Found`.
3. **Focus Session Scoping**: Focus sessions are saved with `userId`. Task binding validates that `taskId` belongs to `req.user.userId`.
4. **Analytics Scoping**: All aggregation pipelines (`$match`) and document counts filter strictly by `userId`. Dashboard metrics never aggregate global or multi-user data.

---

## 6. Future Extension (OAuth)
The architecture supports seamless future OAuth (Google/GitHub) integration by extending `UserModel` with optional `googleId`/`githubId` fields while reusing the core JWT session issuance flow.
