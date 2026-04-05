# GymTrack — Technical Design
## Tech Stack, Architecture & Module Structure

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) | SSR/SSG, file-based routing, large ecosystem, excellent Vercel deployment |
| **UI** | Tailwind CSS + shadcn/ui | Utility-first CSS; shadcn provides accessible, non-lock-in components out of the box |
| **Charts** | Recharts | Native React (no canvas), lightweight, easily customizable for progress/workout charts |
| **Forms** | react-hook-form + Zod | Form state management + validation schema; Zod shared with BE for consistency |
| **State** | Zustand + TanStack React Query | Zustand for client state (auth, active session); React Query for server state + caching + refetch |
| **Backend** | Node.js + Express.js + TypeScript | RESTful API, type-safe, familiar JS stack, easy library integration |
| **Auth** | JWT (access 15min + refresh 7 days) + bcrypt | Stateless, self-implemented for full control; bcrypt for password hashing |
| **Database** | PostgreSQL | Relational, excellent support for analytics queries (progress charts, volume tracking) |
| **ORM** | Prisma | Type-safe queries, auto-generated types from schema, easy migration management |
| **AI** | Claude API (Anthropic) | Analyze workout/nutrition data, personalized advice, context-aware conversations |
| **Email** | Resend | Send password reset & iOS reminder fallback emails; free tier 3,000 emails/month |
| **Food API** | Open Food Facts API | Free, open-source nutrition database with 3M+ products |
| **Notifications** | Web Push API + node-cron | Web Push for desktop/Android; node-cron schedules minute-by-minute schedule checks |
| **File Storage** | Cloudinary | Upload & optimize progress photos; free tier 25GB storage |
| **Deployment** | Vercel (FE) + Railway (BE + DB) | Vercel optimized for Next.js; Railway managed PostgreSQL + auto-deploy from GitHub |
| **Monitoring** | Sentry (could-have) | Track runtime errors FE + BE in production; free tier 5,000 errors/month |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│   Next.js 15 App (SSR + CSR)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────┐  │
│  │  Pages / │  │  Zustand │  │ React Query  │  │ Forms  │  │
│  │  Layouts │  │  (State) │  │ (API Cache)  │  │RHF+Zod │  │
│  └──────────┘  └──────────┘  └──────────────┘  └────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
                       │ Authorization: Bearer <access_token>
                       │ Cookie: refresh_token (httpOnly)
┌──────────────────────▼──────────────────────────────────────┐
│                BACKEND (Node.js + Express + TS)              │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │   Auth         │  │ Controllers │  │   AI Service     │  │
│  │ JWT + Resend   │  │  + Routes   │  │  (Claude API)    │  │
│  │ (email service)│  │             │  │                  │  │
│  └────────────────┘  └──────┬──────┘  └──────────────────┘  │
│                             │                                │
│  ┌──────────────────────────▼─────────────────────────────┐  │
│  │                    Prisma ORM                          │  │
│  └──────────────────────────┬─────────────────────────────┘  │
│                             │                                │
│  ┌──────────────────────────┐                               │
│  │  node-cron (Cron Jobs)   │ ← runs inside BE process     │
│  │  - Check scheduled_workouts every minute                │
│  │  - Send web push / email reminder                       │
│  └──────────────────────────┘                               │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                    PostgreSQL Database                      │
└────────────────────────────────────────────────────────────┘

