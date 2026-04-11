import { prisma } from '../config/database';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcOneRM(weightKg: number, reps: number): number {
  return Math.round(weightKg * (1 + reps / 30));
}

async function updatePersonalRecord(
  userId: string,
  exerciseId: string,
  sessionId: string,
  weightKg: number,
  reps: number,
): Promise<boolean> {
  const newOneRM = calcOneRM(weightKg, reps);

  const currentBest = await prisma.personalRecord.findFirst({
    where: { user_id: userId, exercise_id: exerciseId, is_current_best: true },
  });

  if (currentBest && (currentBest.one_rm_estimate ?? 0) >= newOneRM) {
    return false; // not a PR
  }

  // New PR — archive old, insert new
  await prisma.$transaction([
    ...(currentBest
      ? [
          prisma.personalRecord.updateMany({
            where: { user_id: userId, exercise_id: exerciseId, is_current_best: true },
            data: { is_current_best: false },
          }),
        ]
      : []),
    prisma.personalRecord.create({
      data: {
        user_id: userId,
        exercise_id: exerciseId,
        session_id: sessionId,
        weight_kg: weightKg,
        reps,
        one_rm_estimate: newOneRM,
        is_current_best: true,
        achieved_at: new Date(),
      },
    }),
  ]);

  return true;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function listSessions(
  userId: string,
  params: { from?: string; to?: string; limit: number; offset: number },
) {
  const { from, to, limit, offset } = params;

  const where = {
    user_id: userId,
    ended_at: { not: null }, // only completed sessions in history
    ...(from && { started_at: { gte: new Date(from) } }),
    ...(to && { started_at: { lte: new Date(to + 'T23:59:59Z') } }),
  };

  const [sessions, total] = await Promise.all([
    prisma.workoutSession.findMany({
      where,
      orderBy: { started_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { session_sets: true } },
      },
    }),
    prisma.workoutSession.count({ where }),
  ]);

  return { sessions, total };
}

export async function startSession(
  userId: string,
  data: {
    name?: string;
    plan_day_id?: string;
    scheduled_id?: string;
    started_at?: string;
  },
) {
  const session = await prisma.workoutSession.create({
    data: {
      user_id: userId,
      name: data.name,
      plan_day_id: data.plan_day_id,
      scheduled_id: data.scheduled_id,
      started_at: data.started_at ? new Date(data.started_at) : new Date(),
    },
  });
  return session;
}

export async function getSession(id: string, userId: string) {
  const session = await prisma.workoutSession.findFirst({
    where: { id, user_id: userId },
    include: {
      session_sets: {
        orderBy: [{ exercise_id: 'asc' }, { set_number: 'asc' }],
        include: { exercise: { select: { id: true, name: true, primary_muscle: true } } },
      },
    },
  });

  if (!session) {
    const err = new Error('Session not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  return session;
}

export async function endSession(
  id: string,
  userId: string,
  data: { ended_at?: string; notes?: string },
) {
  const session = await prisma.workoutSession.findFirst({ where: { id, user_id: userId } });
  if (!session) {
    const err = new Error('Session not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  const updated = await prisma.workoutSession.update({
    where: { id },
    data: {
      ended_at: data.ended_at ? new Date(data.ended_at) : new Date(),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  return updated;
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export async function logSet(
  sessionId: string,
  userId: string,
  data: {
    exercise_id: string;
    set_number: number;
    reps?: number;
    weight_kg?: number;
    duration_seconds?: number;
  },
) {
  // Verify session belongs to user and is still open
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, user_id: userId },
  });
  if (!session) {
    const err = new Error('Session not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  if (session.ended_at) {
    const err = new Error('Session already ended');
    (err as Error & { code: string }).code = 'SESSION_ENDED';
    throw err;
  }

  // Check if exercise exists and is accessible
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

  // Determine if this is a PR
  let isPR = false;
  if (data.weight_kg !== undefined && data.reps !== undefined && data.reps > 0) {
    isPR = await updatePersonalRecord(
      userId,
      data.exercise_id,
      sessionId,
      data.weight_kg,
      data.reps,
    );
  }

  const set = await prisma.sessionSet.create({
    data: {
      session_id: sessionId,
      exercise_id: data.exercise_id,
      set_number: data.set_number,
      reps: data.reps,
      weight_kg: data.weight_kg,
      duration_seconds: data.duration_seconds,
      is_personal_record: isPR,
    },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true } },
    },
  });

  return set;
}

export async function updateSet(
  sessionId: string,
  setId: string,
  userId: string,
  data: { reps?: number; weight_kg?: number; duration_seconds?: number },
) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, user_id: userId } });
  if (!session) {
    const err = new Error('Session not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  const set = await prisma.sessionSet.findFirst({ where: { id: setId, session_id: sessionId } });
  if (!set) {
    const err = new Error('Set not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  const updated = await prisma.sessionSet.update({
    where: { id: setId },
    data: {
      ...(data.reps !== undefined && { reps: data.reps }),
      ...(data.weight_kg !== undefined && { weight_kg: data.weight_kg }),
      ...(data.duration_seconds !== undefined && { duration_seconds: data.duration_seconds }),
    },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true } },
    },
  });

  return updated;
}

export async function deleteSet(sessionId: string, setId: string, userId: string) {
  const session = await prisma.workoutSession.findFirst({ where: { id: sessionId, user_id: userId } });
  if (!session) {
    const err = new Error('Session not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  if (session.ended_at) {
    const err = new Error('Cannot delete sets from a completed session');
    (err as Error & { code: string }).code = 'SESSION_ENDED';
    throw err;
  }

  const set = await prisma.sessionSet.findFirst({ where: { id: setId, session_id: sessionId } });
  if (!set) {
    const err = new Error('Set not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  await prisma.sessionSet.delete({ where: { id: setId } });
}
