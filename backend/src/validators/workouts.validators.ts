import { z } from 'zod';

export const startSessionSchema = z.object({
  name: z.string().max(200).optional(),
  plan_day_id: z.string().uuid().optional(),
  scheduled_id: z.string().uuid().optional(),
  started_at: z.string().datetime().optional(), // defaults to now if omitted
});

export const endSessionSchema = z.object({
  ended_at: z.string().datetime().optional(),
  notes: z.string().max(1000).optional(),
});

export const logSetSchema = z.object({
  exercise_id: z.string().uuid('exercise_id must be a valid UUID'),
  set_number: z.number().int().min(1),
  reps: z.number().int().min(1).optional(),
  weight_kg: z.number().min(0).optional(),
  duration_seconds: z.number().int().min(1).optional(),
}).refine(
  (d) => d.reps !== undefined || d.duration_seconds !== undefined,
  { message: 'Either reps or duration_seconds must be provided' },
);

export const updateSetSchema = z.object({
  reps: z.number().int().min(1).optional(),
  weight_kg: z.number().min(0).optional(),
  duration_seconds: z.number().int().min(1).optional(),
});

export const listSessionsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
