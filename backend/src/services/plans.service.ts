import { prisma } from '../config/database';
import { SplitType } from '@prisma/client';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertPlanOwnership(planId: string, userId: string) {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id: planId, user_id: userId, deleted_at: null },
  });
  if (!plan) {
    const err = new Error('Plan not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return plan;
}

async function assertDayOwnership(planId: string, dayId: string, userId: string) {
  await assertPlanOwnership(planId, userId);
  const day = await prisma.planDay.findFirst({ where: { id: dayId, plan_id: planId } });
  if (!day) {
    const err = new Error('Plan day not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return day;
}

// ─── Plans CRUD ───────────────────────────────────────────────────────────────

export async function listPlans(userId: string) {
  const plans = await prisma.workoutPlan.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: [{ is_active: 'desc' }, { created_at: 'desc' }],
    include: {
      _count: { select: { plan_days: true } },
    },
  });
  return plans;
}

export async function getPlan(id: string, userId: string) {
  const plan = await prisma.workoutPlan.findFirst({
    where: { id, user_id: userId, deleted_at: null },
    include: {
      plan_days: {
        orderBy: [{ order_index: 'asc' }, { day_of_week: 'asc' }],
        include: {
          plan_exercises: {
            orderBy: { order_index: 'asc' },
            include: {
              exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    const err = new Error('Plan not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return plan;
}

export async function createPlan(
  userId: string,
  data: {
    name: string;
    description?: string;
    split_type: SplitType;
    duration_weeks?: number;
  },
) {
  return prisma.workoutPlan.create({ data: { user_id: userId, ...data } });
}

export async function updatePlan(
  id: string,
  userId: string,
  data: {
    name?: string;
    description?: string;
    split_type?: SplitType;
    duration_weeks?: number;
  },
) {
  await assertPlanOwnership(id, userId);
  return prisma.workoutPlan.update({ where: { id }, data });
}

export async function deletePlan(id: string, userId: string) {
  await assertPlanOwnership(id, userId);
  await prisma.workoutPlan.update({ where: { id }, data: { deleted_at: new Date() } });
}

export async function activatePlan(id: string, userId: string) {
  await assertPlanOwnership(id, userId);
  await prisma.$transaction([
    prisma.workoutPlan.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    }),
    prisma.workoutPlan.update({ where: { id }, data: { is_active: true } }),
  ]);
  return getPlan(id, userId);
}

export async function duplicatePlan(id: string, userId: string) {
  const original = await getPlan(id, userId);

  const newPlan = await prisma.$transaction(async (tx) => {
    const copy = await tx.workoutPlan.create({
      data: {
        user_id: userId,
        name: `${original.name} (copy)`,
        description: original.description,
        split_type: original.split_type,
        duration_weeks: original.duration_weeks,
        is_active: false,
      },
    });

    for (const day of original.plan_days) {
      const newDay = await tx.planDay.create({
        data: {
          plan_id: copy.id,
          day_of_week: day.day_of_week,
          name: day.name,
          order_index: day.order_index,
        },
      });

      if (day.plan_exercises.length > 0) {
        await tx.planExercise.createMany({
          data: day.plan_exercises.map((pe) => ({
            plan_day_id: newDay.id,
            exercise_id: pe.exercise_id,
            sets: pe.sets,
            reps_min: pe.reps_min,
            reps_max: pe.reps_max,
            rest_seconds: pe.rest_seconds,
            order_index: pe.order_index,
            notes: pe.notes,
          })),
        });
      }
    }

    return copy;
  });

  return getPlan(newPlan.id, userId);
}

// ─── Plan Days ────────────────────────────────────────────────────────────────

export async function addPlanDay(
  planId: string,
  userId: string,
  data: { day_of_week: number; name?: string; order_index?: number },
) {
  await assertPlanOwnership(planId, userId);
  return prisma.planDay.create({ data: { plan_id: planId, ...data } });
}

export async function updatePlanDay(
  planId: string,
  dayId: string,
  userId: string,
  data: { day_of_week?: number; name?: string; order_index?: number },
) {
  await assertDayOwnership(planId, dayId, userId);
  return prisma.planDay.update({ where: { id: dayId }, data });
}

export async function deletePlanDay(planId: string, dayId: string, userId: string) {
  await assertDayOwnership(planId, dayId, userId);
  await prisma.planDay.delete({ where: { id: dayId } }); // cascade deletes plan_exercises
}

// ─── Plan Exercises ───────────────────────────────────────────────────────────

export async function addExerciseToDay(
  planId: string,
  dayId: string,
  userId: string,
  data: {
    exercise_id: string;
    sets?: number;
    reps_min?: number;
    reps_max?: number;
    rest_seconds?: number;
    order_index?: number;
    notes?: string;
  },
) {
  await assertDayOwnership(planId, dayId, userId);

  // Verify exercise is accessible
  const exercise = await prisma.exercise.findFirst({
    where: {
      id: data.exercise_id,
      deleted_at: null,
      OR: [{ is_custom: false }, { created_by: userId }],
    },
  });
  if (!exercise) {
    const err = new Error('Exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  return prisma.planExercise.create({
    data: { plan_day_id: dayId, ...data },
    include: { exercise: { select: { id: true, name: true, primary_muscle: true } } },
  });
}

export async function updatePlanExercise(
  planId: string,
  dayId: string,
  exId: string,
  userId: string,
  data: {
    sets?: number;
    reps_min?: number;
    reps_max?: number;
    rest_seconds?: number;
    order_index?: number;
    notes?: string;
  },
) {
  await assertDayOwnership(planId, dayId, userId);
  const pe = await prisma.planExercise.findFirst({ where: { id: exId, plan_day_id: dayId } });
  if (!pe) {
    const err = new Error('Plan exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return prisma.planExercise.update({
    where: { id: exId },
    data,
    include: { exercise: { select: { id: true, name: true, primary_muscle: true } } },
  });
}

export async function removePlanExercise(
  planId: string,
  dayId: string,
  exId: string,
  userId: string,
) {
  await assertDayOwnership(planId, dayId, userId);
  const pe = await prisma.planExercise.findFirst({ where: { id: exId, plan_day_id: dayId } });
  if (!pe) {
    const err = new Error('Plan exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  await prisma.planExercise.delete({ where: { id: exId } });
}
