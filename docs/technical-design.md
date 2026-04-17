# GymTrack — Technical Design
## Tech Stack, Architecture & Module Structure

> **Version**: 1.4
> **Date**: 2026-04-18
> **Status**: Approved

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) | SSR/SSG, file-based routing, large ecosystem, excellent Vercel deployment |
| **UI** | Tailwind CSS + custom dark theme | Utility-first CSS; toàn bộ app dùng dark theme cố định (không toggle light/dark). CSS variables định nghĩa trong `globals.css` với palette Catppuccin Mocha-inspired (`--background: 237 25% 14%` tức `#1a1b2e`). Không dùng shadcn component nữa — các trang đã được rewrite với Tailwind thuần |
| **Charts** | Recharts | Native React (no canvas), lightweight, easily customizable for progress/workout charts |
| **Forms** | react-hook-form + Zod | Form state management + validation schema; Zod shared with BE for consistency |
| **State** | Zustand + TanStack React Query | Zustand for client state (auth, active session); React Query for server state + caching + refetch |
| **Backend** | Node.js + Express.js + TypeScript | RESTful API, type-safe, familiar JS stack, easy library integration |
| **Auth** | JWT (access 15min + refresh 7 days) + bcrypt | Stateless, self-implemented for full control; bcrypt for password hashing |
| **Database** | PostgreSQL | Relational, excellent support for analytics queries (progress charts, volume tracking) |
| **ORM** | Prisma | Type-safe queries, auto-generated types from schema, easy migration management |
| **AI** | Groq API + Meta Llama 4 Scout | Analyze workout/nutrition data, personalized advice, context-aware conversations; model `meta-llama/llama-4-scout-17b-16e-instruct`, free tier available |
| **Email** | Gmail SMTP (primary) + Brevo (optional) | Gmail App Password gửi reset password & reminder; Brevo là tuỳ chọn thay thế — nếu `BREVO_API_KEY` được set thì ưu tiên Brevo, nếu không thì dùng Gmail SMTP qua nodemailer |
| **Food API** | Open Food Facts API | Free, open-source nutrition database with 3M+ products |
| **Notifications** | Web Push API + node-cron | Web Push for desktop/Android; node-cron schedules minute-by-minute schedule checks |
| **File Storage** | ImageKit | Upload & optimize progress photos; free tier 20GB bandwidth/month + 3GB storage |
| **Database (local dev)** | Docker + PostgreSQL 16 Alpine | `docker-compose.yml` chạy PostgreSQL tại `localhost:5433`; dữ liệu persist qua volume `postgres_data` |
| **Database (production)** | Neon (serverless PostgreSQL) | Khi deploy lên Render/Vercel thì đổi `DATABASE_URL` sang Neon connection string |
| **Deployment** | Vercel (FE) + Render (BE) | Vercel optimized for Next.js (hobby plan free); Render free tier for Node.js |
| **Monitoring** | Better Stack (could-have) | Track runtime errors FE + BE in production; free tier 100,000 errors/month |

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
│  │ JWT + Gmail   │  │  + Routes   │  │  (Groq API       │  │
│  │ (email service)│  │             │  │  Llama 4 Scout)  │  │
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
┌───────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  ┌──────────┐
│  ImageKit     │  │ Open Food Facts  │  │   Gmail SMTP (nodemailer)│  │  Brevo   │
│ (upload &     │  │ (food search,    │  │   primary email service  │  │ optional │
│  store photos)│  │  nutrition data) │  │   (reset pwd / reminder) │  │ fallback │
└───────────────┘  └──────────────────┘  └──────────────────────────┘  └──────────┘
```

### Request Flows

1. **Standard API call:** FE sends request with `Authorization: Bearer <access_token>` → BE verifies JWT → Controller processes → Prisma queries DB → returns response

2. **Access token expired (15min):** FE automatically calls `POST /api/auth/refresh` with `refresh_token` cookie (httpOnly) → BE validates → returns new `access_token` → FE retries original request

3. **AI request:** FE calls `POST /api/ai/conversations/:id/messages` → BE aggregates context (user's workout history, measurements, nutrition) → calls Groq API (Llama 4 Scout) → returns response to FE

4. **Cron job reminder:** node-cron runs every minute in BE process → queries `scheduled_workouts` due soon → sends Web Push (Android/Desktop) or email via Brevo (iOS fallback)

   > **Recovery on server restart:** On startup, query all `scheduled_workouts` where `scheduled_date = today` AND `scheduled_time <= NOW()` AND `reminder_sent = false` → send immediately (catch up missed reminders). `reminder_sent = true` after successful send → prevents duplicates. Web Push failure → retry once after 30 seconds → if still fails → fallback to Brevo email.

5. **Photo upload:** FE sends file to BE → BE uploads to ImageKit → saves `photo_url` to DB

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
│   ├── database-design.md
│   ├── implementation-workflow.md
│   └── AI_LAYER_ARCHITECTURE.md
├── docker-compose.yml                    # Local dev: PostgreSQL
│
├── frontend/                             # Next.js 15 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/                   # Public routes (no login required)
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   └── google/callback/      # Google OAuth callback handler
│   │   │   ├── (onboarding)/             # Multi-step setup after first registration
│   │   │   │   └── onboarding/
│   │   │   ├── (app)/                    # Protected routes (login required)
│   │   │   │   ├── dashboard/            # Dashboard home
│   │   │   │   ├── schedule/             # Calendar & workout schedule; ScheduledExerciseManager per event
│   │   │   │   ├── workouts/
│   │   │   │   │   ├── page.tsx          # Workout home; "Kế Hoạch Hôm Nay" section + handleStartFromPlan
│   │   │   │   │   ├── session/          # Live session logging; plan reference panel (PlanPanel)
│   │   │   │   │   ├── history/          # Workout history list
│   │   │   │   │   ├── history/[id]/     # Session detail (read-only)
│   │   │   │   │   ├── exercises/        # Exercise library
│   │   │   │   │   └── exercises/[id]/   # Exercise detail + PR history
│   │   │   │   ├── plans/                # Workout plans list
│   │   │   │   │   └── [id]/             # Plan detail / editor
│   │   │   │   ├── progress/             # Progress charts dashboard
│   │   │   │   │   └── measurements/     # Body measurements log
│   │   │   │   ├── nutrition/            # Nutrition dashboard
│   │   │   │   │   ├── log/              # Log a meal
│   │   │   │   │   └── plan/             # Nutrition plan settings
│   │   │   │   ├── ai-coach/             # AI Coach conversations list
│   │   │   │   │   └── [id]/             # AI Coach chat
│   │   │   │   └── settings/             # Profile & Settings — thông tin, thông số cơ thể, cài đặt, đổi mật khẩu
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   └── layout/                   # Sidebar, BottomNav
│   │   ├── hooks/
│   │   │   └── usePageTitle.ts
│   │   ├── lib/
│   │   │   ├── api.ts                    # Axios instance + refresh token interceptor
│   │   │   ├── utils.ts                  # cn(), formatDate()...
│   │   │   ├── constants.ts              # API_URL, muscle groups
│   │   │   ├── queryKeys.ts              # React Query key factory — schedule sub-keys: .list() / .today()
│   │   │   └── i18n/                     # i18n context — locked to Vietnamese (locale cố định 'vi')
│   │   ├── stores/                       # Zustand stores (client state only)
│   │   │   ├── authStore.ts              # User info, isAuthenticated
│   │   │   ├── workoutStore.ts           # Active session state (persisted) — incl. PlannedExercise + scheduledId
│   │   │   ├── nutritionStore.ts         # Daily food log state
│   │   │   └── timerStore.ts             # Rest timer state
│   │   └── middleware.ts                 # Route protection (redirect if not logged in)
│
├── backend/                              # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                    # Zod schema for validating env variables
│   │   │   ├── database.ts               # Prisma client singleton
│   │   │   ├── passport.ts               # Google OAuth strategy (Passport.js)
│   │   │   └── imagekit.ts               # ImageKit SDK config
│   │   ├── routes/                       # Routes contain inline logic (no separate controllers)
│   │   │   ├── auth.ts
│   │   │   ├── workouts.ts
│   │   │   ├── plans.ts
│   │   │   ├── exercises.ts
│   │   │   ├── schedule.ts
│   │   │   ├── progress.ts
│   │   │   ├── nutrition.ts
│   │   │   ├── notifications.ts
│   │   │   └── ai.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts             # Groq API integration (Llama 4 Scout)
│   │   │   ├── auth.service.ts           # Auth business logic
│   │   │   ├── exercises.service.ts      # Exercise CRUD + image upload
│   │   │   ├── workouts.service.ts       # Session + sets + PR tracking
│   │   │   ├── plans.service.ts          # Workout plan CRUD
│   │   │   ├── schedule.service.ts       # Scheduled workout CRUD + ScheduledExercise CRUD + getTodaySchedule
│   │   │   ├── progress.service.ts       # Measurements + charts + records
│   │   │   ├── nutrition.service.ts      # Food log + Open Food Facts proxy
│   │   │   ├── notifications.service.ts  # Web Push API
│   │   │   ├── email.service.ts          # Gmail SMTP / Brevo email
│   │   │   └── imagekit.service.ts       # Photo upload to ImageKit
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # JWT verify + attach user to req
│   │   │   ├── validation.ts             # Zod request body/query validation
│   │   │   └── errorHandler.ts           # Global error handler middleware
│   │   ├── validators/                   # Zod schemas per module
│   │   │   ├── auth.validators.ts
│   │   │   ├── workouts.validators.ts
│   │   │   ├── exercises.validators.ts
│   │   │   ├── plans.validators.ts
│   │   │   ├── schedule.validators.ts
│   │   │   ├── progress.validators.ts
│   │   │   └── nutrition.validators.ts
│   │   ├── utils/
│   │   │   ├── response.ts               # sendSuccess() / sendError() helpers
│   │   │   ├── jwt.ts                    # signToken(), verifyToken()
│   │   │   └── password.ts               # hashPassword(), comparePassword()
│   │   ├── types/
│   │   │   ├── index.ts                  # UserPayload, ApiResponse<T>
│   │   │   └── express.d.ts              # Extend Express Request with req.user
│   │   ├── jobs/
│   │   │   └── reminders.ts              # Workout reminder handler (Web Push + email)
│   │   └── app.ts                        # Express app setup + route mounting
│   ├── prisma/
│   │   ├── schema.prisma                 # 21 models, PostgreSQL (incl. ScheduledExercise)
│   │   ├── seed.ts                       # Seed 100+ exercises into DB
│   │   └── migrations/                   # Prisma migration history
│   └── __tests__/                        # Test directory (in progress)
```

