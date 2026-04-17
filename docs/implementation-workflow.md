# GymTrack — Implementation Workflow
## Sprint Plan & Development Guidelines

> **Version**: 1.5
> **Date**: 2026-04-18
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
✅ 0.1  Create monorepo gymtrack/, init git, connect to GitHub remote
✅ 0.2  Setup environment: create .env.example (Groq API key, DB URL, ImageKit, Brevo/Gmail,
        Google OAuth client ID/secret, VAPID keys for Web Push)
✅ 0.3  Initialize Backend: Node.js + Express + TypeScript + ESLint + Prettier
✅ 0.4  Initialize Frontend: Next.js 15 + Tailwind CSS
✅ 0.5  Setup local PostgreSQL via Docker (docker-compose.yml) — port 5433
✅ 0.6  Initialize Prisma: schema.prisma, run migrations (Docker PostgreSQL local)
✅ 0.7  Seed exercise library (~100 exercises into DB)
✅ 0.8  Setup ImageKit SDK config (account, API keys, URL endpoint)
```

### SPRINT 1 — Authentication

```
✅ 1.1  BE: POST /auth/register, POST /auth/login (JWT access + refresh token)
✅ 1.2  BE: POST /auth/logout, POST /auth/refresh (invalidate refresh token)
✅ 1.3  BE: POST /auth/forgot-password, POST /auth/reset-password (Gmail SMTP / Brevo email)
✅ 1.4  BE: GET /auth/me, PUT /auth/profile, PUT /auth/settings, POST /auth/onboarding
✅ 1.5  BE: GET /auth/google + GET /auth/google/callback (Passport.js google-oauth20 strategy)
✅ 1.6  BE: Auth middleware (JWT verify + attach req.user)
✅ 1.7  FE: Layout + Sidebar/Bottom Nav + route protection (redirect if not logged in)
✅ 1.8  FE: Login screen, Register screen
✅ 1.9  FE: Forgot Password screen, Reset Password screen, Onboarding screen (multi-step)
✅ 1.10 FE: Zustand authStore + axios interceptor for automatic token refresh
```

### SPRINT 2 — Exercise Library & Workout Core

```
✅ 2.1  BE: GET /exercises (search + filter), GET /exercises/:id
✅ 2.2  BE: POST /exercises (custom), DELETE /exercises/:id
✅ 2.3  BE: POST/DELETE /exercises/:id/image (ImageKit upload)
✅ 2.4  FE: Exercise Library screen (search, filter by muscle group)
✅ 2.5  FE: Exercise Detail screen (info + PR history)
✅ 2.6  BE: POST /workouts/sessions (start), PUT /workouts/sessions/:id (end)
✅ 2.7  BE: POST /workouts/sessions/:id/sets, PUT set, DELETE set
✅ 2.8  BE: GET /workouts/sessions (list), GET /workouts/sessions/:id (detail)
✅ 2.9  FE: Workout Session screen (live logging + rest timer)
✅ 2.10 FE: Workout History screen + Session Detail screen
✅ 2.11 FE: Zustand workoutStore + timerStore
✅ 2.12 BE: Auto-update personal_records when logging a new set (is_current_best logic)
```

### SPRINT 3 — Workout Plans & Schedule

```
✅ 3.1  BE: CRUD /plans, /plans/:id/activate, /plans/:id/duplicate
✅ 3.2  BE: CRUD plan days & plan exercises
✅ 3.3  BE: CRUD /schedule (create, update, delete scheduled workouts)
✅ 3.4  FE: Workout Plans screen + Plan Detail / Editor
✅ 3.5  FE: Calendar / Schedule screen
✅ 3.6  BE: POST /notifications/subscribe + DELETE — store push_subscriptions
✅ 3.7  BE: Workout reminder job (Web Push + Gmail/Brevo email fallback)
        ⚠️  Architecture note: Render free tier spins down after 15min inactivity → node-cron inside
        the main BE process will NOT fire during sleep. Use a separate Render Cron Job service
        (always-on, free) that calls an internal endpoint `POST /internal/reminders/check` on schedule.
