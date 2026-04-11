import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  split_type: z.enum(['full_body', 'upper_lower', 'ppl', 'custom']),
  duration_weeks: z.number().int().min(1).max(52).optional(),
});

export const updatePlanSchema = createPlanSchema.partial();

export const createPlanDaySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  name: z.string().max(100).optional(),
  order_index: z.number().int().min(0).optional(),
});

export const updatePlanDaySchema = createPlanDaySchema.partial();

export const addExerciseToDaySchema = z.object({
  exercise_id: z.string().uuid('exercise_id must be a valid UUID'),
  sets: z.number().int().min(1).max(20).optional(),
  reps_min: z.number().int().min(1).max(100).optional(),
  reps_max: z.number().int().min(1).max(100).optional(),
  rest_seconds: z.number().int().min(0).max(600).default(90),
  order_index: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePlanExerciseSchema = addExerciseToDaySchema.omit({ exercise_id: true }).partial();