---

---

## UI Design System

| Concern | Decision |
| ------- | -------- |
| **Theme** | Dark-only. `globals.css` định nghĩa CSS variables dạng HSL dưới `:root`, không có `.dark` class. Toàn bộ app render tối mặc định |
| **Base background** | `#1a1b2e` (HSL 237 25% 14%) — warm dark indigo, inspired by Catppuccin Mocha |
| **Card / surface** | `bg-white/4` với `border-white/8` — semi-transparent layers tạo độ sâu |
| **Interactive hover** | `hover:bg-white/6 hover:border-white/12` |
| **Primary color** | Blue-600 (`#2563eb`) — buttons, active states, progress bars |
| **Text hierarchy** | `text-white` (primary) → `text-slate-300` (secondary) → `text-slate-500` (muted) → `text-slate-700` (disabled) |
| **Accent colors** | Emerald (success), Amber (warning/streak), Red (destructive), Violet (plan/schedule panel), per-muscle badge colors |
| **Language** | 100% tiếng Việt — `I18nContext` hardcoded `locale: 'vi'`, `changeLocale` là no-op. Tất cả hardcoded English strings đã được thay bằng tiếng Việt |
| **Typography** | Inter font (Google Fonts subset latin) |
| **Border radius** | `--radius: 0.75rem` → 12px base; cards dùng `rounded-2xl` (16px) |

