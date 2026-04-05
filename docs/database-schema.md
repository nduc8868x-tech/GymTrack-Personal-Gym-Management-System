# GymTrack — Database Schema

> **Version**: 1.0
> **Date**: 2026-03-28
> **Status**: Approved

---

## AUTH & USER

```sql
Table: users
  id              UUID PK DEFAULT gen_random_uuid()
  email           VARCHAR UNIQUE NOT NULL
  password_hash   VARCHAR
  name            VARCHAR NOT NULL
  avatar_url      VARCHAR
  gender          ENUM('male','female','other')
  birthdate       DATE
  height_cm       FLOAT
  created_at      TIMESTAMP DEFAULT NOW()
  updated_at      TIMESTAMP

Table: refresh_tokens                        -- store refresh tokens to invalidate on logout
  id              UUID PK
  user_id         UUID FK -> users (CASCADE DELETE)
  token_hash      VARCHAR NOT NULL           -- store SHA-256 hash, not raw token
  expires_at      TIMESTAMP NOT NULL
  created_at      TIMESTAMP DEFAULT NOW()

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
```

---

## EXERCISE LIBRARY

```sql
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
  deleted_at      TIMESTAMP                  -- soft delete

Table: exercise_muscles                      -- junction: one exercise can have multiple muscle groups
  exercise_id     UUID FK -> exercises
  muscle_group    ENUM('chest','back','legs','shoulders','arms','core')
  is_primary      BOOLEAN                    -- true = primary muscle, false = secondary
  PRIMARY KEY (exercise_id, muscle_group)
```

---

## WORKOUT PLANS

```sql
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
  deleted_at      TIMESTAMP                  -- soft delete

Table: plan_days
  id              UUID PK
  plan_id         UUID FK -> workout_plans (CASCADE DELETE)
  day_of_week     INT NOT NULL               -- 0=Sunday ... 6=Saturday
  name            VARCHAR                    -- e.g. "Push Day"
  order_index     INT
  updated_at      TIMESTAMP
  UNIQUE (plan_id, day_of_week, name)        -- prevent duplicate day + name combination

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
```

---

## SCHEDULE & SESSIONS

```sql
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
  updated_at      TIMESTAMP                  -- user can change time/date
  INDEX (scheduled_date)                     -- cron job queries by date

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
  updated_at      TIMESTAMP                  -- user can edit notes later
  INDEX (user_id)

Table: session_sets
  id                  UUID PK
  session_id          UUID FK -> workout_sessions (CASCADE DELETE)
  exercise_id         UUID FK -> exercises
  set_number          INT NOT NULL
  reps                INT
  weight_kg           FLOAT
  duration_seconds    INT                    -- for cardio/plank exercises
  is_personal_record  BOOLEAN DEFAULT false
  created_at          TIMESTAMP
  updated_at          TIMESTAMP              -- user can correct a set
  INDEX (session_id)
```

---

## PROGRESS TRACKING

```sql
Table: personal_records
  id               UUID PK
  user_id          UUID FK -> users
  exercise_id      UUID FK -> exercises
  weight_kg        FLOAT
  reps             INT
  one_rm_estimate  FLOAT                     -- Epley: weight * (1 + reps/30)
  is_current_best  BOOLEAN DEFAULT false     -- true = current PR; false = past history
  achieved_at      DATE NOT NULL
  session_id       UUID FK -> workout_sessions
  -- No UNIQUE constraint → preserves full PR history
  -- On new PR: UPDATE is_current_best=false (old), INSERT new with is_current_best=true
  INDEX (user_id, exercise_id)

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
  updated_at      TIMESTAMP                  -- user can edit past measurements
  INDEX (user_id, measured_at)
```

---

## NUTRITION

```sql
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
  protein_per100g     FLOAT NOT NULL DEFAULT 0   -- DEFAULT 0 instead of nullable
  carbs_per100g       FLOAT NOT NULL DEFAULT 0   -- required for macro tracking
  fat_per100g         FLOAT NOT NULL DEFAULT 0
  fiber_per100g       FLOAT NOT NULL DEFAULT 0
  serving_size_g      FLOAT                      -- default serving size
  serving_unit        VARCHAR                    -- e.g. "piece", "tablespoon"
  open_food_facts_id  VARCHAR                    -- external ID for sync
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
  updated_at      TIMESTAMP                      -- user can edit quantity
  INDEX (user_id, logged_at)                     -- composite index: query by date
```

---

## AI COACH

```sql
Table: ai_conversations
  id                UUID PK
  user_id           UUID FK -> users
  context_type      ENUM('general','workout_analysis','nutrition_advice','progress_review')
  context_ref_id    UUID                          -- FK depends on context_type (session_id, plan_id...)
  context_snapshot  JSONB                         -- snapshot of data at the time conversation was created
  title             VARCHAR
  created_at        TIMESTAMP
  updated_at        TIMESTAMP

Table: ai_messages
  id                  UUID PK
  conversation_id     UUID FK -> ai_conversations (CASCADE DELETE)
  role                ENUM('user','assistant')
  content             TEXT NOT NULL
  created_at          TIMESTAMP
```

---

*Document version: 1.0 — 2026-03-28*
*Status: Approved*
