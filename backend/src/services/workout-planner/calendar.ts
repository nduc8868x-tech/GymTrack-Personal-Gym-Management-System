import { prisma } from '../../config/database';
import type {
  WeeklyPlan,
  ScheduledWorkout,
  CalendarMode,
  WorkoutStatus,
  TemplateExercise,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return toDateStr(new Date());
}

// Map Prisma ScheduledWorkout row → interface ScheduledWorkout
function mapRow(
  row: Awaited<ReturnType<typeof prisma.scheduledWorkout.findFirst>> & {
    scheduled_exercises?: Array<{
      id: string;
      sets: number;
      reps: number;
      weight_kg: number | null;
      exercise: { id: string; name: string; primary_muscle: string; equipment: string };
    }>;
  },
): ScheduledWorkout | null {
  if (!row) return null;

  const exercises: TemplateExercise[] = (row.scheduled_exercises ?? []).map((se) => ({
    exercise: {
      id:          se.exercise.id,
      name:        se.exercise.name,
      muscleGroup: se.exercise.primary_muscle as TemplateExercise['exercise']['muscleGroup'],
      equipment:   se.exercise.equipment      as TemplateExercise['exercise']['equipment'],
      level:       'intermediate' as const,
    },
    sets:        se.sets,
    reps:        se.reps,
    restSeconds: 90,
  }));

  const status: WorkoutStatus = row.is_completed ? 'completed' : 'planned';

  return {
    id:        row.id,
    date:      toDateStr(row.scheduled_date),
    name:      row.name ?? 'Workout',
    exercises,
    source:    'ai',
    status,
  };
}

// ─── applyPlanToCalendar ──────────────────────────────────────────────────────

export async function applyPlanToCalendar(
  userId: string,
  plan: WeeklyPlan,
  startDate: Date,
  mode: CalendarMode,
): Promise<ScheduledWorkout[]> {
  const results: ScheduledWorkout[] = [];
  const today = todayStr();

  for (const day of plan.days) {
    if (day.type === 'rest' || day.exercises.length === 0) continue;

    const targetDate = addDays(startDate, day.dayIndex);
    const dateStr    = toDateStr(targetDate);

    // mode: from_today — skip past days
    if (mode === 'from_today' && dateStr < today) continue;

    // mode: fill_empty_only — skip days that already have a scheduled workout
    if (mode === 'fill_empty_only') {
      const existing = await prisma.scheduledWorkout.findFirst({
        where: { user_id: userId, scheduled_date: targetDate },
      });
      if (existing) continue;
    }

    // mode: overwrite_all — delete existing entries for this date first
    if (mode === 'overwrite_all') {
      await prisma.scheduledWorkout.deleteMany({
        where: { user_id: userId, scheduled_date: targetDate },
      });
    }

    // Create the scheduled workout + its exercises in a transaction
    const created = await prisma.$transaction(async (tx) => {
      const sw = await tx.scheduledWorkout.create({
        data: {
          user_id:        userId,
          name:           day.name,
          scheduled_date: targetDate,
        },
      });

      if (day.exercises.length > 0) {
        await tx.scheduledExercise.createMany({
          data: day.exercises.map((te, idx) => ({
            scheduled_id: sw.id,
            exercise_id:  te.exercise.id,
            sets:         te.sets,
            reps:         te.reps,
            weight_kg:    null,
            order_index:  idx,
          })),
        });
      }

      return tx.scheduledWorkout.findUnique({
        where: { id: sw.id },
        include: {
          scheduled_exercises: {
            orderBy: { order_index: 'asc' },
            include: { exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } } },
          },
        },
      });
    });

    if (created) {
      const mapped = mapRow(created as Parameters<typeof mapRow>[0]);
      if (mapped) results.push({ ...mapped, source: 'ai' });
    }
  }

  return results;
}

// ─── getTodayWorkout ──────────────────────────────────────────────────────────

export async function getTodayWorkout(
  userId: string,
  date?: string,
): Promise<ScheduledWorkout | null> {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const row = await prisma.scheduledWorkout.findFirst({
    where: {
      user_id:        userId,
      scheduled_date: targetDate,
      is_completed:   false,
    },
    orderBy: { created_at: 'asc' },
    include: {
      scheduled_exercises: {
        orderBy: { order_index: 'asc' },
        include: { exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } } },
      },
    },
  });

  return mapRow(row as Parameters<typeof mapRow>[0]);
}

// ─── markMissedWorkouts ───────────────────────────────────────────────────────
// Utility: call daily (cron) to set past-due planned workouts as missed

export async function markMissedWorkouts(userId: string): Promise<number> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  // We repurpose is_completed=false for "planned"; there's no "missed" column.
  // Tag missed ones by checking sessions — if no session exists, they're missed.
  // Here we simply return how many overdue entries exist so callers can decide.
  const count = await prisma.scheduledWorkout.count({
    where: {
      user_id:       userId,
      is_completed:  false,
      scheduled_date: { lt: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return count;
}
