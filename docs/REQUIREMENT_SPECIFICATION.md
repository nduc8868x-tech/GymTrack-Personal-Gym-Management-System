# GymTrack — Personal Gym Management System
## Requirement & Specification Document

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## PHASE 1: REQUIREMENT & SPECIFICATION

### 1.1 Project Overview

**GymTrack** là ứng dụng web cá nhân giúp người dùng tự quản lý và tối ưu hóa quá trình tập gym, bao gồm lên lịch, theo dõi workout, dinh dưỡng, và nhận tư vấn từ AI.

**Problem Statement:**
Người tập gym thường không có công cụ thống nhất để theo dõi workout, dinh dưỡng và tiến độ trong cùng một nơi. Các app hiện tại hoặc quá phức tạp (dành cho gym management) hoặc thiếu tính cá nhân hóa. GymTrack giải quyết bài toán này bằng cách kết hợp workout tracking, nutrition logging và AI coaching trong một ứng dụng đơn giản, tập trung vào người dùng cá nhân.

| Thuộc tính | Giá trị |
|-----------|---------|
| **Platform** | Web App (Production) |
| **Type** | Single-user personal fitness tracker |
| **Tech Stack** | Next.js (FE) + Node.js/Express (BE) + PostgreSQL (DB) |

---

### 1.2 Functional Requirements

> **Priority levels:**
> - `Must-have` — Không có không ship được (MVP core)
> - `Should-have` — Quan trọng nhưng có thể delay sang sprint sau
> - `Could-have` — Nice-to-have, làm nếu còn thời gian

---

#### FR-01: Authentication & User Profile — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể tạo tài khoản, đăng nhập và quản lý hồ sơ cá nhân.

**Features:**
- Đăng ký bằng email/password hoặc OAuth Google
- Đăng nhập, đăng xuất
- Quên mật khẩu / reset qua email
- Thiết lập hồ sơ: tên, tuổi, giới tính, chiều cao, cân nặng hiện tại, mục tiêu

**Acceptance Criteria:**
- ✅ User đăng ký thành công → nhận email xác nhận → có thể đăng nhập
- ✅ Đăng nhập sai password 5 lần → tài khoản bị khóa tạm 15 phút
- ✅ Forgot password → nhận link reset qua email, link hết hạn sau 1 giờ
- ✅ Profile được lưu và hiển thị đúng sau khi cập nhật

---

#### FR-02: Onboarding — `Must-have`
**Actor:** Gym User (mới đăng ký)

**Description:** Sau khi đăng ký lần đầu, user được dẫn qua flow setup để app cá nhân hóa trải nghiệm.

**Features:**
- Nhập thông tin cơ thể: chiều cao, cân nặng hiện tại
- Chọn mục tiêu: tăng cơ / giảm mỡ / tăng sức mạnh / sức khỏe tổng thể
- Chọn số buổi tập/tuần
- AI tự động gợi ý nutrition targets (calo, macro) dựa theo thông tin trên

**Acceptance Criteria:**
- ✅ Onboarding chỉ hiện 1 lần sau lần đăng ký đầu tiên
- ✅ Có thể skip và quay lại setup sau trong Profile & Settings
- ✅ Sau khi hoàn thành → chuyển đến Dashboard với data đã được pre-fill

---

#### FR-03: Workout Schedule (Lịch tập) — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể lên lịch tập và nhận nhắc nhở.

**Features:**
- Tạo lịch tập theo ngày (chọn ngày, giờ, tên buổi)
- Gán plan day vào lịch tập
- Xem lịch dạng Calendar view (tuần/tháng)
- Nhắc nhở buổi tập qua web push notification

**Acceptance Criteria:**
- ✅ Tạo lịch tập cho bất kỳ ngày nào trong tương lai
- ✅ Nếu có workout plan đang active → plan days được gợi ý tự động theo ngày trong tuần
- ✅ Notification gửi đúng giờ đã đặt (±1 phút)
- ✅ Buổi tập đã hoàn thành hiển thị khác với buổi chưa tập (màu/icon khác nhau)
- ✅ Empty state: Nếu chưa có lịch → hiển thị nút "Tạo lịch tập đầu tiên"

---

#### FR-04: Workout Tracking (Log buổi tập) — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể ghi lại chi tiết một buổi tập thực tế.

