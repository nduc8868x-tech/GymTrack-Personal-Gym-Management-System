import { z } from 'zod';

export const createNutritionPlanSchema = z.object({
  name: z.string().max(100).optional(),
  daily_calories: z.number().int().min(500).max(10000),
  protein_g: z.number().int().min(0).max(1000),
  carbs_g: z.number().int().min(0).max(2000),
  fat_g: z.number().int().min(0).max(1000),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const updateNutritionPlanSchema = createNutritionPlanSchema.partial();

export const createFoodLogSchema = z.object({
  food_id: z.string().uuid('food_id must be a valid UUID'),
  logged_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'logged_at must be YYYY-MM-DD'),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  quantity_g: z.number().positive().max(5000),
});

export const createCustomFoodSchema = z.object({
  name: z.string().min(1).max(200),
  brand: z.string().max(100).optional(),
  calories_per100g: z.number().min(0).max(10000),
  protein_per100g: z.number().min(0).max(1000).default(0),
  carbs_per100g: z.number().min(0).max(1000).default(0),
  fat_per100g: z.number().min(0).max(1000).default(0),
  fiber_per100g: z.number().min(0).max(1000).default(0),
  serving_size_g: z.number().positive().optional(),
  serving_unit: z.string().max(50).optional(),
});

export const foodSearchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
