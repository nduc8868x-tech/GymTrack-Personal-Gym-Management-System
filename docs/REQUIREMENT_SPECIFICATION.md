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
| **Responsive** | Hoạt động đúng từ 375px (iPhone SE) đến 1440px desktop; test trên Chrome 100+, Safari 15+, Firefox 100+ |
| **Security** | Password tối thiểu 8 ký tự, bắt buộc có chữ + số; JWT access token expiry 15 phút, refresh token 7 ngày (silent refresh); rate limit 100 req/phút/IP; input validation toàn bộ bằng Zod; HTTPS bắt buộc trên production; CORS chỉ cho phép domain FE |
| **Data Integrity** | Soft delete cho workout plans & exercises; không mất lịch sử khi user xóa plan |
| **Backup** | Database backup tự động hàng ngày do Railway (hoặc platform deploy) quản lý |
| **Availability** | Uptime ≥ 99% (tận dụng SLA của Vercel + Railway free tier) |
| **Browser Support** | Web Push Notification **không hỗ trợ trên iOS Safari < 16.4** — fallback: gửi reminder qua email thay thế |
| **API Fallback** | Open Food Facts API down → hiện thông báo, cho phép nhập thủ công; Claude API timeout (>15s) → hiện thông báo lỗi, không crash app |

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

| Tình huống | Xử lý |
|------------|-------|
| Chưa tạo plan | Dashboard vẫn dùng được, hiển thị empty state có hướng dẫn |
| Bỏ tập 2 tuần | Progress chart không broken, AI nhận xét dựa trên data thực tế có |
| Tắt tab giữa chừng khi đang log session | Khi mở lại hỏi "Bạn có muốn tiếp tục buổi tập chưa hoàn thành không?" |
| Mạng yếu khi đang tập | Hiện thông báo mất kết nối, data đã nhập giữ nguyên; retry tự động khi có mạng |
| Claude API timeout | Hiện "AI Coach tạm thời không khả dụng, thử lại sau" — không crash app |
| Open Food Facts API down | Hiện thông báo, cho phép nhập thông tin dinh dưỡng thủ công |
| Upload ảnh progress thất bại | Hiện toast error, ảnh không bị mất — user có thể thử lại |
| JWT hết hạn (15 phút) | Silent refresh bằng refresh token; nếu refresh token cũng hết → redirect về Login |
| Dùng iOS Safari < 16.4 | Web Push không hoạt động → gửi reminder qua email thay thế, hiện banner thông báo |

---

### 1.5 Screen List & Features