**Features:**
- Bắt đầu session mới (có hoặc không cần plan)
- Chọn bài tập từ thư viện, nhập số set / rep / kg
- Timer đếm ngược thời gian nghỉ giữa set
- Ghi chú cho từng buổi
- Xem lịch sử toàn bộ buổi tập

**Acceptance Criteria:**
- ✅ Có thể log ≥1 bài tập với ≥1 set trong 1 session
- ✅ Thêm/xóa set trong lúc đang tập
- ✅ Timer hoạt động khi màn hình không active (background)
- ✅ Kết thúc session → data lưu vào Workout History ngay lập tức
- ✅ Nếu weight × reps vượt PR hiện tại → tự động cập nhật Personal Record
- ✅ Empty state: Lịch sử trống → hiển thị "Bắt đầu buổi tập đầu tiên"

---

#### FR-05: Workout Plan (Chương trình tập) — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể tạo và quản lý chương trình tập theo tuần.

**Features:**
- Tạo plan với tên, mô tả, loại split (PPL / Upper-Lower / Full-body / Custom)
- Thêm ngày tập trong tuần, mỗi ngày có danh sách bài tập + target set/rep
- Kích hoạt 1 plan tại một thời điểm
- Sao chép plan để tạo plan mới từ plan cũ

**Acceptance Criteria:**
- ✅ Tạo plan với ít nhất 1 ngày tập và 1 bài tập
- ✅ Chỉ 1 plan được active tại 1 thời điểm; kích hoạt plan mới → plan cũ tự deactivate
- ✅ Xóa plan → xóa soft (không mất lịch sử buổi tập đã log)
- ✅ Empty state: Chưa có plan → hiển thị gợi ý tạo plan đầu tiên

---

#### FR-06: Exercise Library (Thư viện bài tập) — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể tra cứu bài tập và thêm bài tập custom.

**Features:**
- Thư viện 100+ bài tập mặc định (tên, nhóm cơ chính/phụ, mô tả, video)
- Tìm kiếm theo tên, lọc theo nhóm cơ và thiết bị
- Thêm bài tập custom của riêng mình

**Acceptance Criteria:**
- ✅ Tìm kiếm realtime (debounce 300ms), không cần nhấn Enter
- ✅ Bài tập custom hiển thị riêng biệt với thư viện hệ thống
- ✅ Không thể xóa bài tập hệ thống; chỉ xóa được bài tập custom do mình tạo
- ✅ Xóa bài tập custom đang được dùng trong plan/session → không cho xóa, hiện cảnh báo

---

#### FR-07: Progress Tracking (Theo dõi tiến độ) — `Must-have`
**Actor:** Gym User

**Description:** Người dùng có thể theo dõi sự thay đổi cơ thể và sức mạnh theo thời gian.

**Features:**
- Log cân nặng, % body fat, số đo cơ thể (ngực, eo, hông, tay, đùi)
- Upload ảnh progress
- Biểu đồ cân nặng, volume tập, strength progress (1RM estimate)
- Personal Records tự động ghi nhận từ session_sets

**Acceptance Criteria:**
- ✅ Log measurement mỗi ngày, xem lịch sử theo timeline
- ✅ Biểu đồ cân nặng hiển thị từ ngày đăng ký đến hôm nay
- ✅ 1RM estimate tính theo công thức Epley: `weight × (1 + reps/30)`
- ✅ PR mới lập → hiển thị badge "New PR!" trong session đang tập
- ✅ Empty state: Chưa có data → hướng dẫn log measurement đầu tiên

---

#### FR-08: Nutrition Management (Dinh dưỡng) — `Should-have`
**Actor:** Gym User

**Description:** Người dùng có thể theo dõi dinh dưỡng hàng ngày và quản lý kế hoạch ăn.

**Features:**
- Tạo nutrition plan: mục tiêu calo, macro split (P/C/F)
- Log bữa ăn: sáng/trưa/tối/snack, tìm thực phẩm, nhập khẩu phần (gram)
- Database thực phẩm tích hợp Open Food Facts API + thực phẩm custom
- Dashboard daily: calo đã ăn vs mục tiêu, macro breakdown

