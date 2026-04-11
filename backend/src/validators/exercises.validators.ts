import { z } from 'zod';

export const listExercisesSchema = z.object({
  search: z.string().optional(),
  muscle: z
    .enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'])
    .optional(),
  equipment: z
    .enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const createExerciseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  primary_muscle: z.enum([
    'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body',
  ]),
  equipment: z.enum(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other']),
  description: z.string().max(1000).optional(),
  video_url: z.string().url().optional(),
  image_url: z.string().url().optional(),
});
