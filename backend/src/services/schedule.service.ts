import { prisma } from '../config/database';

const exerciseInclude = {
  scheduled_exercises: {
    orderBy: { order_index: 'asc' as const },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } },
    },
  },
};

const planInclude = {
  plan_day: { select: { id: true, name: true, day_of_week: true } },
  plan: { select: { id: true, name: true } },
};

export async function listSchedule(userId: string, from: string, to: string) {
  return prisma.scheduledWorkout.findMany({
    where: {
      user_id: userId,
      scheduled_date: { gte: new Date(from), lte: new Date(to) },
    },
    orderBy: [{ scheduled_date: 'asc' }, { scheduled_time: 'asc' }],
    include: { ...planInclude, ...exerciseInclude },
  });
}

export async function getTodaySchedule(userId: string, date?: string) {
  const target = date ? new Date(date) : new Date();
  target.setHours(0, 0, 0, 0);
  return prisma.scheduledWorkout.findMany({
    where: { user_id: userId, scheduled_date: target },
    orderBy: { scheduled_time: 'asc' },
    include: { ...planInclude, ...exerciseInclude },
  });
}

export async function createSchedule(
  userId: string,
  data: {
    name?: string;
    plan_day_id?: string;
    scheduled_date: string;
    scheduled_time?: string;
  },
) {
  let scheduledTime: Date | undefined;
  if (data.scheduled_time) {
    const [hours, minutes] = data.scheduled_time.split(':').map(Number);
    scheduledTime = new Date(1970, 0, 1, hours, minutes);
  }

  let planId: string | undefined;
  if (data.plan_day_id) {
    const day = await prisma.planDay.findFirst({
      where: { id: data.plan_day_id },
      include: { plan: { select: { id: true, user_id: true } } },
    });
    if (!day || day.plan.user_id !== userId) {
      const err = new Error('Plan day not found');
      (err as Error & { code: string }).code = 'NOT_FOUND';
      throw err;
    }
    planId = day.plan.id;
  }

  return prisma.scheduledWorkout.create({
    data: {
      user_id: userId,
      name: data.name,
      plan_day_id: data.plan_day_id,
      plan_id: planId,
      scheduled_date: new Date(data.scheduled_date),
      ...(scheduledTime && { scheduled_time: scheduledTime }),
    },
    include: { ...planInclude, ...exerciseInclude },
  });
}

export async function updateSchedule(
  id: string,
  userId: string,
  data: {
    name?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    is_completed?: boolean;
  },
) {
  const schedule = await prisma.scheduledWorkout.findFirst({ where: { id, user_id: userId } });
  if (!schedule) {
    const err = new Error('Scheduled workout not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  let scheduledTime: Date | undefined;
  if (data.scheduled_time) {
    const [hours, minutes] = data.scheduled_time.split(':').map(Number);
    scheduledTime = new Date(1970, 0, 1, hours, minutes);
  }

  return prisma.scheduledWorkout.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.scheduled_date && { scheduled_date: new Date(data.scheduled_date) }),
      ...(scheduledTime && { scheduled_time: scheduledTime }),
      ...(data.is_completed !== undefined && { is_completed: data.is_completed }),
    },
    include: { ...planInclude, ...exerciseInclude },
  });
}

export async function deleteSchedule(id: string, userId: string) {
  const schedule = await prisma.scheduledWorkout.findFirst({ where: { id, user_id: userId } });
  if (!schedule) {
    const err = new Error('Scheduled workout not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  await prisma.scheduledWorkout.delete({ where: { id } });
}

// ─── ScheduledExercise CRUD ───────────────────────────────────────────────────

async function verifyOwnership(scheduledId: string, userId: string) {
  const schedule = await prisma.scheduledWorkout.findFirst({
    where: { id: scheduledId, user_id: userId },
  });
  if (!schedule) {
    const err = new Error('Scheduled workout not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  return schedule;
}

export async function addScheduledExercise(
  scheduledId: string,
  userId: string,
  data: {
    exercise_id: string;
    sets: number;
    reps: number;
    weight_kg?: number;
    order_index?: number;
    notes?: string;
  },
) {
  await verifyOwnership(scheduledId, userId);

  const exercise = await prisma.exercise.findUnique({ where: { id: data.exercise_id } });
  if (!exercise) {
    const err = new Error('Exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  let orderIndex = data.order_index;
  if (orderIndex === undefined) {
    const last = await prisma.scheduledExercise.findFirst({
      where: { scheduled_id: scheduledId },
      orderBy: { order_index: 'desc' },
    });
    orderIndex = last ? last.order_index + 1 : 0;
  }

  return prisma.scheduledExercise.create({
    data: {
      scheduled_id: scheduledId,
      exercise_id: data.exercise_id,
      sets: data.sets,
      reps: data.reps,
      ...(data.weight_kg !== undefined && { weight_kg: data.weight_kg }),
      order_index: orderIndex,
      ...(data.notes && { notes: data.notes }),
    },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } },
    },
  });
}

export async function updateScheduledExercise(
  scheduledId: string,
  entryId: string,
  userId: string,
  data: {
    sets?: number;
    reps?: number;
    weight_kg?: number;
    order_index?: number;
    notes?: string;
  },
) {
  await verifyOwnership(scheduledId, userId);
  const entry = await prisma.scheduledExercise.findFirst({
    where: { id: entryId, scheduled_id: scheduledId },
  });
  if (!entry) {
    const err = new Error('Scheduled exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  return prisma.scheduledExercise.update({
    where: { id: entryId },
    data: {
      ...(data.sets !== undefined && { sets: data.sets }),
      ...(data.reps !== undefined && { reps: data.reps }),
      ...(data.weight_kg !== undefined && { weight_kg: data.weight_kg }),
      ...(data.order_index !== undefined && { order_index: data.order_index }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } },
    },
  });
}

export async function removeScheduledExercise(
  scheduledId: string,
  entryId: string,
  userId: string,
) {
  await verifyOwnership(scheduledId, userId);
  const entry = await prisma.scheduledExercise.findFirst({
    where: { id: entryId, scheduled_id: scheduledId },
  });
  if (!entry) {
    const err = new Error('Scheduled exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  await prisma.scheduledExercise.delete({ where: { id: entryId } });
}