**Acceptance Criteria:**
- ✅ Tìm thực phẩm realtime từ Open Food Facts API (có fallback nếu API lỗi)
- ✅ Tính toán macro tự động dựa theo quantity_g nhập vào
- ✅ Daily dashboard reset về 0 mỗi ngày mới
- ✅ Có thể xóa food log nhầm trong ngày
- ✅ Empty state: Chưa log bữa nào → hiển thị "Log bữa ăn đầu tiên"

---

#### FR-09: AI Coach — `Should-have`
**Actor:** Gym User

**Description:** Người dùng nhận được phân tích và tư vấn cá nhân hóa từ AI dựa trên dữ liệu thực tế.

**Features:**
- AI phân tích tiến độ tập luyện & dinh dưỡng theo tuần/tháng
- Gợi ý điều chỉnh chương trình tập dựa trên progress
- Tư vấn dinh dưỡng theo mục tiêu
- Chat tự do với AI coach (context-aware về lịch sử user)

**Acceptance Criteria:**
- ✅ AI có thể truy cập workout history, measurements, nutrition logs của user để đưa ra nhận xét cụ thể
- ✅ Phản hồi AI trong vòng 10 giây (hoặc hiện loading indicator)
- ✅ Lịch sử chat được lưu và hiển thị lại khi mở app
- ✅ AI không được bịa số liệu — chỉ tư vấn dựa trên data thực có

---

#### FR-10: Data Export — `Could-have`
**Actor:** Gym User

**Description:** Người dùng có thể xuất toàn bộ dữ liệu cá nhân.

**Features:**
- Export workout history ra CSV/JSON
- Export nutrition logs ra CSV

**Acceptance Criteria:**
- ✅ File export chứa đầy đủ data trong khoảng thời gian user chọn
- ✅ Download hoàn thành trong vòng 30 giây

---

### 1.3 Non-Functional Requirements

| NFR | Tiêu chí đo lường |
|-----|-------------------|
| **Performance** | First Contentful Paint (FCP) < 2s trên kết nối 4G; API response < 500ms (đo bằng Lighthouse & Postman) |
| **Responsive** | Hoạt động đúng từ 375px (iPhone SE) đến 1440px desktop; test trên Chrome/Safari/Firefox |
| **Security** | JWT expiry 7 ngày; rate limit 100 req/phút/IP; input validation toàn bộ bằng Zod; HTTPS bắt buộc trên production |
| **Data Integrity** | Soft delete cho workout plans & exercises; không mất lịch sử khi user xóa plan |
| **Backup** | Database backup tự động hàng ngày do Railway (hoặc platform deploy) quản lý |
| **Availability** | Uptime ≥ 99% (tận dụng SLA của Vercel + Railway free tier) |

---

### 1.4 User Specification

#### Đối tượng duy nhất: Gym User (Cá nhân)

Người dùng tự đăng ký, tự quản lý toàn bộ dữ liệu tập luyện và dinh dưỡng của mình.

**User Persona:**
> **Nam, 24 tuổi**, đi làm văn phòng, tập gym 4 buổi/tuần sau giờ làm. Mục tiêu tăng cơ, giảm mỡ. Thường hay quên lịch tập, không nhớ mình đã tập bao nhiêu kg tuần trước, và không biết mình ăn đủ protein chưa.

**User journey — Happy path:**
```
Đăng ký → Onboarding (thông tin cá nhân + mục tiêu)
→ Tạo Workout Plan → Đặt lịch tập tuần này
→ Nhận notification nhắc nhở → Log buổi tập
→ Xem Progress dashboard → Chat với AI Coach để điều chỉnh
```

**Edge cases cần xử lý:**
- User chưa tạo plan → Dashboard vẫn dùng được, hiển thị empty state có hướng dẫn
- User bỏ tập 2 tuần → Progress chart không bị broken, AI nhận xét dựa trên data thực
- User đang log session mà tắt tab → Khi mở lại, session vẫn còn (hoặc hỏi có muốn tiếp tục không)
- Mạng yếu khi đang tập → Cho phép log offline, sync khi có mạng (could-have)

---

### 1.5 Screen List & Features

