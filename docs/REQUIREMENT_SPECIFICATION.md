# GymTrack — Personal Gym Management System
## Requirement & Specification Document

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## PHASE 1: REQUIREMENT & SPECIFICATION

### 1.1 Project Overview

**GymTrack** là ứng dụng web cá nhân giúp người dùng tự quản lý và tối ưu hóa quá trình tập gym, bao gồm lên lịch, theo dõi workout, dinh dưỡng, và nhận tư vấn từ AI.

| Thuộc tính | Giá trị |
|-----------|---------|
| **Platform** | Web App (Production) |
| **Type** | Single-user personal fitness tracker |
| **Tech Stack** | Next.js (FE) + Node.js/Express (BE) + PostgreSQL (DB) |

---

### 1.2 Functional Requirements

#### FR-01: Authentication & User Profile — `Must-have (MVP)`
- Đăng ký, đăng nhập (email/password + OAuth Google)
- Thiết lập hồ sơ cá nhân: tuổi, giới tính, chiều cao, cân nặng, mục tiêu tập

#### FR-02: Workout Schedule (Lịch tập) — `Must-have (MVP)`
- Tạo lịch tập theo ngày trong tuần
- Nhắc nhở buổi tập qua notification (web push / email)
- Xem lịch dạng Calendar view (tuần/tháng)

#### FR-03: Workout Tracking (Log buổi tập) — `Must-have (MVP)`
- Log buổi tập thực tế: chọn bài tập, nhập số set/rep/kg
- Timer nghỉ giữa set
- Ghi chú mỗi buổi tập
- Xem lịch sử buổi tập

#### FR-04: Workout Plan (Chương trình tập) — `Must-have (MVP)`
- Tạo chương trình tập theo tuần (A/B split, PPL, full-body...)
- Mỗi ngày trong plan có danh sách bài tập + target set/rep
- Kích hoạt plan để áp dụng vào lịch tập

#### FR-05: Exercise Library (Thư viện bài tập) — `Must-have (MVP)`
- Thư viện 100+ bài tập mặc định (tên, nhóm cơ, hướng dẫn, hình ảnh)
- Tìm kiếm/lọc theo nhóm cơ (chest, back, legs, shoulders, arms, core, cardio)
- Thêm bài tập custom

#### FR-06: Progress Tracking (Theo dõi tiến độ) — `Must-have (MVP)`
- Log cân nặng, số đo cơ thể theo ngày
- Upload ảnh progress
- Biểu đồ: cân nặng theo thời gian, volume tập, strength progress (1RM estimate)
- Personal records (PR) tự động ghi nhận

#### FR-07: Nutrition Management (Dinh dưỡng) — `Should-have`
- Tạo nutrition plan theo mục tiêu (calo mục tiêu, macro split)
- Log bữa ăn: chọn thực phẩm, nhập khẩu phần
- Database thực phẩm (tích hợp Open Food Facts API hoặc custom DB)
- Dashboard daily: calo đã ăn vs mục tiêu, macro breakdown (P/C/F)

#### FR-08: AI Coach — `Should-have`
- AI phân tích tiến độ tập luyện & dinh dưỡng theo tuần/tháng
- Gợi ý điều chỉnh chương trình tập
- Tư vấn dinh dưỡng dựa theo mục tiêu & progress
- Chat với AI coach (context-aware về lịch sử của user)

---

### 1.3 Non-Functional Requirements

| NFR | Mô tả |
|-----|-------|
| **Performance** | Page load < 2s, API response < 500ms |
| **Responsive** | Hoạt động tốt trên mobile browser |
| **Security** | JWT auth, HTTPS, input validation |
| **Data** | User data isolated, backup daily |
| **Accessibility** | WCAG 2.1 AA cơ bản |

---

### 1.4 User Specification

#### Đối tượng duy nhất: Gym User (Cá nhân)

Người dùng tự đăng ký, tự quản lý toàn bộ dữ liệu tập luyện và dinh dưỡng của mình.

