import { prisma } from '../../config/database';
import type { ScheduledWorkout, WorkoutSession } from './types';

// ─── startWorkout ─────────────────────────────────────────────────────────────

export async function startWorkout(
  userId: string,
  scheduledWorkout: ScheduledWorkout,
): Promise<WorkoutSession> {
  // Guard: prevent duplicate in-progress sessions
  const activeSession = await prisma.workoutSession.findFirst({
    where: { user_id: userId, ended_at: null },
  });
  if (activeSession) {
    throw Object.assign(
      new Error('Another session is already in progress'),
      { code: 'SESSION_CONFLICT' },
    );
  }

  // Guard: scheduled workout must belong to user
  const sw = await prisma.scheduledWorkout.findFirst({
    where: { id: scheduledWorkout.id, user_id: userId },
  });
  if (!sw) {
    throw Object.assign(
      new Error('Scheduled workout not found'),
      { code: 'NOT_FOUND' },
    );
  }

  const now = new Date();

  const session = await prisma.workoutSession.create({
    data: {
      user_id:      userId,
      scheduled_id: scheduledWorkout.id,
      name:         scheduledWorkout.name,
      started_at:   now,
    },
  });

  return {
    id:                  session.id,
    scheduledWorkoutId:  scheduledWorkout.id,
    date:                now.toISOString().slice(0, 10),
    status:              'in_progress',
    startedAt:           session.started_at.toISOString(),
  };
}

// ─── completeWorkout ──────────────────────────────────────────────────────────

export async function completeWorkout(
  userId: string,
  session: WorkoutSession,
  scheduledWorkout: ScheduledWorkout,
  notes?: string,
): Promise<WorkoutSession> {
  const dbSession = await prisma.workoutSession.findFirst({
    where: { id: session.id, user_id: userId },
  });
  if (!dbSession) {
    throw Object.assign(
      new Error('Session not found'),
      { code: 'NOT_FOUND' },
    );
  }
  if (dbSession.ended_at) {
    throw Object.assign(
      new Error('Session is already completed'),
      { code: 'ALREADY_COMPLETED' },
    );
  }

  const now = new Date();

  const [updatedSession] = await prisma.$transaction([
    prisma.workoutSession.update({
      where: { id: session.id },
      data:  { ended_at: now, ...(notes && { notes }) },
    }),
    prisma.scheduledWorkout.update({
      where: { id: scheduledWorkout.id },
      data:  { is_completed: true },
    }),
  ]);

  return {
    id:                  updatedSession.id,
    scheduledWorkoutId:  scheduledWorkout.id,
    date:                session.date,
    status:              'completed',
    startedAt:           updatedSession.started_at.toISOString(),
    completedAt:         now.toISOString(),
  };
}

// ─── getActiveSession ─────────────────────────────────────────────────────────

export async function getActiveSession(userId: string): Promise<WorkoutSession | null> {
  const session = await prisma.workoutSession.findFirst({
    where: { user_id: userId, ended_at: null },
    orderBy: { started_at: 'desc' },
  });

  if (!session) return null;

  return {
    id:                 session.id,
    scheduledWorkoutId: session.scheduled_id ?? '',
    date:               session.started_at.toISOString().slice(0, 10),
    status:             'in_progress',
    startedAt:          session.started_at.toISOString(),
  };
}

// ─── abandonSession ───────────────────────────────────────────────────────────
// Mark a session as ended without marking the scheduled workout completed.

export async function abandonSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const session = await prisma.workoutSession.findFirst({
    where: { id: sessionId, user_id: userId, ended_at: null },
  });
  if (!session) {
    throw Object.assign(
      new Error('Active session not found'),
      { code: 'NOT_FOUND' },
    );
  }
  await prisma.workoutSession.update({
    where: { id: sessionId },
    data:  { ended_at: new Date() },
  });
}
