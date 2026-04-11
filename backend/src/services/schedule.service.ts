import { prisma } from '../config/database';

export async function listSchedule(userId: string, from: string, to: string) {
  const schedules = await prisma.scheduledWorkout.findMany({
    where: {
      user_id: userId,
      scheduled_date: {
        gte: new Date(from),
        lte: new Date(to),
      },
    },
    orderBy: [{ scheduled_date: 'asc' }, { scheduled_time: 'asc' }],
    include: {
      plan_day: { select: { id: true, name: true, day_of_week: true } },
      plan: { select: { id: true, name: true } },
    },
  });
  return schedules;
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
  // Build scheduled_time as a DateTime (use a fixed date for time-only storage)
  let scheduledTime: Date | undefined;
  if (data.scheduled_time) {
    const [hours, minutes] = data.scheduled_time.split(':').map(Number);
    scheduledTime = new Date(1970, 0, 1, hours, minutes);
  }

  // If plan_day_id given, verify it's accessible and derive plan_id
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
    include: {
      plan_day: { select: { id: true, name: true, day_of_week: true } },
      plan: { select: { id: true, name: true } },
    },
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
    include: {
      plan_day: { select: { id: true, name: true, day_of_week: true } },
      plan: { select: { id: true, name: true } },
    },
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
