# GymTrack — REST API Endpoints

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## Standard Response Format (all endpoints)

```json
// Success — single object
{ "success": true, "data": { ... } }

// Success — list with pagination
{ "success": true, "data": [...], "meta": { "total": 100, "limit": 20, "offset": 0 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

**Error codes:** `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

---

## AUTH

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| POST | `/api/auth/register` | — | Register a new account (email/password) |
| POST | `/api/auth/login` | — | Login, returns access + refresh token |
| POST | `/api/auth/logout` | — | Invalidate refresh token in DB |
| POST | `/api/auth/refresh` | — | Get new access token from refresh token (cookie) |
| POST | `/api/auth/forgot-password` | — | Send email with password reset link |
| POST | `/api/auth/reset-password` | — | Set new password (with token from email) |
| GET | `/api/auth/me` | — | Get currently logged-in user info |
| PUT | `/api/auth/profile` | — | Update profile (name, height, gender...) |
| PUT | `/api/auth/settings` | — | Update settings (units, timezone, notifications) |
| GET | `/api/auth/google` | — | Redirect to Google OAuth consent screen |
| GET | `/api/auth/google/callback` | `code`, `state` | Google OAuth callback — exchange code for tokens |

**Key Request Bodies — AUTH:**

```json
POST /api/auth/register       → { "email": "string", "password": "string", "name": "string" }
POST /api/auth/login          → { "email": "string", "password": "string" }
POST /api/auth/reset-password → { "token": "string", "new_password": "string" }
PUT  /api/auth/profile        → { "name": "string", "height_cm": 175, "gender": "male", "birthdate": "2000-01-01" }
// GET /api/auth/google → no body; redirects to Google
// GET /api/auth/google/callback → handled server-side; redirects FE to /dashboard with tokens
```

---

## EXERCISES

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/exercises` | `search`, `muscle`, `equipment`, `limit`, `offset` | List exercises (filter + paginate) |
| POST | `/api/exercises` | — | Create a custom exercise |
| GET | `/api/exercises/:id` | — | Details of one exercise + PR history |
| DELETE | `/api/exercises/:id` | — | Delete a custom exercise (soft delete) |

**Key Request Bodies — EXERCISES:**

```json
POST /api/exercises → { "name": "string", "primary_muscle": "chest", "equipment": "barbell", "description": "string?" }
```

---

## WORKOUT PLANS

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/plans` | — | List user's workout plans |
| POST | `/api/plans` | — | Create a new plan |
| GET | `/api/plans/:id` | — | Plan details + list of plan_days & exercises |
| PUT | `/api/plans/:id` | — | Update plan (name, description, split type) |
| DELETE | `/api/plans/:id` | — | Delete plan (soft delete, preserves session history) |
| POST | `/api/plans/:id/activate` | — | Activate plan (deactivates previous plan) |
| POST | `/api/plans/:id/duplicate` | — | Duplicate plan (deep copy: plan + all days + exercises) |
| POST | `/api/plans/:id/days` | — | Add a plan day |
| PUT | `/api/plans/:id/days/:dayId` | — | Update a plan day |
| DELETE | `/api/plans/:id/days/:dayId` | — | Delete a plan day |
| POST | `/api/plans/:id/days/:dayId/exercises` | — | Add exercise to plan day |
| PUT | `/api/plans/:id/days/:dayId/exercises/:exId` | — | Update sets/reps/rest |
| DELETE | `/api/plans/:id/days/:dayId/exercises/:exId` | — | Remove exercise from plan day |

**Key Request Bodies — WORKOUT PLANS:**

```json
POST /api/plans → { "name": "string", "description": "string?", "split_type": "ppl", "duration_weeks": 8 }
POST /api/plans/:id/days → { "day_of_week": 1, "name": "Push Day", "order_index": 1 }
POST /api/plans/:id/days/:dayId/exercises → {
  "exercise_id": "uuid", "sets": 4, "reps_min": 8, "reps_max": 12,
  "rest_seconds": 90, "order_index": 1, "notes": "string?"
}
```

---

## WORKOUT SESSIONS

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/workouts/sessions` | `from`, `to`, `limit`, `offset` | Workout history (with date range) |
| POST | `/api/workouts/sessions` | — | Start a new workout session |
| GET | `/api/workouts/sessions/:id` | — | Details of one session + all sets |
| PUT | `/api/workouts/sessions/:id` | — | End session / update notes |
| POST | `/api/workouts/sessions/:id/sets` | — | Log one set (exercise, reps, kg) |
| PUT | `/api/workouts/sessions/:id/sets/:setId` | — | Edit a logged set (correct reps/weight) |
| DELETE | `/api/workouts/sessions/:id/sets/:setId` | — | Delete an incorrectly logged set |

**Key Request Bodies — WORKOUT SESSIONS:**

```json
POST /api/workouts/sessions → { "name": "string?", "plan_day_id": "uuid?", "scheduled_id": "uuid?", "started_at": "ISO8601" }
POST /api/workouts/sessions/:id/sets → {
  "exercise_id": "uuid", "set_number": 1, "reps": 10,
  "weight_kg": 80.0, "duration_seconds": null
}
PUT /api/workouts/sessions/:id/sets/:setId → { "reps": 12, "weight_kg": 82.5 }
PUT /api/workouts/sessions/:id → { "ended_at": "ISO8601", "notes": "string?" }
```

---

## SCHEDULE

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/schedule` | `from`, `to` | Workout schedule by date range (includes `scheduled_exercises` with nested exercise) |
| GET | `/api/schedule/today` | `date?` | Today's scheduled workouts with exercises — used by the Workout page |
| POST | `/api/schedule` | — | Create a new scheduled workout |
| PUT | `/api/schedule/:id` | — | Update schedule (change time, date, completion status) |
| DELETE | `/api/schedule/:id` | — | Cancel / delete scheduled workout (cascades to scheduled exercises) |
| POST | `/api/schedule/:id/exercises` | — | Add an exercise to a scheduled workout |
| PUT | `/api/schedule/:id/exercises/:exerciseEntryId` | — | Update a scheduled exercise (sets / reps / weight) |
| DELETE | `/api/schedule/:id/exercises/:exerciseEntryId` | — | Remove an exercise from a scheduled workout |

