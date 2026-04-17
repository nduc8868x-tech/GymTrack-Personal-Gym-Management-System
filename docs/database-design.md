# GymTrack — Database Design

> **Version**: 2.0  
> **Date**: 2026-04-11  
> **Provider**: SQLite (dev) → PostgreSQL (prod)  
> **Total tables**: 22

---

## ERD Tổng quan

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTH & IDENTITY                                                │
│  user_accounts ──1:1── user_profiles                           │
│  user_accounts ──1:1── user_settings                           │
│  user_accounts ──1:N── user_goals                              │
│  user_accounts ──1:N── refresh_tokens                          │
│  user_accounts ──1:N── push_subscriptions                      │
├─────────────────────────────────────────────────────────────────┤
│  EXERCISE LIBRARY                                               │
│  exercises ──1:N── exercise_muscles                            │
│  exercises ──1:N── plan_exercises                              │
│  exercises ──1:N── session_sets                                │
│  exercises ──1:N── personal_records                            │
├─────────────────────────────────────────────────────────────────┤
│  WORKOUT PLANS                                                  │
│  workout_plans ──1:N── plan_days ──1:N── plan_exercises        │
├─────────────────────────────────────────────────────────────────┤
│  SCHEDULE & SESSIONS                                            │
│  scheduled_workouts ──1:N── workout_sessions                   │
│  workout_sessions ──1:N── session_sets                         │
│  workout_sessions ──1:N── personal_records                     │
├─────────────────────────────────────────────────────────────────┤
│  PROGRESS                                                       │
│  body_measurements (standalone, FK → user_accounts)            │
│  personal_records (FK → exercises, sessions, user_accounts)    │
├─────────────────────────────────────────────────────────────────┤
│  NUTRITION                                                      │
│  foods ──1:1── food_nutrients                                  │
│  foods ──1:N── food_logs                                       │
│  nutrition_plans (standalone, FK → user_accounts)              │
├─────────────────────────────────────────────────────────────────┤
│  AI COACH                                                       │
│  ai_conversations ──1:N── ai_messages                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Nhóm 1: Auth & Identity

### 1. `user_accounts`
> Thông tin xác thực tài khoản — **KHÔNG** chứa thông tin cá nhân

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `email` | TEXT | NO | — | Email đăng nhập, unique |
| `password_hash` | TEXT | YES | NULL | Bcrypt hash, NULL nếu dùng OAuth |
| `provider` | TEXT (enum) | NO | `local` | `local` \| `google` |
| `google_id` | TEXT | YES | NULL | Google OAuth ID, unique |
| `is_verified` | BOOLEAN | NO | `false` | Email đã xác thực chưa |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `email` (unique), `google_id` (unique)  
**Relations**: → `user_profiles`, `user_settings`, `user_goals`, `refresh_tokens`, `push_subscriptions`, `exercises`, `workout_plans`, `scheduled_workouts`, `workout_sessions`, `personal_records`, `body_measurements`, `nutrition_plans`, `foods`, `food_logs`, `ai_conversations`

---

### 2. `user_profiles`
> Thông tin cá nhân & thể chất — **tách biệt** hoàn toàn với auth

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `user_id` | TEXT (UUID) | NO | — | PK + FK → user_accounts.id |
| `name` | TEXT | NO | — | Tên hiển thị |
| `avatar_url` | TEXT | YES | NULL | URL ảnh đại diện |
| `gender` | TEXT (enum) | YES | NULL | `male` \| `female` \| `other` |
| `birthdate` | DATETIME | YES | NULL | Ngày sinh |
| `height_cm` | REAL | YES | NULL | Chiều cao (cm) |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: user_id → `user_accounts.id` (CASCADE DELETE)

---

### 3. `user_settings`
> Preferences hiển thị & thông báo của người dùng

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id, unique |
| `weight_unit` | TEXT (enum) | NO | `kg` | `kg` \| `lbs` |
| `notifications_enabled` | BOOLEAN | NO | `true` | Bật/tắt thông báo |
| `timezone` | TEXT | NO | `Asia/Ho_Chi_Minh` | Múi giờ người dùng |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: user_id → `user_accounts.id` (CASCADE DELETE)

