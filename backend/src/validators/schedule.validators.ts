import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const listScheduleSchema = z.object({
  from: z.string().regex(dateRegex, 'Use format YYYY-MM-DD'),
  to: z.string().regex(dateRegex, 'Use format YYYY-MM-DD'),
});

export const createScheduleSchema = z.object({
  name: z.string().max(200).optional(),
  plan_day_id: z.string().uuid().optional(),
  scheduled_date: z.string().regex(dateRegex, 'Use format YYYY-MM-DD'),
  scheduled_time: z.string().regex(timeRegex, 'Use format HH:MM').optional(),
});

export const updateScheduleSchema = z.object({
  name: z.string().max(200).optional(),
  scheduled_date: z.string().regex(dateRegex).optional(),
  scheduled_time: z.string().regex(timeRegex).optional(),
  is_completed: z.boolean().optional(),
});

export const addScheduledExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z.number().int().min(1).max(20).default(3),
  reps: z.number().int().min(1).max(100).default(10),
  weight_kg: z.number().min(0).max(1000).optional(),
  order_index: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const updateScheduledExerciseSchema = z.object({
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.number().int().min(1).max(100).optional(),
  weight_kg: z.number().min(0).max(1000).optional(),
  order_index: z.number().int().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const todayScheduleSchema = z.object({
  date: z.string().regex(dateRegex, 'Use format YYYY-MM-DD').optional(),
});
