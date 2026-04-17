-- CreateTable
CREATE TABLE "scheduled_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scheduled_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" INTEGER NOT NULL DEFAULT 10,
    "weight_kg" DOUBLE PRECISION,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "scheduled_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_exercises_scheduled_id_idx" ON "scheduled_exercises"("scheduled_id");

-- AddForeignKey
ALTER TABLE "scheduled_exercises" ADD CONSTRAINT "scheduled_exercises_scheduled_id_fkey" FOREIGN KEY ("scheduled_id") REFERENCES "scheduled_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_exercises" ADD CONSTRAINT "scheduled_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