```

### SPRINT 4 — Progress Tracking

```
✅ 4.1  BE: POST/GET /progress/measurements
✅ 4.2  BE: GET /progress/charts (weight, volume, strength data)
✅ 4.3  BE: GET /progress/records (Personal Records history)
✅ 4.4  BE: GET /progress/imagekit-auth (ImageKit auth signature)
✅ 4.5  FE: Progress Dashboard screen (weight, volume, 1RM charts)
✅ 4.6  FE: Body Measurements screen (log + timeline + ImageKit photo upload)
```

### SPRINT 5 — Nutrition Module

```
✅ 5.1  BE: POST/GET/PUT /nutrition/plan
✅ 5.2  BE: GET /nutrition/foods/search (Open Food Facts proxy + cache), POST custom food
✅ 5.3  BE: POST/GET/DELETE /nutrition/logs
✅ 5.4  FE: Nutrition Dashboard screen (daily macro breakdown)
✅ 5.5  FE: Food Log screen + Food Search
✅ 5.6  FE: Nutrition Plan screen
✅ 5.7  FE: Zustand nutritionStore (daily state)
```

### SPRINT 6 — AI Coach

```
✅ 6.1  BE: aiService.ts — Groq API integration (meta-llama/llama-4-scout-17b-16e-instruct), build context from user data
✅ 6.2  BE: CRUD /ai/conversations, POST /ai/conversations/:id/messages
✅ 6.3  BE: GET /ai/insights (automated weekly/monthly analysis)
✅ 6.4  FE: AI Coach Chat screen (conversation history)
✅ 6.5  BE: Groq API timeout handling (20s) + fallback error response
⬜ 6.6  FE: Streaming partial chunks, loading indicator
```

### SPRINT 6.5 — Schedule ↔ Workout Integration

```
✅ 6.5.1  DB: model ScheduledExercise — per-user, per-day exercise entries (sets/reps/weight)
✅ 6.5.2  BE: validators + service CRUD cho ScheduledExercise
✅ 6.5.3  BE: GET /schedule/today + POST/PUT/DELETE /schedule/:id/exercises
✅ 6.5.4  FE: queryKeys.schedule refactor thành object có sub-keys (list, today)
✅ 6.5.5  FE: Zustand workoutStore mở rộng — PlannedExercise + scheduledId trong ActiveSession
✅ 6.5.6  FE: Schedule page — ScheduledExerciseManager (thêm/sửa/xóa bài tập trong lịch)
✅ 6.5.7  FE: Workout page — weekly 7-day strip + dynamic selected-day plan section + handleStartFromPlan
           - 7-day horizontal scroll strip (T2→CN), mỗi card: tên ngày, số ngày, tên workout, số bài
           - Border state: blue = đang chọn, emerald = đã xong, violet = có kế hoạch, mặc định = nghỉ
           - Chấm xanh trên card hôm nay; click card → selectedDateStr → cập nhật section bên dưới
           - Label dynamic: "KẾ HOẠCH HÔM NAY" / "KẾ HOẠCH THỨ X" tùy ngày chọn
           - Thay query /schedule/today bằng /schedule?from=weekFrom&to=weekTo (cover cả tuần)
✅ 6.5.8  FE: Session page — panel kế hoạch tham chiếu (tap bài → tự điền form, progress tracker)
```

### SPRINT 7 — UI Polish & Deploy

```
✅ 7.1  Dark theme color palette — thay thế #0d0d14 (quá tối) bằng palette dịu hơn:
        background #1a1b2e, card #1e1f35, auth outer #111223
✅ 7.2  Toàn bộ UI chuyển sang tiếng Việt — xóa tất cả hardcoded English strings trên mọi trang
        (workouts, session, nutrition, ai-coach, dashboard, progress, schedule, auth layout)
✅ 7.3  Exercise Library page — rewrite UI: dark theme cards, muscle badge màu per-group,
        filter chips active state theo màu nhóm cơ, form thêm bài tập với label tiếng Việt
✅ 7.4  Nutrition Log page — dịch macro labels (Carbs → Tinh bột, Fat → Chất béo),
        custom food form labels tiếng Việt
✅ 7.5  Profile & Settings page (app)/settings/page.tsx — 5 sections:
        - Thông tin cá nhân (name, gender, birthdate, height — PUT /auth/profile)
        - Thông số cơ thể (current weight từ GET /progress/measurements?limit=1, target weight + goal
          từ user_goals, progress bar, link → trang Tiến trình)
        - Cài đặt (weight unit, notifications toggle — PUT /auth/settings)
        - Đổi mật khẩu (POST /auth/forgot-password → gửi link reset qua email)
        - Tài khoản (logout button)
✅ 7.6  Onboarding fix — Step 2 thêm field "Cân nặng hiện tại":
        - BE: onboardingSchema thêm current_weight, completeOnboarding tạo BodyMeasurement record
        - FE: onboarding/page.tsx dark-theme rewrite, current_weight field + diff hint
          ("Mục tiêu giảm/tăng X kg")
✅ 7.7  Schedule page — GỢI Ý card link đổi từ /workouts → /ai-coach
✅ 7.8  Workout page — xóa card "Buổi Tập Mới" (session name input + BẮT ĐẦU TẬP button)
✅ 7.9  Workout page — quick links (Lịch Sử Tập, Thư Viện Bài Tập, Chuỗi Tuần) đổi từ
        vertical stack → horizontal 3-column grid (sm:grid-cols-3); Chuỗi Tuần compact
        (streak số ngày hiển thị inline, progress bar màu amber)
⬜ 7.10 Responsive: kiểm tra tất cả màn hình tại 375px mobile viewport
⬜ 7.11 Error states: network error, 404, session expired, API fallback
⬜ 7.12 Empty states: kiểm tra tất cả màn hình
⬜ 7.13 Write integration tests for key APIs (BE):
        - Auth: register, login, refresh token, forgot/reset password
        - Workout: create session, log set, auto-update personal_records
        - Nutrition: log food, macro calculation
        - AI: mock Groq API response, verify context-building logic
⬜ 7.14 Setup CI/CD: GitHub Actions (lint + test on PR)
⬜ 7.15 Deploy BE to Render + đổi DATABASE_URL sang Neon (production) trong environment variables
⬜ 7.16 Deploy FE to Vercel + configure environment variables
⬜ 7.17 Smoke test entire happy path on production
```

---

## Implementation Principles

- **BE before FE** on every feature — have the API ready before building the UI
- **Test APIs with Postman/Thunder Client** before connecting to FE
- **Commit frequently** using convention: `feat:`, `fix:`, `docs:`, `refactor:`
- **Each sprint completed** → demo & review before moving to the next sprint

---

*Document version: 1.5 — 2026-04-18*
*Status: Approved*