**Key Request Bodies — SCHEDULE:**

```json
POST /api/schedule → { "plan_day_id": "uuid?", "name": "string", "scheduled_date": "YYYY-MM-DD", "scheduled_time": "HH:MM" }

POST /api/schedule/:id/exercises → {
  "exercise_id": "uuid",
  "sets": 3,
  "reps": 10,
  "weight_kg": 60.0,
  "order_index": 0,
  "notes": "string?"
}

PUT /api/schedule/:id/exercises/:exerciseEntryId → {
  "sets": 4,
  "reps": 8,
  "weight_kg": 65.0
}
```

**GET /api/schedule Response Shape (updated):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Ngày Ngực",
      "scheduled_date": "2026-04-17T00:00:00.000Z",
      "scheduled_time": "1970-01-01T18:00:00.000Z",
      "is_completed": false,
      "plan": null,
      "plan_day": null,
      "scheduled_exercises": [
        {
          "id": "uuid",
          "exercise_id": "uuid",
          "sets": 4,
          "reps": 10,
          "weight_kg": 80.0,
          "order_index": 0,
          "notes": null,
          "exercise": {
            "id": "uuid",
            "name": "Bench Press",
            "primary_muscle": "chest",
            "equipment": "barbell"
          }
        }
      ]
    }
  ]
}
```

---

## PROGRESS

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/progress/measurements` | `from`, `to`, `limit`, `offset` | Body measurement history |
| POST | `/api/progress/measurements` | — | Log new measurements (weight, body data, photo) |
| GET | `/api/progress/charts` | `type`, `from`, `to` | Chart data (`type`: weight/volume/strength) |
| GET | `/api/progress/records` | — | All Personal Records per exercise |

**Key Request Bodies — PROGRESS:**

```json
POST /api/progress/measurements → {
  "measured_at": "YYYY-MM-DD", "weight_kg": 75.5, "body_fat_pct": 18.0,
  "chest_cm": 100, "waist_cm": 80, "hips_cm": 95,
  "left_arm_cm": 35, "right_arm_cm": 35, "left_thigh_cm": 55, "right_thigh_cm": 55,
  "photo_url": "string?", "notes": "string?"
}
```

---

## NUTRITION

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/nutrition/plan` | — | Currently active nutrition plan |
| POST | `/api/nutrition/plan` | — | Create a new nutrition plan |
| PUT | `/api/nutrition/plan/:id` | — | Update calorie/macro goals |
| GET | `/api/nutrition/logs` | `date` | Food log by date (defaults to today) |
| POST | `/api/nutrition/logs` | — | Log a new meal |
| DELETE | `/api/nutrition/logs/:id` | — | Delete an incorrectly logged food entry |
| GET | `/api/nutrition/foods/search` | `q`, `limit` | Search foods (Open Food Facts + custom) |
| POST | `/api/nutrition/foods` | — | Add a custom food item |

**Key Request Bodies — NUTRITION:**

```json
POST /api/nutrition/plan → { "name": "string?", "daily_calories": 2500, "protein_g": 180, "carbs_g": 250, "fat_g": 80, "start_date": "YYYY-MM-DD" }
POST /api/nutrition/logs → { "food_id": "uuid", "logged_at": "YYYY-MM-DD", "meal_type": "lunch", "quantity_g": 150 }
POST /api/nutrition/foods → { "name": "string", "calories_per100g": 350, "protein_per100g": 25, "carbs_per100g": 40, "fat_per100g": 10 }
```

---

## NOTIFICATIONS

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| POST | `/api/notifications/subscribe` | — | Register browser's Web Push subscription |
| DELETE | `/api/notifications/subscribe` | — | Unsubscribe current device from push notifications |

**Key Request Bodies — NOTIFICATIONS:**

```json
POST /api/notifications/subscribe → {
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "string",   // Public key for payload encryption
    "auth": "string"      // Auth secret
  },
  "user_agent": "string?" // Optional: browser/device label
}
// DELETE /api/notifications/subscribe → { "endpoint": "string" }
```

---

## AI COACH

| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/api/ai/conversations` | — | List conversations |
| POST | `/api/ai/conversations` | — | Create a new conversation |
| GET | `/api/ai/conversations/:id/messages` | — | Message history of a conversation |
| POST | `/api/ai/conversations/:id/messages` | — | Send a message, receive AI response (stream) |
| GET | `/api/ai/insights` | `period` | AI analysis (`period`: week/month) |

**Key Request Bodies — AI COACH:**

```json
POST /api/ai/conversations → { "context_type": "general", "title": "string?" }
POST /api/ai/conversations/:id/messages → { "content": "string" }
```

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
