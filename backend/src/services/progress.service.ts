import { prisma } from '../config/database';

// ─── Measurements ─────────────────────────────────────────────────────────────

export async function listMeasurements(
  userId: string,
  params: { from?: string; to?: string; limit: number; offset: number },
) {
  const { from, to, limit, offset } = params;

  const where = {
    user_id: userId,
    ...(from && { measured_at: { gte: new Date(from) } }),
    ...(to && { measured_at: { lte: new Date(to) } }),
  };

  const [measurements, total] = await Promise.all([
    prisma.bodyMeasurement.findMany({
      where,
      orderBy: { measured_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.bodyMeasurement.count({ where }),
  ]);

  return { measurements, total };
}

export async function createMeasurement(
  userId: string,
  data: {
    measured_at: string;
    weight_kg?: number;
    body_fat_pct?: number;
    chest_cm?: number;
    waist_cm?: number;
    hips_cm?: number;
    left_arm_cm?: number;
    right_arm_cm?: number;
    left_thigh_cm?: number;
    right_thigh_cm?: number;
    photo_url?: string;
    notes?: string;
  },
) {
  const measurement = await prisma.bodyMeasurement.create({
    data: {
      user_id: userId,
      measured_at: new Date(data.measured_at),
      weight_kg: data.weight_kg,
      body_fat_pct: data.body_fat_pct,
      chest_cm: data.chest_cm,
      waist_cm: data.waist_cm,
      hips_cm: data.hips_cm,
      left_arm_cm: data.left_arm_cm,
      right_arm_cm: data.right_arm_cm,
      left_thigh_cm: data.left_thigh_cm,
      right_thigh_cm: data.right_thigh_cm,
      photo_url: data.photo_url,
      notes: data.notes,
    },
  });
  return measurement;
}

// ─── Charts ───────────────────────────────────────────────────────────────────

export async function getWeightChart(userId: string, from?: string, to?: string) {
  const where = {
    user_id: userId,
    weight_kg: { not: null },
    ...(from && { measured_at: { gte: new Date(from) } }),
    ...(to && { measured_at: { lte: new Date(to) } }),
  };

  const rows = await prisma.bodyMeasurement.findMany({
    where,
    orderBy: { measured_at: 'asc' },
    select: { measured_at: true, weight_kg: true, body_fat_pct: true },
  });

  return rows.map((r) => ({
    date: r.measured_at.toISOString().split('T')[0],
    weight_kg: r.weight_kg,
    body_fat_pct: r.body_fat_pct,
  }));
}

export async function getVolumeChart(userId: string, from?: string, to?: string) {
  // Total volume (kg*reps) per completed session
  const sessions = await prisma.workoutSession.findMany({
    where: {
      user_id: userId,
      ended_at: { not: null },
      ...(from && { started_at: { gte: new Date(from) } }),
      ...(to && { started_at: { lte: new Date(to + 'T23:59:59Z') } }),
    },
    orderBy: { started_at: 'asc' },
    select: {
      id: true,
      started_at: true,
      name: true,
      session_sets: {
        select: { weight_kg: true, reps: true },
      },
    },
  });

  return sessions.map((s) => {
    const volume = s.session_sets.reduce((sum, set) => {
      if (set.weight_kg != null && set.reps != null) {
        return sum + set.weight_kg * set.reps;
      }
      return sum;
    }, 0);

    return {
      date: s.started_at.toISOString().split('T')[0],
      name: s.name,
      volume_kg: Math.round(volume),
    };
  });
}

export async function getStrengthChart(userId: string, exerciseId?: string, from?: string, to?: string) {
  // Personal records over time — if no exercise specified, return current PRs grouped by exercise
  if (exerciseId) {
    const records = await prisma.personalRecord.findMany({
      where: {
        user_id: userId,
        exercise_id: exerciseId,
        ...(from && { achieved_at: { gte: new Date(from) } }),
        ...(to && { achieved_at: { lte: new Date(to) } }),
      },
      orderBy: { achieved_at: 'asc' },
      select: {
        achieved_at: true,
        weight_kg: true,
        reps: true,
        one_rm_estimate: true,
        is_current_best: true,
      },
    });

    return records.map((r) => ({
      date: r.achieved_at.toISOString().split('T')[0],
      weight_kg: r.weight_kg,
      reps: r.reps,
      one_rm_estimate: r.one_rm_estimate,
      is_current_best: r.is_current_best,
    }));
  }

  // Return top 5 exercises by 1RM (current bests)
  const topPRs = await prisma.personalRecord.findMany({
    where: { user_id: userId, is_current_best: true },
    orderBy: { one_rm_estimate: 'desc' },
    take: 5,
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true } },
    },
  });

  return topPRs.map((r) => ({
    exercise_id: r.exercise_id,
    exercise_name: r.exercise.name,
    primary_muscle: r.exercise.primary_muscle,
    weight_kg: r.weight_kg,
    reps: r.reps,
    one_rm_estimate: r.one_rm_estimate,
    achieved_at: r.achieved_at.toISOString().split('T')[0],
  }));
}

// ─── Personal Records ─────────────────────────────────────────────────────────

export async function getPersonalRecords(userId: string) {
  // Group: current best per exercise + full history
  const currentBests = await prisma.personalRecord.findMany({
    where: { user_id: userId, is_current_best: true },
    orderBy: { one_rm_estimate: 'desc' },
    include: {
      exercise: { select: { id: true, name: true, primary_muscle: true, equipment: true } },
    },
  });

  return currentBests.map((pr) => ({
    exercise_id: pr.exercise_id,
    exercise_name: pr.exercise.name,
    primary_muscle: pr.exercise.primary_muscle,
    equipment: pr.exercise.equipment,
    weight_kg: pr.weight_kg,
    reps: pr.reps,
    one_rm_estimate: pr.one_rm_estimate,
    achieved_at: pr.achieved_at.toISOString().split('T')[0],
  }));
}
