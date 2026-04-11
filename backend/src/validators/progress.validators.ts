import { z } from 'zod';

export const createMeasurementSchema = z.object({
  measured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'measured_at must be YYYY-MM-DD'),
  weight_kg: z.number().positive().max(500).optional(),
  body_fat_pct: z.number().min(0).max(100).optional(),
  chest_cm: z.number().positive().max(300).optional(),
  waist_cm: z.number().positive().max(300).optional(),
  hips_cm: z.number().positive().max(300).optional(),
  left_arm_cm: z.number().positive().max(100).optional(),
  right_arm_cm: z.number().positive().max(100).optional(),
  left_thigh_cm: z.number().positive().max(200).optional(),
  right_thigh_cm: z.number().positive().max(200).optional(),
  photo_url: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export const listMeasurementsSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const chartsQuerySchema = z.object({
  type: z.enum(['weight', 'volume', 'strength']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  exercise_id: z.string().uuid().optional(), // for strength type
});
