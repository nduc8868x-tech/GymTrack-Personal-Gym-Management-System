import { prisma } from '../config/database';
import { MuscleGroup, Equipment } from '@prisma/client';

export async function listExercises(
  userId: string,
  params: {
    search?: string;
    muscle?: MuscleGroup;
    equipment?: Equipment;
    limit: number;
    offset: number;
  },
) {
  const { search, muscle, equipment, limit, offset } = params;

  const where = {
    deleted_at: null,
    // Show system exercises + user's own custom exercises
    OR: [{ is_custom: false }, { created_by: userId }],
    ...(muscle && { primary_muscle: muscle }),
    ...(equipment && { equipment }),
    ...(search && {
      name: { contains: search, mode: 'insensitive' as const },
    }),
  };

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      include: { exercise_muscles: true },
      orderBy: [{ is_custom: 'asc' }, { name: 'asc' }],
      take: limit,
      skip: offset,
    }),
    prisma.exercise.count({ where }),
  ]);

  return { exercises, total };
}

export async function getExercise(id: string, userId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: {
      id,
      deleted_at: null,
      OR: [{ is_custom: false }, { created_by: userId }],
    },
    include: { exercise_muscles: true },
  });

  if (!exercise) {
    const err = new Error('Exercise not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  // PR history for this user + exercise
  const prs = await prisma.personalRecord.findMany({
    where: { user_id: userId, exercise_id: id },
    orderBy: { achieved_at: 'desc' },
    take: 10,
  });

  return { ...exercise, personal_records: prs };
}

export async function createCustomExercise(
  userId: string,
  data: {
    name: string;
    primary_muscle: MuscleGroup;
    equipment: Equipment;
    description?: string;
    video_url?: string;
    image_url?: string;
  },
) {
  const exercise = await prisma.exercise.create({
    data: {
      name: data.name,
      primary_muscle: data.primary_muscle,
      equipment: data.equipment,
      description: data.description,
      video_url: data.video_url,
      image_url: data.image_url,
      is_custom: true,
      created_by: userId,
      exercise_muscles: {
        create: [{ muscle_group: data.primary_muscle, is_primary: true }],
      },
    },
    include: { exercise_muscles: true },
  });
  return exercise;
}

export async function deleteCustomExercise(id: string, userId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: { id, is_custom: true, created_by: userId, deleted_at: null },
  });

  if (!exercise) {
    const err = new Error('Exercise not found or not deletable');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  await prisma.exercise.update({
    where: { id },
    data: { deleted_at: new Date() },
  });
}

// ─── Image helpers ──────────────────────────────────────────────────────────

export async function updateExerciseImage(
  exerciseId: string,
  imageUrl: string,
) {
  return prisma.exercise.update({
    where: { id: exerciseId },
    data: { image_url: imageUrl },
  });
}

export async function removeExerciseImage(exerciseId: string) {
  return prisma.exercise.update({
    where: { id: exerciseId },
    data: { image_url: null },
  });
}