**User journey:**
```
Đăng ký → Onboarding (thông tin cá nhân + mục tiêu)
→ Tạo Workout Plan → Đặt lịch tập
→ Log buổi tập → Xem Progress → Nhận AI tư vấn
```

---

### 1.5 Screen List & Features

| # | Màn hình | Chức năng chính | Priority |
|---|----------|-----------------|----------|
| 1 | **Landing / Login** | Đăng nhập, đăng ký, giới thiệu app | MVP |
| 2 | **Onboarding** | Setup profile: thông tin cá nhân, mục tiêu | MVP |
| 3 | **Dashboard (Home)** | Tổng quan hôm nay: lịch tập, calo, PR gần nhất, AI tip | MVP |
| 4 | **Calendar / Schedule** | Lịch tập dạng tuần/tháng, tạo/xóa buổi tập | MVP |
| 5 | **Workout Session** | Log buổi tập live: chọn bài, nhập set/rep/kg, timer | MVP |
| 6 | **Workout History** | Danh sách buổi đã tập, xem chi tiết từng buổi | MVP |
| 7 | **Workout Plans** | Danh sách plans, tạo plan mới, kích hoạt plan | MVP |
| 8 | **Plan Detail / Editor** | Chỉnh sửa plan: ngày, bài tập, target | MVP |
| 9 | **Exercise Library** | Tìm kiếm bài tập, xem hướng dẫn, thêm custom | MVP |
| 10 | **Exercise Detail** | Chi tiết bài tập + lịch sử sử dụng + PR | MVP |
| 11 | **Progress Dashboard** | Biểu đồ cân nặng, số đo, volume, strength chart | MVP |
| 12 | **Body Measurements** | Log cân nặng, số đo, upload ảnh progress | MVP |
| 13 | **Nutrition Dashboard** | Daily macro dashboard, calo hôm nay | Should |
| 14 | **Food Log** | Log bữa ăn: sáng/trưa/tối/snack, tìm thực phẩm | Should |
| 15 | **Nutrition Plan** | Tạo/chỉnh mục tiêu calo & macro theo giai đoạn | Should |
| 16 | **Food Database** | Tìm kiếm thực phẩm, thêm custom food | Should |
| 17 | **AI Coach Chat** | Chat với AI, xem phân tích tuần/tháng, nhận gợi ý | Should |
| 18 | **Profile & Settings** | Thông tin cá nhân, mục tiêu, notification settings | MVP |

**Tổng: 18 màn hình** (13 MVP + 5 Should-have)

---

## PHASE 2: TECHNICAL DESIGN

### 2.1 Tech Stack

| Layer | Technology | Lý do chọn |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) | SSR/SSG, routing tốt, ecosystem lớn |
| **UI** | Tailwind CSS + shadcn/ui | Nhanh, đẹp, accessible |
| **Charts** | Recharts | Nhẹ, dễ tùy chỉnh với React |
| **State** | Zustand + TanStack React Query | State management + server state caching |
| **Backend** | Node.js + Express.js + TypeScript | RESTful API, type-safe |
| **Auth** | JWT + bcrypt | Stateless auth, tự implement |
| **Database** | PostgreSQL | Relational, mạnh cho analytics query |
| **ORM** | Prisma | Type-safe, migration dễ |
| **AI** | Claude API (Anthropic) | Phân tích + tư vấn fitness/nutrition |
| **Food API** | Open Food Facts API | Free nutrition database |
| **Notifications** | Web Push API + node-cron | Nhắc lịch tập |
| **File Storage** | Cloudinary | Upload ảnh progress |
| **Deployment** | Vercel (FE) + Railway (BE) | Dễ deploy, free tier |