Backend calls external services (not the DB):
┌───────────────┐  ┌──────────────────┐  ┌──────────────┐
│  Cloudinary   │  │ Open Food Facts  │  │   Resend     │
│ (upload &     │  │ (food search,    │  │ (email:      │
│  store photos)│  │  nutrition data) │  │  reset/remind│
└───────────────┘  └──────────────────┘  └──────────────┘
```

### Request Flows

1. **Standard API call:** FE sends request with `Authorization: Bearer <access_token>` → BE verifies JWT → Controller processes → Prisma queries DB → returns response

2. **Access token expired (15min):** FE automatically calls `POST /api/auth/refresh` with `refresh_token` cookie (httpOnly) → BE validates → returns new `access_token` → FE retries original request

3. **AI request:** FE calls `POST /api/ai/chat` → BE aggregates context (user's workout history, measurements, nutrition) → calls Claude API → streams response back to FE

4. **Cron job reminder:** node-cron runs every minute in BE process → queries `scheduled_workouts` due soon → sends Web Push (Android/Desktop) or email via Resend (iOS fallback)

   > **Recovery on server restart:** On startup, query all `scheduled_workouts` where `scheduled_date = today` AND `scheduled_time <= NOW()` AND `reminder_sent = false` → send immediately (catch up missed reminders). `reminder_sent = true` after successful send → prevents duplicates. Web Push failure → retry once after 30 seconds → if still fails → fallback to Resend email.

5. **Photo upload:** FE sends file to BE → BE uploads to Cloudinary → saves `photo_url` to DB

6. **Food search:** FE calls BE → BE calls Open Food Facts API → transforms & returns to FE (BE acts as proxy to hide rate limits and cache results)

---

## Module Structure

```
gymtrack/
├── docs/                                 # Project documentation
│   ├── overview.md
│   ├── requirements.md
│   ├── user-specification.md
│   ├── technical-design.md
│   ├── api-endpoints.md
│   ├── database-schema.md
│   └── implementation-workflow.md
├── docker-compose.yml                    # Local dev: PostgreSQL + BE
│
├── frontend/                             # Next.js 15 App
│   ├── public/
│   │   ├── icons/                        # PWA icons
│   │   └── manifest.json                 # Web App Manifest (Web Push)
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                   # Public routes (no login required)
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/      # Enter email for reset link
│   │   │   │   └── onboarding/           # Multi-step setup after registration
│   │   │   ├── (dashboard)/              # Protected routes (login required)
│   │   │   │   ├── page.tsx              # Dashboard home
│   │   │   │   ├── schedule/             # Calendar & workout schedule
│   │   │   │   ├── workout/
│   │   │   │   │   ├── page.tsx          # Workout History (list)
│   │   │   │   │   ├── session/
│   │   │   │   │   │   └── page.tsx      # Live session logging (fullscreen)
│   │   │   │   │   └── [sessionId]/
│   │   │   │   │       └── page.tsx      # Session Detail (read-only)
│   │   │   │   ├── plans/
│   │   │   │   │   ├── page.tsx          # Plans list
│   │   │   │   │   └── [planId]/
│   │   │   │   │       └── page.tsx      # Plan Detail / Editor
│   │   │   │   ├── exercises/
│   │   │   │   │   ├── page.tsx          # Exercise Library
│   │   │   │   │   └── [exerciseId]/
│   │   │   │   │       └── page.tsx      # Exercise Detail
│   │   │   │   ├── progress/             # Progress Dashboard + Body Measurements
│   │   │   │   ├── nutrition/            # Nutrition Dashboard + Food Log
│   │   │   │   ├── ai-coach/             # AI Coach Chat
│   │   │   │   └── profile/              # Profile & Settings
│   │   │   ├── error.tsx                 # Error boundary (500, network error)
│   │   │   ├── not-found.tsx             # 404 page
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── layout/                   # Sidebar, BottomNav, Header
│   │   │   ├── workout/                  # WorkoutCard, SetLogger, RestTimer
│   │   │   ├── nutrition/                # MacroBar, FoodSearch, MealCard
│   │   │   ├── progress/                 # ProgressChart, BodyMetricCard
│   │   │   └── ai/                       # ChatBubble, InsightCard
│   │   ├── hooks/                        # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useRestTimer.ts           # Rest timer logic
│   │   │   └── useActiveSession.ts       # Manage live session
│   │   ├── lib/
│   │   │   ├── api.ts                    # Axios instance + refresh token interceptor
│   │   │   ├── auth.ts                   # Token helpers (get/set/clear)
│   │   │   ├── utils.ts                  # cn(), formatDate(), calcMacro()...
│   │   │   ├── constants.ts              # API_URL, default rest times, muscle groups
│   │   │   └── queryKeys.ts              # React Query key factory
│   │   ├── stores/                       # Zustand stores (client state only)
│   │   │   ├── authStore.ts              # User info, isAuthenticated
│   │   │   ├── workoutStore.ts           # Active session state
│   │   │   ├── nutritionStore.ts         # Daily food log state
│   │   │   └── timerStore.ts             # Rest timer state
│   │   └── types/                        # Shared TypeScript interfaces & types
│
├── backend/                              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                    # Zod schema for validating env variables
│   │   │   └── database.ts               # Prisma client singleton
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── workoutController.ts
│   │   │   ├── planController.ts
│   │   │   ├── exerciseController.ts
│   │   │   ├── progressController.ts
│   │   │   ├── nutritionController.ts
│   │   │   └── aiController.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── workouts.ts
│   │   │   ├── plans.ts
│   │   │   ├── exercises.ts
│   │   │   ├── progress.ts
│   │   │   ├── nutrition.ts
│   │   │   └── ai.ts
│   │   ├── services/
│   │   │   ├── aiService.ts              # Claude API integration
│   │   │   ├── nutritionService.ts       # Open Food Facts proxy + macro calculation
│   │   │   ├── notificationService.ts    # Web Push API
│   │   │   └── emailService.ts           # Resend: reset password, reminders
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # JWT verify + attach user to req
│   │   │   ├── validation.ts             # Zod request body/query validation
│   │   │   └── errorHandler.ts           # Global error handler middleware
│   │   ├── utils/
│   │   │   ├── response.ts               # ApiResponse formatter {success, data, error}
│   │   │   ├── jwt.ts                    # signToken(), verifyToken()
│   │   │   └── password.ts               # hashPassword(), comparePassword()
│   │   ├── types/
│   │   │   ├── index.ts                  # UserPayload, JwtPayload, ApiResponse<T>
│   │   │   └── express.d.ts              # Extend Express Request with req.user
│   │   ├── jobs/
│   │   │   └── reminderJob.ts            # node-cron: check & send workout reminders
│   │   └── app.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                       # Seed 100+ exercises into DB
│   └── __tests__/                        # Test directory
│       ├── auth.test.ts
│       └── workout.test.ts
```

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