---

## Schedule ↔ Workout Integration (Sprint 6.5)

Luồng kết nối lịch tập → buổi tập thực tế:

```text
Schedule page                Workout page               Session page
──────────────               ────────────               ────────────
Tạo lịch hôm nay        →   Query /schedule/today  →   PlanPanel hiển thị
Thêm bài tập vào lịch        Section "Kế Hoạch           progress per exercise
(ScheduledExerciseManager)   Hôm Nay" + nút BẮT ĐẦU     Tap row → tự điền form
                             handleStartFromPlan          done/total set counter
                             → startSession({             tick xanh khi đủ sets
                               plannedExercises,
                               scheduledId })
```

**Luồng dữ liệu:**

1. `ScheduledExercise` record tạo qua `POST /schedule/:id/exercises`
2. `GET /schedule/today` trả về lịch ngày hôm nay kèm `scheduled_exercises`
3. `startSession()` (Zustand) lưu `plannedExercises` vào `ActiveSession` (persisted)
4. Session page đọc `activeSession.plannedExercises` để render `PlanPanel`
5. Tap bài tập trong panel → `setSelectedExercise + setWeight + setReps` (pre-fill)
6. Mỗi set log được đếm theo `exerciseId` và so sánh với `plannedExercise.sets`

*Document version: 1.4 — 2026-04-18*
*Status: Approved*
