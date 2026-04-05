# GymTrack — Implementation Workflow
## Sprint Plan & Development Guidelines

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## Documentation Status

| Item | Status |
|------|--------|
| Requirements + Specification | ✅ Done |
| Tech Stack | ✅ Done |
| Architecture | ✅ Done |
| Module Structure | ✅ Done |
| Database Schema | ✅ Done |

---

## Sprint Roadmap

### SPRINT 0 — Setup & Foundation

```
⬜ 0.1  Create monorepo gymtrack/, init git, connect to GitHub remote
⬜ 0.2  Setup environment: create .env.example (Claude API key, DB URL, Cloudinary, Resend, Open Food Facts)
⬜ 0.3  Initialize Backend: Node.js + Express + TypeScript + ESLint + Prettier
⬜ 0.4  Initialize Frontend: Next.js 15 + Tailwind + shadcn/ui
⬜ 0.5  Setup local PostgreSQL via Docker (docker-compose.yml)
⬜ 0.6  Initialize Prisma: schema.prisma, run first migration
⬜ 0.7  Seed exercise library (~100 exercises into DB)
```

### SPRINT 1 — Authentication

```
⬜ 1.1  BE: POST /auth/register, POST /auth/login (JWT access + refresh token)
⬜ 1.2  BE: POST /auth/logout, POST /auth/refresh (invalidate refresh token)
⬜ 1.3  BE: POST /auth/forgot-password, POST /auth/reset-password (Resend email)
⬜ 1.4  BE: GET /auth/me, PUT /auth/profile, PUT /auth/settings
⬜ 1.5  BE: Auth middleware (JWT verify + attach req.user)
⬜ 1.6  FE: Layout + Sidebar/Bottom Nav + route protection (redirect if not logged in)
⬜ 1.7  FE: Login screen, Register screen
⬜ 1.8  FE: Forgot Password screen, Onboarding screen (multi-step)
⬜ 1.9  FE: Zustand authStore + axios interceptor for automatic token refresh
```

### SPRINT 2 — Exercise Library & Workout Core

```
⬜ 2.1  BE: GET /exercises (search + filter), GET /exercises/:id
⬜ 2.2  BE: POST /exercises (custom), DELETE /exercises/:id
⬜ 2.3  FE: Exercise Library screen (search, filter by muscle group)
⬜ 2.4  FE: Exercise Detail screen (info + PR history)
⬜ 2.5  BE: POST /workouts/sessions (start), PUT /workouts/sessions/:id (end)
⬜ 2.6  BE: POST /workouts/sessions/:id/sets, DELETE set
⬜ 2.7  BE: GET /workouts/sessions (list), GET /workouts/sessions/:id (detail)
⬜ 2.8  FE: Workout Session screen (live logging + rest timer)
⬜ 2.9  FE: Workout History screen + Session Detail screen
⬜ 2.10 FE: Zustand workoutStore + timerStore
```

### SPRINT 3 — Workout Plans & Schedule

```
⬜ 3.1  BE: CRUD /plans, /plans/:id/activate
⬜ 3.2  BE: CRUD plan days & plan exercises
⬜ 3.3  BE: CRUD /schedule (create, update, delete scheduled workouts)
⬜ 3.4  FE: Workout Plans screen + Plan Detail / Editor
⬜ 3.5  FE: Calendar / Schedule screen
⬜ 3.6  BE: node-cron reminder job (Web Push + Resend email fallback)
```

### SPRINT 4 — Progress Tracking

```
⬜ 4.1  BE: POST/GET /progress/measurements
⬜ 4.2  BE: GET /progress/charts (weight, volume, strength data)
⬜ 4.3  BE: GET /progress/records (Personal Records history)
⬜ 4.4  BE: Auto-update personal_records when logging a new set (is_current_best logic)
⬜ 4.5  FE: Progress Dashboard screen (Recharts: weight, volume, 1RM charts)
⬜ 4.6  FE: Body Measurements screen (log + timeline + Cloudinary photo upload)
```

### SPRINT 5 — Nutrition Module

```
⬜ 5.1  BE: POST/GET/PUT /nutrition/plan
⬜ 5.2  BE: GET /nutrition/foods/search (Open Food Facts proxy + cache), POST custom food
⬜ 5.3  BE: POST/GET/DELETE /nutrition/logs
⬜ 5.4  FE: Nutrition Dashboard screen (daily macro breakdown)
⬜ 5.5  FE: Food Log screen + Food Search bottom sheet
⬜ 5.6  FE: Nutrition Plan screen
⬜ 5.7  FE: Zustand nutritionStore (daily state)
```

### SPRINT 6 — AI Coach

```
⬜ 6.1  BE: aiService.ts — Claude API integration, build context from user data
⬜ 6.2  BE: CRUD /ai/conversations, POST /ai/conversations/:id/messages (stream)
⬜ 6.3  BE: GET /ai/insights (automated weekly/monthly analysis)
⬜ 6.4  FE: AI Coach Chat screen (streaming response, conversation history)
```

### SPRINT 7 — Polish & Deploy

```
⬜ 7.1  Responsive: check all screens at 375px mobile viewport
⬜ 7.2  Error states: network error, 404, session expired, API fallback
⬜ 7.3  Empty states: verify all 22 screens
⬜ 7.4  Write integration tests for key APIs (BE):
        - Auth: register, login, refresh token, forgot/reset password
        - Workout: create session, log set, auto-update personal_records
        - Nutrition: log food, macro calculation
        - AI: mock Claude API response, verify context-building logic
⬜ 7.5  Setup CI/CD: GitHub Actions (lint + test on PR)
⬜ 7.6  Deploy BE to Railway + setup managed PostgreSQL
⬜ 7.7  Deploy FE to Vercel + configure environment variables
⬜ 7.8  Smoke test entire happy path on production
```

---

## Implementation Principles

- **BE before FE** on every feature — have the API ready before building the UI
- **Test APIs with Postman/Thunder Client** before connecting to FE
- **Commit frequently** using convention: `feat:`, `fix:`, `docs:`, `refactor:`
- **Each sprint completed** → demo & review before moving to the next sprint

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