---

### 4. `user_goals`
> Mục tiêu tập luyện (có thể có nhiều, chỉ 1 active)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `goal_type` | TEXT (enum) | NO | — | `muscle_gain` \| `fat_loss` \| `strength` \| `general_health` |
| `target_weight` | REAL | YES | NULL | Cân nặng mục tiêu (kg) |
| `target_date` | DATETIME | YES | NULL | Ngày đạt mục tiêu |
| `is_active` | BOOLEAN | NO | `true` | Mục tiêu đang active |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: user_id → `user_accounts.id` (CASCADE DELETE)

---

### 5. `refresh_tokens`
> JWT Refresh tokens — mỗi thiết bị/session có 1 token riêng

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `token_hash` | TEXT | NO | — | SHA-256 hash của raw token |
| `expires_at` | DATETIME | NO | — | Thời điểm hết hạn (7 ngày) |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |

**Relations**: user_id → `user_accounts.id` (CASCADE DELETE)

---

### 6. `push_subscriptions`
> Web Push subscription của từng thiết bị trình duyệt

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `endpoint` | TEXT | NO | — | URL endpoint của push service |
| `p256dh` | TEXT | NO | — | Public key mã hoá payload |
| `auth` | TEXT | NO | — | Auth secret |
| `user_agent` | TEXT | YES | NULL | Browser/device label |
| `created_at` | DATETIME | NO | now() | Thời gian đăng ký |

**Indexes**: `(user_id, endpoint)` unique  
**Relations**: user_id → `user_accounts.id` (CASCADE DELETE)

---

## Nhóm 2: Exercise Library

### 7. `exercises`
> Thư viện bài tập — gồm bài tập hệ thống và bài tập tùy chỉnh

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `name` | TEXT | NO | — | Tên bài tập |
| `primary_muscle` | TEXT (enum) | NO | — | Cơ chính: `chest` \| `back` \| `legs` \| `shoulders` \| `arms` \| `core` \| `cardio` \| `full_body` |
| `equipment` | TEXT (enum) | NO | — | Thiết bị: `barbell` \| `dumbbell` \| `machine` \| `cable` \| `bodyweight` \| `other` |
| `description` | TEXT | YES | NULL | Mô tả kỹ thuật thực hiện |
| `video_url` | TEXT | YES | NULL | URL video hướng dẫn |
| `is_custom` | BOOLEAN | NO | `false` | true = do user tạo |
| `created_by` | TEXT (UUID) | YES | NULL | FK → user_accounts.id (NULL nếu hệ thống) |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `deleted_at` | DATETIME | YES | NULL | Soft delete timestamp |

**Relations**: `created_by` → `user_accounts.id`

---

### 8. `exercise_muscles`
> Mapping bài tập với các nhóm cơ (cơ chính + cơ phụ)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `exercise_id` | TEXT (UUID) | NO | — | PK + FK → exercises.id |
| `muscle_group` | TEXT (enum) | NO | — | Nhóm cơ (xem MuscleGroup enum) |
| `is_primary` | BOOLEAN | NO | — | true = cơ chính, false = cơ phụ |

**PK**: `(exercise_id, muscle_group)`  
**Relations**: exercise_id → `exercises.id` (CASCADE DELETE)

---

## Nhóm 3: Workout Plans

### 9. `workout_plans`
> Kế hoạch tập luyện theo tuần của người dùng

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `name` | TEXT | NO | — | Tên kế hoạch |
| `description` | TEXT | YES | NULL | Mô tả kế hoạch |
| `split_type` | TEXT (enum) | NO | — | `full_body` \| `upper_lower` \| `ppl` \| `custom` |
| `duration_weeks` | INTEGER | YES | NULL | Số tuần kế hoạch |
| `is_active` | BOOLEAN | NO | `false` | Đang được áp dụng không |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |
| `deleted_at` | DATETIME | YES | NULL | Soft delete timestamp |

**Relations**: user_id → `user_accounts.id`

---