---

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│   Next.js App (SSR + CSR)                            │
│   ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│   │  Pages/  │ │  Zustand │ │  React Query      │  │
│   │  Layouts │ │  (State) │ │  (API Cache)      │  │
│   └──────────┘ └──────────┘ └───────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / REST API (JWT)
┌────────────────────▼────────────────────────────────┐
│              BACKEND (Node.js + Express + TS)        │
│  ┌──────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │  Auth    │ │ Controllers │ │  AI Service      │  │
│  │  (JWT)   │ │  + Routes   │ │  (Claude API)    │  │
│  └──────────┘ └──────┬──────┘ └──────────────────┘  │
│                      │                               │
│  ┌───────────────────▼────────────────────────────┐  │
│  │              Prisma ORM                        │  │
│  └───────────────────┬────────────────────────────┘  │
└─────────────────────-│──────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────┐
│               PostgreSQL Database                   │
└─────────────────────────────────────────────────────┘
          │                          │
┌─────────▼──────┐        ┌──────────▼──────┐
│  Cloudinary    │        │  Open Food Facts │
│  (Images)      │        │  API (Nutrition) │
└────────────────┘        └─────────────────┘
```

**Request flow:**
1. FE gọi BE qua REST API, đính kèm JWT token
2. BE verify token → Controller xử lý → Prisma query DB
3. AI requests: BE gọi Claude API kèm context user, trả kết quả về FE
4. Cron job (node-cron) check lịch → gửi web push notification

---

### 2.3 Module Structure

```
gymtrack/
├── docs/                            # Tài liệu dự án
│   └── REQUIREMENT_SPECIFICATION.md
│
├── frontend/                        # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # Public routes
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── onboarding/
│   │   │   ├── (dashboard)/         # Protected routes
│   │   │   │   ├── page.tsx         # Dashboard home
│   │   │   │   ├── schedule/
│   │   │   │   ├── workout/
│   │   │   │   ├── plans/
│   │   │   │   ├── exercises/
│   │   │   │   ├── progress/
│   │   │   │   ├── nutrition/
│   │   │   │   ├── ai-coach/
│   │   │   │   └── profile/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── workout/             # WorkoutCard, SetLogger, RestTimer
│   │   │   ├── nutrition/           # MacroBar, FoodSearch, MealCard
│   │   │   ├── progress/            # ProgressChart, BodyMetricCard
│   │   │   └── ai/                  # ChatBubble, InsightCard
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance + API calls
│   │   │   ├── auth.ts              # Auth helpers, token management
│   │   │   └── utils.ts
│   │   ├── stores/                  # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── workoutStore.ts
│   │   └── types/                   # Shared TypeScript types
│
├── backend/                         # Node.js + Express + TypeScript
│   ├── src/
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
│   │   │   ├── aiService.ts         # Claude API integration
│   │   │   ├── nutritionService.ts  # Open Food Facts + macro calc
│   │   │   └── notificationService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verify
│   │   │   └── validation.ts        # Zod schemas
│   │   ├── jobs/
│   │   │   └── reminderJob.ts       # Cron: workout reminders
│   │   └── app.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts                  # Seed exercise library
```

---

### 2.4 REST API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Lấy profile |
| PUT | `/api/auth/profile` | Cập nhật profile |
| GET | `/api/exercises` | Danh sách bài tập (+ filter) |
| POST | `/api/exercises` | Tạo bài tập custom |
| GET | `/api/plans` | Danh sách workout plans |
| POST | `/api/plans` | Tạo plan mới |
| PUT | `/api/plans/:id` | Cập nhật plan |
| POST | `/api/plans/:id/activate` | Kích hoạt plan |
| GET | `/api/workouts/sessions` | Lịch sử buổi tập |
| POST | `/api/workouts/sessions` | Bắt đầu buổi tập |
| PUT | `/api/workouts/sessions/:id` | Kết thúc / cập nhật buổi |
| POST | `/api/workouts/sessions/:id/sets` | Log 1 set |
| GET | `/api/schedule` | Lịch tập theo date range |
| POST | `/api/schedule` | Tạo lịch tập |
| GET | `/api/progress/measurements` | Lịch sử số đo |
| POST | `/api/progress/measurements` | Log số đo mới |
| GET | `/api/progress/charts` | Data cho biểu đồ |
| GET | `/api/nutrition/logs` | Food log theo ngày |
| POST | `/api/nutrition/logs` | Log bữa ăn |
| GET | `/api/nutrition/foods/search` | Tìm thực phẩm |
| GET | `/api/nutrition/plan` | Nutrition plan hiện tại |
| POST | `/api/ai/chat` | Gửi message đến AI coach |
| GET | `/api/ai/insights` | AI phân tích tuần/tháng |

---

### 2.5 Database Schema

```
Table: users
  id              UUID PK
  email           VARCHAR UNIQUE NOT NULL
  password_hash   VARCHAR
  name            VARCHAR NOT NULL
  avatar_url      VARCHAR
  gender          ENUM('male','female','other')
  birthdate       DATE
  height_cm       FLOAT
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP

Table: user_goals
  id              UUID PK
  user_id         UUID FK -> users (CASCADE DELETE)
  goal_type       ENUM('muscle_gain','fat_loss','strength','general_health')
  target_weight   FLOAT
  target_date     DATE
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Table: user_settings
  id                    UUID PK
  user_id               UUID FK -> users UNIQUE
  weight_unit           ENUM('kg','lbs') DEFAULT 'kg'
  notifications_enabled BOOLEAN DEFAULT true
  timezone              VARCHAR DEFAULT 'Asia/Ho_Chi_Minh'
  updated_at            TIMESTAMP

Table: exercises
  id              UUID PK
  name            VARCHAR NOT NULL
  primary_muscle  ENUM('chest','back','legs','shoulders','arms','core','cardio','full_body')
  equipment       ENUM('barbell','dumbbell','machine','cable','bodyweight','other')
  description     TEXT
  video_url       VARCHAR
  is_custom       BOOLEAN DEFAULT false
  created_by      UUID FK -> users (null = system library)
  created_at      TIMESTAMP
  deleted_at      TIMESTAMP  -- soft delete

Table: exercise_muscles  -- junction: 1 exercise, nhiều nhóm cơ
  exercise_id     UUID FK -> exercises
  muscle_group    ENUM('chest','back','legs','shoulders','arms','core')
  is_primary      BOOLEAN  -- true = cơ chính, false = cơ phụ
  PRIMARY KEY (exercise_id, muscle_group)

Table: workout_plans
  id              UUID PK
  user_id         UUID FK -> users
  name            VARCHAR NOT NULL
  description     TEXT
  split_type      ENUM('full_body','upper_lower','ppl','custom')
  duration_weeks  INT
  is_active       BOOLEAN DEFAULT false
  created_at      TIMESTAMP
  updated_at      TIMESTAMP
  deleted_at      TIMESTAMP  -- soft delete

Table: plan_days
  id              UUID PK
  plan_id         UUID FK -> workout_plans (CASCADE DELETE)
  day_of_week     INT  -- 0=Sunday ... 6=Saturday
  name            VARCHAR  -- e.g. "Push Day"
  order_index     INT

Table: plan_exercises
  id              UUID PK
  plan_day_id     UUID FK -> plan_days (CASCADE DELETE)
  exercise_id     UUID FK -> exercises
  sets            INT
  reps_min        INT
  reps_max        INT
  rest_seconds    INT DEFAULT 90
  order_index     INT
  notes           TEXT

Table: scheduled_workouts
  id              UUID PK
  user_id         UUID FK -> users
  plan_day_id     UUID FK -> plan_days (nullable)
  name            VARCHAR
  scheduled_date  DATE NOT NULL
  scheduled_time  TIME
  is_completed    BOOLEAN DEFAULT false
  reminder_sent   BOOLEAN DEFAULT false
  created_at      TIMESTAMP

Table: workout_sessions
  id              UUID PK
  user_id         UUID FK -> users
  scheduled_id    UUID FK -> scheduled_workouts (nullable)
  plan_day_id     UUID FK -> plan_days (nullable)
  name            VARCHAR
  started_at      TIMESTAMP NOT NULL
  ended_at        TIMESTAMP
  notes           TEXT
  created_at      TIMESTAMP

