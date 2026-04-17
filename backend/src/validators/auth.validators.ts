import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD').optional(),
  height_cm: z.number().positive().max(300).optional(),
  avatar_url: z.string().url().optional(),
});

export const updateSettingsSchema = z.object({
  weight_unit: z.enum(['kg', 'lbs']).optional(),
  notifications_enabled: z.boolean().optional(),
  timezone: z.string().min(1).optional(),
});

export const onboardingSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  height_cm: z.number().positive().max(300).optional(),
  current_weight: z.number().positive().max(500).optional(),
  goal_type: z.enum(['muscle_gain', 'fat_loss', 'strength', 'general_health']).optional(),
  target_weight: z.number().positive().optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weight_unit: z.enum(['kg', 'lbs']).optional(),
  timezone: z.string().optional(),
});