### 10. `plan_days`
> Ngày tập trong kế hoạch (ví dụ: Thứ 2 - Push Day)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `plan_id` | TEXT (UUID) | NO | — | FK → workout_plans.id |
| `day_of_week` | INTEGER | NO | — | 0 (CN) đến 6 (T7) |
| `name` | TEXT | YES | NULL | Tên buổi (Push Day, Leg Day...) |
| `order_index` | INTEGER | YES | NULL | Thứ tự hiển thị |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `(plan_id, day_of_week, name)` unique  
**Relations**: plan_id → `workout_plans.id` (CASCADE DELETE)

---

### 11. `plan_exercises`
> Bài tập trong một ngày của kế hoạch (sets, reps, rest)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `plan_day_id` | TEXT (UUID) | NO | — | FK → plan_days.id |
| `exercise_id` | TEXT (UUID) | NO | — | FK → exercises.id |
| `sets` | INTEGER | YES | NULL | Số set |
| `reps_min` | INTEGER | YES | NULL | Số rep tối thiểu |
| `reps_max` | INTEGER | YES | NULL | Số rep tối đa |
| `rest_seconds` | INTEGER | NO | `90` | Thời gian nghỉ (giây) |
| `order_index` | INTEGER | YES | NULL | Thứ tự trong buổi |
| `notes` | TEXT | YES | NULL | Ghi chú kỹ thuật |

**Relations**: plan_day_id → `plan_days.id` (CASCADE DELETE), exercise_id → `exercises.id`

---

## Nhóm 4: Schedule & Sessions

### 12. `scheduled_workouts`
> Buổi tập đã lên lịch (lịch tập tương lai)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `plan_id` | TEXT (UUID) | YES | NULL | FK → workout_plans.id |
| `plan_day_id` | TEXT (UUID) | YES | NULL | FK → plan_days.id |
| `name` | TEXT | YES | NULL | Tên buổi tập |
| `scheduled_date` | DATETIME | NO | — | Ngày tập (date only) |
| `scheduled_time` | DATETIME | YES | NULL | Giờ tập (time only) |
| `is_completed` | BOOLEAN | NO | `false` | Đã hoàn thành chưa |
| `reminder_sent` | BOOLEAN | NO | `false` | Đã gửi nhắc nhở chưa |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `scheduled_date`  
**Relations**: user_id → `user_accounts.id`, plan_id → `workout_plans.id`, plan_day_id → `plan_days.id`

---

### 13. `workout_sessions`
> Buổi tập thực tế đã thực hiện (kết quả ghi nhận)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `scheduled_id` | TEXT (UUID) | YES | NULL | FK → scheduled_workouts.id (nếu tập theo lịch) |
| `plan_id` | TEXT (UUID) | YES | NULL | FK → workout_plans.id |
| `plan_day_id` | TEXT (UUID) | YES | NULL | FK → plan_days.id |
| `name` | TEXT | YES | NULL | Tên buổi tập |
| `started_at` | DATETIME | NO | — | Thời điểm bắt đầu |
| `ended_at` | DATETIME | YES | NULL | Thời điểm kết thúc (NULL nếu chưa xong) |
| `notes` | TEXT | YES | NULL | Ghi chú sau buổi tập |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `user_id`  
**Relations**: user_id → `user_accounts.id`, scheduled_id → `scheduled_workouts.id`, plan_id → `workout_plans.id`, plan_day_id → `plan_days.id`

---

### 14. `session_sets`
> Từng set đã thực hiện trong một buổi tập

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `session_id` | TEXT (UUID) | NO | — | FK → workout_sessions.id |
| `exercise_id` | TEXT (UUID) | NO | — | FK → exercises.id |
| `set_number` | INTEGER | NO | — | Số thứ tự set (1, 2, 3...) |
| `reps` | INTEGER | YES | NULL | Số reps thực hiện |
| `weight_kg` | REAL | YES | NULL | Tạ (kg) |
| `duration_seconds` | INTEGER | YES | NULL | Thời gian (cho cardio/plank) |
| `is_personal_record` | BOOLEAN | NO | `false` | Set này có phải PR không |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `session_id`  
**Relations**: session_id → `workout_sessions.id` (CASCADE DELETE), exercise_id → `exercises.id`

---

## Nhóm 5: Progress