| # | Màn hình | Loại | Chức năng chính | Priority | Empty State |
|---|----------|------|-----------------|----------|-------------|
| 1 | **Landing** | Screen | Giới thiệu app, CTA đăng ký/đăng nhập | MVP | — |
| 2 | **Login** | Screen | Form đăng nhập, OAuth Google | MVP | — |
| 3 | **Register** | Screen | Form đăng ký tài khoản, OAuth Google | MVP | — |
| 4 | **Forgot Password** | Screen | Nhập email nhận link reset | MVP | — |
| 5 | **Onboarding** | Screen (multi-step) | Setup profile: thông tin cá nhân, mục tiêu, số buổi/tuần | MVP | — |
| 6 | **Dashboard (Home)** | Screen | Tổng quan hôm nay: lịch tập, calo, PR gần nhất, AI tip | MVP | Hướng dẫn tạo plan & lịch tập |
| 7 | **Calendar / Schedule** | Screen | Lịch tập dạng tuần/tháng, tạo/xóa buổi tập | MVP | "Chưa có lịch tập — Tạo ngay" |
| 8 | **Workout Session** | Screen (fullscreen) | Log buổi tập live: chọn bài, nhập set/rep/kg, rest timer | MVP | — |
| 9 | **Workout History** | Screen | Danh sách buổi đã tập | MVP | "Chưa có buổi tập nào — Bắt đầu tập" |
| 10 | **Workout Session Detail** | Screen | Chi tiết 1 buổi tập đã log (readonly) | MVP | — |
| 11 | **Workout Plans** | Screen | Danh sách plans, kích hoạt plan | MVP | "Chưa có plan — Tạo chương trình tập" |
| 12 | **Plan Detail / Editor** | Screen | Chỉnh sửa plan: thêm ngày, bài tập, target set/rep | MVP | "Chưa có ngày tập — Thêm ngày" |
| 13 | **Exercise Library** | Screen | Tìm kiếm bài tập, lọc nhóm cơ, xem hướng dẫn | MVP | Không tìm thấy → "Thêm bài tập custom" |
| 14 | **Exercise Detail** | Screen | Chi tiết bài tập + lịch sử sử dụng + PR | MVP | Chưa từng tập → "Chưa có lịch sử" |
| 15 | **Progress Dashboard** | Screen | Biểu đồ cân nặng, số đo, volume, strength chart | MVP | "Chưa có data — Log cân nặng đầu tiên" |
| 16 | **Body Measurements** | Screen | Log cân nặng, số đo, upload ảnh progress | MVP | Timeline trống → hướng dẫn log |
| 17 | **Nutrition Dashboard** | Screen | Daily macro dashboard, calo hôm nay vs mục tiêu | Should | "Chưa log bữa nào hôm nay" |
| 18 | **Food Log** | Screen | Log bữa ăn: sáng/trưa/tối/snack | Should | Bữa trống → "Thêm thực phẩm" |
| 19 | **Food Search** | Bottom Sheet | Tìm thực phẩm (Open Food Facts + custom) — mở từ Food Log | Should | Không tìm thấy → "Thêm thực phẩm custom" |
| 20 | **Nutrition Plan** | Screen | Tạo/chỉnh mục tiêu calo & macro theo giai đoạn | Should | "Chưa có nutrition plan — Tạo ngay" |
| 21 | **AI Coach Chat** | Screen | Chat với AI, xem phân tích tuần/tháng, nhận gợi ý | Should | Chào mừng + gợi ý câu hỏi đầu tiên |
| 22 | **Profile & Settings** | Screen | Thông tin cá nhân, mục tiêu, đơn vị (kg/lbs), notifications | MVP | — |
| — | **Error / Offline** | Screen | Mất mạng, 404, session expired → redirect về Login | MVP | — |

**Tổng: 22 màn hình + 1 Bottom Sheet + 1 Error Screen** (15 MVP + 7 Should-have)

---

**Navigation Layout:**
- **Desktop (≥768px):** Sidebar cố định bên trái, 5 items chính
- **Mobile (<768px):** Bottom Navigation Bar, tối đa 5 items
```
Bottom Nav (Mobile):  Dashboard | Schedule | + (Workout) | Nutrition | Progress
Sidebar (Desktop):    Dashboard | Schedule | Workout | Nutrition | Progress | AI Coach | Profile
```
> AI Coach & Profile trên mobile truy cập qua menu icon hoặc Profile avatar.

---

**Navigation Flow:**