Table: session_sets
  id                  UUID PK
  session_id          UUID FK -> workout_sessions (CASCADE DELETE)
  exercise_id         UUID FK -> exercises
  set_number          INT NOT NULL
  reps                INT
  weight_kg           FLOAT
  duration_seconds    INT  -- cho cardio/plank
  is_personal_record  BOOLEAN DEFAULT false
  created_at          TIMESTAMP

Table: personal_records
  id              UUID PK
  user_id         UUID FK -> users
  exercise_id     UUID FK -> exercises
  weight_kg       FLOAT
  reps            INT
  one_rm_estimate FLOAT  -- Epley formula: weight * (1 + reps/30)
  achieved_at     DATE NOT NULL
  session_id      UUID FK -> workout_sessions
  UNIQUE (user_id, exercise_id)  -- chỉ giữ PR cao nhất

Table: body_measurements
  id              UUID PK
  user_id         UUID FK -> users
  measured_at     DATE NOT NULL
  weight_kg       FLOAT
  body_fat_pct    FLOAT
  chest_cm        FLOAT
  waist_cm        FLOAT
  hips_cm         FLOAT
  left_arm_cm     FLOAT
  right_arm_cm    FLOAT
  left_thigh_cm   FLOAT
  right_thigh_cm  FLOAT
  photo_url       VARCHAR
  notes           TEXT
  created_at      TIMESTAMP

Table: nutrition_plans
  id              UUID PK
  user_id         UUID FK -> users
  name            VARCHAR
  daily_calories  INT
  protein_g       INT
  carbs_g         INT
  fat_g           INT
  is_active       BOOLEAN DEFAULT false
  start_date      DATE
  end_date        DATE
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Table: foods
  id                  UUID PK
  name                VARCHAR NOT NULL
  brand               VARCHAR
  calories_per100g    FLOAT NOT NULL
  protein_per100g     FLOAT
  carbs_per100g       FLOAT
  fat_per100g         FLOAT
  fiber_per100g       FLOAT
  serving_size_g      FLOAT  -- default serving size
  serving_unit        VARCHAR  -- e.g. "quả", "muỗng canh"
  open_food_facts_id  VARCHAR  -- external ID
  is_custom           BOOLEAN DEFAULT false
  created_by          UUID FK -> users (null = global DB)
  created_at          TIMESTAMP

Table: food_logs
  id              UUID PK
  user_id         UUID FK -> users
  food_id         UUID FK -> foods
  logged_at       DATE NOT NULL
  meal_type       ENUM('breakfast','lunch','dinner','snack')
  quantity_g      FLOAT NOT NULL
  created_at      TIMESTAMP

Table: ai_conversations
  id              UUID PK
  user_id         UUID FK -> users
  context_type    ENUM('general','workout_analysis','nutrition_advice','progress_review')
  title           VARCHAR
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Table: ai_messages
  id                  UUID PK
  conversation_id     UUID FK -> ai_conversations (CASCADE DELETE)
  role                ENUM('user','assistant')
  content             TEXT NOT NULL
  created_at          TIMESTAMP
```

---

## PHASE 3: IMPLEMENTATION WORKFLOW

```
✅ Requirement + Specification
✅ Tech Stack
✅ Architecture
✅ Module Structure
✅ Database Schema

⬜ Step 1:  Project boilerplate (Next.js + Node.js setup)
⬜ Step 2:  Backend — Auth APIs (register, login, profile)
⬜ Step 3:  Frontend — Auth screens + Layout + Routing
⬜ Step 4:  Seed exercise library data (~100 bài)
⬜ Step 5:  Backend — Workout Sessions APIs
⬜ Step 6:  Frontend — Workout Session screen (core feature)
⬜ Step 7:  Backend — Workout Plans APIs
⬜ Step 8:  Frontend — Plans & Schedule screens
⬜ Step 9:  Progress Tracking (measurements + charts)
⬜ Step 10: Nutrition Module
⬜ Step 11: AI Coach integration (Claude API)
⬜ Step 12: Polish — Notifications, PWA, responsive
```

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