### 15. `personal_records`
> Kỷ lục cá nhân của người dùng cho từng bài tập

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `exercise_id` | TEXT (UUID) | NO | — | FK → exercises.id |
| `session_id` | TEXT (UUID) | YES | NULL | FK → workout_sessions.id |
| `weight_kg` | REAL | YES | NULL | Tạ đã lift (kg) |
| `reps` | INTEGER | YES | NULL | Số reps |
| `one_rm_estimate` | REAL | YES | NULL | Ước tính 1RM (Epley formula) |
| `is_current_best` | BOOLEAN | NO | `false` | Có phải PR hiện tại không |
| `achieved_at` | DATETIME | NO | — | Ngày đạt được |

**Indexes**: `(user_id, exercise_id)`  
**Relations**: user_id → `user_accounts.id`, exercise_id → `exercises.id`, session_id → `workout_sessions.id`

---

### 16. `body_measurements`
> Lịch sử số đo cơ thể theo thời gian

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `measured_at` | DATETIME | NO | — | Ngày đo |
| `weight_kg` | REAL | YES | NULL | Cân nặng (kg) |
| `body_fat_pct` | REAL | YES | NULL | % mỡ cơ thể |
| `chest_cm` | REAL | YES | NULL | Vòng ngực (cm) |
| `waist_cm` | REAL | YES | NULL | Vòng eo (cm) |
| `hips_cm` | REAL | YES | NULL | Vòng mông (cm) |
| `left_arm_cm` | REAL | YES | NULL | Bắp tay trái (cm) |
| `right_arm_cm` | REAL | YES | NULL | Bắp tay phải (cm) |
| `left_thigh_cm` | REAL | YES | NULL | Đùi trái (cm) |
| `right_thigh_cm` | REAL | YES | NULL | Đùi phải (cm) |
| `photo_url` | TEXT | YES | NULL | URL ảnh progress |
| `notes` | TEXT | YES | NULL | Ghi chú |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `(user_id, measured_at)`  
**Relations**: user_id → `user_accounts.id`

---

## Nhóm 6: Nutrition

### 17. `nutrition_plans`
> Kế hoạch dinh dưỡng — mục tiêu macro hàng ngày

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `name` | TEXT | YES | NULL | Tên kế hoạch |
| `daily_calories` | INTEGER | YES | NULL | Tổng calo mục tiêu/ngày |
| `protein_g` | INTEGER | YES | NULL | Protein mục tiêu (g/ngày) |
| `carbs_g` | INTEGER | YES | NULL | Carbs mục tiêu (g/ngày) |
| `fat_g` | INTEGER | YES | NULL | Fat mục tiêu (g/ngày) |
| `is_active` | BOOLEAN | NO | `false` | Đang được áp dụng không |
| `start_date` | DATETIME | YES | NULL | Ngày bắt đầu |
| `end_date` | DATETIME | YES | NULL | Ngày kết thúc |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: user_id → `user_accounts.id`

---

### 18. `foods`
> Thực phẩm — thông tin nhận dạng & nguồn gốc (**KHÔNG** chứa dinh dưỡng)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `name` | TEXT | NO | — | Tên thực phẩm |
| `brand` | TEXT | YES | NULL | Thương hiệu |
| `serving_size_g` | REAL | YES | NULL | Khẩu phần chuẩn (g) |
| `serving_unit` | TEXT | YES | NULL | Đơn vị khẩu phần (cốc, muỗng...) |
| `open_food_facts_id` | TEXT | YES | NULL | ID từ Open Food Facts database |
| `is_custom` | BOOLEAN | NO | `false` | true = do user tạo |
| `created_by` | TEXT (UUID) | YES | NULL | FK → user_accounts.id |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |

**Relations**: created_by → `user_accounts.id`

---

### 19. `food_nutrients`
> Giá trị dinh dưỡng của thực phẩm per 100g (**tách biệt** với foods)

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `food_id` | TEXT (UUID) | NO | — | PK + FK → foods.id |
| `calories_per100g` | REAL | NO | — | Calo trên 100g |
| `protein_per100g` | REAL | NO | `0` | Protein (g) trên 100g |
| `carbs_per100g` | REAL | NO | `0` | Carbohydrate (g) trên 100g |
| `fat_per100g` | REAL | NO | `0` | Chất béo (g) trên 100g |
| `fiber_per100g` | REAL | NO | `0` | Chất xơ (g) trên 100g |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: food_id → `foods.id` (CASCADE DELETE)

