-- CreateTable
CREATE TABLE "user_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "google_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "gender" TEXT,
    "birthdate" DATETIME,
    "height_cm" REAL,
    "updated_at" DATETIME,
    CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "goal_type" TEXT NOT NULL,
    "target_weight" REAL,
    "target_date" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "weight_unit" TEXT NOT NULL DEFAULT 'kg',
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "updated_at" DATETIME,
    CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "primary_muscle" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" DATETIME,
    CONSTRAINT "exercises_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "exercise_muscles" (
    "exercise_id" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL,

    PRIMARY KEY ("exercise_id", "muscle_group"),
    CONSTRAINT "exercise_muscles_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "split_type" TEXT NOT NULL,
    "duration_weeks" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    "deleted_at" DATETIME,
    CONSTRAINT "workout_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plan_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "name" TEXT,
    "order_index" INTEGER,
    "updated_at" DATETIME,
    CONSTRAINT "plan_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "plan_exercises" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER,
    "reps_min" INTEGER,
    "reps_max" INTEGER,
    "rest_seconds" INTEGER NOT NULL DEFAULT 90,
    "order_index" INTEGER,
    "notes" TEXT,
    CONSTRAINT "plan_exercises_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "plan_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scheduled_workouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "plan_day_id" TEXT,
    "name" TEXT,
    "scheduled_date" DATETIME NOT NULL,
    "scheduled_time" DATETIME,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "scheduled_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "scheduled_workouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "scheduled_workouts_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workout_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scheduled_id" TEXT,
    "plan_id" TEXT,
    "plan_day_id" TEXT,
    "name" TEXT,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "workout_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workout_sessions_scheduled_id_fkey" FOREIGN KEY ("scheduled_id") REFERENCES "scheduled_workouts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workout_sessions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workout_sessions_plan_day_id_fkey" FOREIGN KEY ("plan_day_id") REFERENCES "plan_days" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "session_sets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps" INTEGER,
    "weight_kg" REAL,
    "duration_seconds" INTEGER,
    "is_personal_record" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "session_sets_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_sets_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "personal_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "session_id" TEXT,
    "weight_kg" REAL,
    "reps" INTEGER,
    "one_rm_estimate" REAL,
    "is_current_best" BOOLEAN NOT NULL DEFAULT false,
    "achieved_at" DATETIME NOT NULL,
    CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "personal_records_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "workout_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "body_measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "measured_at" DATETIME NOT NULL,
    "weight_kg" REAL,
    "body_fat_pct" REAL,
    "chest_cm" REAL,
    "waist_cm" REAL,
    "hips_cm" REAL,
    "left_arm_cm" REAL,
    "right_arm_cm" REAL,
    "left_thigh_cm" REAL,
    "right_thigh_cm" REAL,
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT,
    "daily_calories" INTEGER,
    "protein_g" INTEGER,
    "carbs_g" INTEGER,
    "fat_g" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "nutrition_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "serving_size_g" REAL,
    "serving_unit" TEXT,
    "open_food_facts_id" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "foods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "food_nutrients" (
    "food_id" TEXT NOT NULL PRIMARY KEY,
    "calories_per100g" REAL NOT NULL,
    "protein_per100g" REAL NOT NULL DEFAULT 0,
    "carbs_per100g" REAL NOT NULL DEFAULT 0,
    "fat_per100g" REAL NOT NULL DEFAULT 0,
    "fiber_per100g" REAL NOT NULL DEFAULT 0,
    "updated_at" DATETIME,
    CONSTRAINT "food_nutrients_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "food_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "logged_at" DATETIME NOT NULL,
    "meal_type" TEXT NOT NULL,
    "quantity_g" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "food_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "food_logs_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "context_type" TEXT NOT NULL DEFAULT 'general',
    "context_ref_id" TEXT,
    "context_snapshot" TEXT,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME,
    CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_email_key" ON "user_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_google_id_key" ON "user_accounts"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "plan_days_plan_id_day_of_week_name_key" ON "plan_days"("plan_id", "day_of_week", "name");

-- CreateIndex
CREATE INDEX "scheduled_workouts_scheduled_date_idx" ON "scheduled_workouts"("scheduled_date");

-- CreateIndex
CREATE INDEX "workout_sessions_user_id_idx" ON "workout_sessions"("user_id");

-- CreateIndex
CREATE INDEX "session_sets_session_id_idx" ON "session_sets"("session_id");

-- CreateIndex
CREATE INDEX "personal_records_user_id_exercise_id_idx" ON "personal_records"("user_id", "exercise_id");

-- CreateIndex
CREATE INDEX "body_measurements_user_id_measured_at_idx" ON "body_measurements"("user_id", "measured_at");

-- CreateIndex
CREATE INDEX "food_logs_user_id_logged_at_idx" ON "food_logs"("user_id", "logged_at");