| # | Màn hình | Chức năng chính | Priority | Empty State |
|---|----------|-----------------|----------|-------------|
| 1 | **Landing** | Giới thiệu app, CTA đăng ký/đăng nhập | MVP | — |
| 2 | **Login / Register** | Form đăng nhập, đăng ký, OAuth Google | MVP | — |
| 3 | **Forgot Password** | Nhập email nhận link reset | MVP | — |
| 4 | **Onboarding** | Setup profile: thông tin cá nhân, mục tiêu, số buổi/tuần | MVP | — |
| 5 | **Dashboard (Home)** | Tổng quan hôm nay: lịch tập, calo, PR gần nhất, AI tip | MVP | Hướng dẫn tạo plan & lịch tập |
| 6 | **Calendar / Schedule** | Lịch tập dạng tuần/tháng, tạo/xóa buổi tập | MVP | "Chưa có lịch tập — Tạo ngay" |
| 7 | **Workout Session** | Log buổi tập live: chọn bài, nhập set/rep/kg, rest timer | MVP | — |
| 8 | **Workout History** | Danh sách buổi đã tập, xem chi tiết từng buổi | MVP | "Chưa có buổi tập nào — Bắt đầu tập" |
| 9 | **Workout Plans** | Danh sách plans, tạo plan mới, kích hoạt plan | MVP | "Chưa có plan — Tạo chương trình tập" |
| 10 | **Plan Detail / Editor** | Chỉnh sửa plan: thêm ngày, bài tập, target set/rep | MVP | "Chưa có ngày tập — Thêm ngày" |
| 11 | **Exercise Library** | Tìm kiếm bài tập, lọc nhóm cơ, xem hướng dẫn | MVP | Không tìm thấy → "Thêm bài tập custom" |
| 12 | **Exercise Detail** | Chi tiết bài tập + lịch sử sử dụng + PR | MVP | Chưa từng tập → "Chưa có lịch sử" |
| 13 | **Progress Dashboard** | Biểu đồ cân nặng, số đo, volume, strength chart | MVP | "Chưa có data — Log cân nặng đầu tiên" |
| 14 | **Body Measurements** | Log cân nặng, số đo, upload ảnh progress | MVP | Timeline trống → hướng dẫn log |
| 15 | **Nutrition Dashboard** | Daily macro dashboard, calo hôm nay vs mục tiêu | Should | "Chưa log bữa nào hôm nay" |
| 16 | **Food Log** | Log bữa ăn: sáng/trưa/tối/snack, tìm thực phẩm | Should | Bữa trống → "Thêm thực phẩm" |
| 17 | **Nutrition Plan** | Tạo/chỉnh mục tiêu calo & macro theo giai đoạn | Should | "Chưa có nutrition plan — Tạo ngay" |
| 18 | **Food Database** | Tìm kiếm thực phẩm (Open Food Facts + custom) | Should | Không tìm thấy → "Thêm thực phẩm custom" |
| 19 | **AI Coach Chat** | Chat với AI, xem phân tích tuần/tháng, nhận gợi ý | Should | Chào mừng + gợi ý câu hỏi đầu tiên |
| 20 | **Profile & Settings** | Thông tin cá nhân, mục tiêu, đơn vị, notifications | MVP | — |

**Tổng: 20 màn hình** (14 MVP + 6 Should-have)

---

**Navigation Flow:**

```
Landing
  ├── [Đăng nhập] → Login → Dashboard
  ├── [Đăng ký]   → Register → Onboarding → Dashboard
  └── [Quên MK]   → Forgot Password → (email) → Login

Dashboard
  ├── [Hôm nay có lịch] → Workout Session
  ├── [Xem lịch]        → Calendar / Schedule
  ├── [Xem Progress]    → Progress Dashboard
  └── [AI tip]          → AI Coach Chat

Calendar
  ├── [Chọn buổi] → Workout Session (live logging)
  └── [+ Tạo]     → Tạo lịch tập mới (modal/drawer)

Workout Session
  ├── [Thêm bài]  → Exercise Library → chọn → quay lại Session
  └── [Kết thúc] → Workout History (detail buổi vừa tập)

Workout Plans → Plan Detail / Editor
  └── [Thêm bài] → Exercise Library → chọn → quay lại Editor

Progress Dashboard
  └── [+ Log]    → Body Measurements

Nutrition Dashboard
  └── [+ Thêm]  → Food Log → Food Database (nếu tìm thực phẩm)

Sidebar / Bottom Nav: Dashboard | Schedule | Workout | Nutrition | Progress | AI | Profile
```

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