```
AUTH FLOW
─────────
Landing
  ├── [Đăng nhập]  → Login → Dashboard
  ├── [Đăng ký]    → Register → Onboarding (multi-step) → Dashboard
  └── [Quên MK]    → Forgot Password → (check email) → Login
JWT hết hạn (không refresh được) → bất kỳ màn hình nào → Login

DASHBOARD
─────────
Dashboard
  ├── [Card lịch hôm nay]  → Workout Session (live)
  ├── [Xem lịch]           → Calendar / Schedule
  ├── [Card Progress]      → Progress Dashboard
  ├── [AI tip / Coach]     → AI Coach Chat
  └── [Avatar]             → Profile & Settings

WORKOUT FLOW
────────────
Calendar / Schedule
  ├── [Chọn buổi đã lên lịch]  → Workout Session (live)
  └── [+ Tạo lịch]             → Modal: chọn ngày, giờ, plan day → lưu

Workout Session (live)
  ├── [+ Thêm bài tập]  → Exercise Library → [Chọn] → quay lại Session
  ├── [Tap bài tập]     → expand set logger (inline, không thoát màn hình)
  └── [Hoàn thành]      → Workout Session Detail (summary buổi vừa tập)

Workout History
  └── [Tap buổi tập]   → Workout Session Detail (readonly)

Workout Plans
  ├── [Tap plan]       → Plan Detail / Editor
  └── [+ Tạo plan]     → Plan Detail / Editor (mode: create)

Plan Detail / Editor
  └── [+ Thêm bài tập] → Exercise Library → [Chọn] → quay lại Editor

Exercise Library
  └── [Tap bài tập]   → Exercise Detail

Exercise Detail
  └── [Dùng trong plan] → Plan Detail / Editor

PROGRESS FLOW
─────────────
Progress Dashboard
  ├── [+ Log cân nặng / số đo]  → Body Measurements
  └── [Tap chart]               → Body Measurements (xem timeline)

NUTRITION FLOW
──────────────
Nutrition Dashboard
  ├── [+ Thêm bữa ăn]       → Food Log
  └── [Xem / sửa mục tiêu]  → Nutrition Plan

Food Log
  └── [Tìm thực phẩm]       → Food Search (Bottom Sheet)
        └── [Chọn thực phẩm] → quay lại Food Log (auto-fill)

AI COACH
────────
AI Coach Chat
  ├── [+ Cuộc trò chuyện mới]  → tạo conversation mới (inline)
  └── [Tap conversation cũ]    → xem lại lịch sử chat

PROFILE
───────
Profile & Settings
  ├── [Sửa thông tin]     → inline edit hoặc modal
  ├── [Đổi mật khẩu]     → modal
  ├── [Notifications]     → toggle inline
  └── [Đăng xuất]        → Landing
```

---

## PHASE 2: TECHNICAL DESIGN

### 2.1 Tech Stack

| Layer | Technology | Lý do chọn |
|-------|-----------|-----------|
| **Frontend** | Next.js 15 (App Router) | SSR/SSG, file-based routing, ecosystem lớn, deploy tốt trên Vercel |
| **UI** | Tailwind CSS + shadcn/ui | Utility-first CSS, shadcn cung cấp accessible components sẵn, không lock-in |
| **Charts** | Recharts | Native React (không dùng canvas), nhẹ, dễ tùy chỉnh, phù hợp progress/workout charts |
| **Forms** | react-hook-form + Zod | Quản lý form state + validation schema; Zod dùng chung với BE để đảm bảo nhất quán |
| **State** | Zustand + TanStack React Query | Zustand cho client state (auth, active session); React Query cho server state + caching + refetch |
| **Backend** | Node.js + Express.js + TypeScript | RESTful API, type-safe, quen thuộc với JS stack, dễ tích hợp thư viện |
| **Auth** | JWT (access 15p + refresh 7 ngày) + bcrypt | Stateless, tự implement để kiểm soát hoàn toàn; bcrypt hash password |
| **Database** | PostgreSQL | Relational, hỗ trợ tốt analytics query (progress charts, volume tracking) |
| **ORM** | Prisma | Type-safe queries, auto-generate types từ schema, migration dễ quản lý |
| **AI** | Claude API (Anthropic) | Phân tích workout/nutrition data, tư vấn cá nhân hóa, context-aware conversation |
| **Email** | Resend | Gửi email reset password & reminder fallback cho iOS; free tier 3,000 email/tháng |
| **Food API** | Open Food Facts API | Free, open-source nutrition database với 3M+ sản phẩm |
| **Notifications** | Web Push API + node-cron | Web Push cho desktop/Android; node-cron schedule check lịch hàng phút |
| **File Storage** | Cloudinary | Upload & optimize ảnh progress; free tier 25GB storage |
| **Deployment** | Vercel (FE) + Railway (BE + DB) | Vercel tối ưu cho Next.js; Railway managed PostgreSQL + auto-deploy từ GitHub |
| **Monitoring** | Sentry (could-have) | Track runtime errors FE + BE trên production; free tier 5,000 errors/tháng |

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