---

### 20. `food_logs`
> Nhật ký ăn uống hàng ngày của người dùng

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `food_id` | TEXT (UUID) | NO | — | FK → foods.id |
| `logged_at` | DATETIME | NO | — | Ngày ăn |
| `meal_type` | TEXT (enum) | NO | — | `breakfast` \| `lunch` \| `dinner` \| `snack` |
| `quantity_g` | REAL | NO | — | Lượng ăn (g) |
| `created_at` | DATETIME | NO | now() | Thời gian ghi nhận |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Indexes**: `(user_id, logged_at)`  
**Relations**: user_id → `user_accounts.id`, food_id → `foods.id`

---

## Nhóm 7: AI Coach

### 21. `ai_conversations`
> Cuộc hội thoại với AI Coach

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `user_id` | TEXT (UUID) | NO | — | FK → user_accounts.id |
| `context_type` | TEXT (enum) | NO | `general` | `general` \| `workout_analysis` \| `nutrition_advice` \| `progress_review` |
| `context_ref_id` | TEXT (UUID) | YES | NULL | ID tham chiếu (session/plan) |
| `context_snapshot` | TEXT | YES | NULL | Snapshot dữ liệu user lúc tạo conversation (JSON string) |
| `title` | TEXT | YES | NULL | Tiêu đề cuộc hội thoại |
| `created_at` | DATETIME | NO | now() | Thời gian tạo |
| `updated_at` | DATETIME | YES | — | Tự cập nhật khi sửa |

**Relations**: user_id → `user_accounts.id`

---

### 22. `ai_messages`
> Tin nhắn trong cuộc hội thoại AI

| Column | Type | Nullable | Default | Mô tả |
|--------|------|----------|---------|-------|
| `id` | TEXT (UUID) | NO | uuid() | Primary key |
| `conversation_id` | TEXT (UUID) | NO | — | FK → ai_conversations.id |
| `role` | TEXT (enum) | NO | — | `user` \| `assistant` |
| `content` | TEXT | NO | — | Nội dung tin nhắn |
| `created_at` | DATETIME | NO | now() | Thời gian gửi |

**Relations**: conversation_id → `ai_conversations.id` (CASCADE DELETE)

---

## Enums

| Enum | Values |
|------|--------|
| `Provider` | `local`, `google` |
| `Gender` | `male`, `female`, `other` |
| `GoalType` | `muscle_gain`, `fat_loss`, `strength`, `general_health` |
| `WeightUnit` | `kg`, `lbs` |
| `MuscleGroup` | `chest`, `back`, `legs`, `shoulders`, `arms`, `core`, `cardio`, `full_body` |
| `Equipment` | `barbell`, `dumbbell`, `machine`, `cable`, `bodyweight`, `other` |
| `SplitType` | `full_body`, `upper_lower`, `ppl`, `custom` |
| `MealType` | `breakfast`, `lunch`, `dinner`, `snack` |
| `AiContextType` | `general`, `workout_analysis`, `nutrition_advice`, `progress_review` |
| `AiRole` | `user`, `assistant` |

---

## Nguyên tắc thiết kế

| Nguyên tắc | Áp dụng |
|---|---|
| **Single Responsibility** | Mỗi bảng chỉ chứa một loại dữ liệu thuần nhất |
| **Auth vs Profile tách biệt** | `user_accounts` = auth only, `user_profiles` = personal info |
| **Identity vs Nutrition tách biệt** | `foods` = meta/nguồn gốc, `food_nutrients` = dinh dưỡng |
| **Soft delete** | `exercises`, `workout_plans` dùng `deleted_at` thay vì xóa cứng |
| **Cascade delete** | Dữ liệu phụ thuộc tự xóa khi user/parent bị xóa |
| **UUID** | Tất cả PK dùng UUID để dễ scale & bảo mật |
| **Timestamps** | Mọi bảng có `created_at`, bảng có edit có `updated_at` |

---

*Document version: 2.0 — 2026-04-11*
