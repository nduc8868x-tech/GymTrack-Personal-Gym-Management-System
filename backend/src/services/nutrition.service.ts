import axios from 'axios';
import { prisma } from '../config/database';

// ─── Nutrition Plan ───────────────────────────────────────────────────────────

export async function getActivePlan(userId: string) {
  return prisma.nutritionPlan.findFirst({
    where: { user_id: userId, is_active: true },
    orderBy: { created_at: 'desc' },
  });
}

export async function listPlans(userId: string) {
  return prisma.nutritionPlan.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
}

export async function createPlan(
  userId: string,
  data: {
    name?: string;
    daily_calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    start_date?: string;
    end_date?: string;
  },
) {
  // Deactivate existing active plan
  await prisma.nutritionPlan.updateMany({
    where: { user_id: userId, is_active: true },
    data: { is_active: false },
  });

  return prisma.nutritionPlan.create({
    data: {
      user_id: userId,
      name: data.name,
      daily_calories: data.daily_calories,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fat_g: data.fat_g,
      is_active: true,
      start_date: data.start_date ? new Date(data.start_date) : undefined,
      end_date: data.end_date ? new Date(data.end_date) : undefined,
    },
  });
}

export async function updatePlan(
  planId: string,
  userId: string,
  data: Partial<{
    name: string;
    daily_calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    start_date: string;
    end_date: string;
  }>,
) {
  const plan = await prisma.nutritionPlan.findFirst({ where: { id: planId, user_id: userId } });
  if (!plan) {
    const err = new Error('Plan not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  return prisma.nutritionPlan.update({
    where: { id: planId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.daily_calories !== undefined && { daily_calories: data.daily_calories }),
      ...(data.protein_g !== undefined && { protein_g: data.protein_g }),
      ...(data.carbs_g !== undefined && { carbs_g: data.carbs_g }),
      ...(data.fat_g !== undefined && { fat_g: data.fat_g }),
      ...(data.start_date && { start_date: new Date(data.start_date) }),
      ...(data.end_date && { end_date: new Date(data.end_date) }),
    },
  });
}

// ─── Food Search ──────────────────────────────────────────────────────────────

interface OFFProduct {
  id: string;
  product_name: string;
  brands: string;
  nutriments: {
    'energy-kcal_100g'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
  serving_size?: string;
}

function mapOFFProduct(p: OFFProduct) {
  return {
    id: `off:${p.id}`,
    name: p.product_name || 'Unknown',
    brand: p.brands || null,
    calories_per100g: p.nutriments?.['energy-kcal_100g'] ?? 0,
    protein_per100g: p.nutriments?.proteins_100g ?? 0,
    carbs_per100g: p.nutriments?.carbohydrates_100g ?? 0,
    fat_per100g: p.nutriments?.fat_100g ?? 0,
    fiber_per100g: p.nutriments?.fiber_100g ?? 0,
    serving_size_g: null,
    is_custom: false,
    source: 'open_food_facts' as const,
  };
}

// Simple in-memory cache for Open Food Facts results (keyed by query)
const offCache = new Map<string, { data: ReturnType<typeof mapOFFProduct>[]; ts: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function searchFoods(userId: string, query: string, limit: number) {
  // 1. Search custom foods in DB first
  const customFoods = await prisma.food.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' },
      OR: [{ is_custom: false }, { created_by: userId }],
    },
    take: Math.min(limit, 10),
  });

  const customMapped = customFoods.map((f) => ({
    id: f.id,
    name: f.name,
    brand: f.brand,
    calories_per100g: f.calories_per100g,
    protein_per100g: f.protein_per100g,
    carbs_per100g: f.carbs_per100g,
    fat_per100g: f.fat_per100g,
    fiber_per100g: f.fiber_per100g,
    serving_size_g: f.serving_size_g,
    is_custom: f.is_custom,
    source: 'database' as const,
  }));

  // 2. Search Open Food Facts
  const cacheKey = `${query}:${limit}`;
  const cached = offCache.get(cacheKey);
  let offResults: ReturnType<typeof mapOFFProduct>[] = [];

  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    offResults = cached.data;
  } else {
    try {
      const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
        params: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: limit,
          fields: 'id,product_name,brands,nutriments,serving_size',
        },
        timeout: 5000,
      });

      const products: OFFProduct[] = res.data?.products ?? [];
      offResults = products
        .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
        .map(mapOFFProduct);

      offCache.set(cacheKey, { data: offResults, ts: Date.now() });
    } catch {
      // Open Food Facts unavailable — return only DB results
      offResults = [];
    }
  }

  // Merge: DB results first, then OFF, dedup by name+brand
  const seen = new Set(customMapped.map((f) => f.name.toLowerCase()));
  const merged = [
    ...customMapped,
    ...offResults.filter((f) => !seen.has(f.name.toLowerCase())),
  ].slice(0, limit);

  return merged;
}

export async function createCustomFood(
  userId: string,
  data: {
    name: string;
    brand?: string;
    calories_per100g: number;
    protein_per100g: number;
    carbs_per100g: number;
    fat_per100g: number;
    fiber_per100g: number;
    serving_size_g?: number;
    serving_unit?: string;
  },
) {
  return prisma.food.create({
    data: {
      name: data.name,
      brand: data.brand,
      calories_per100g: data.calories_per100g,
      protein_per100g: data.protein_per100g,
      carbs_per100g: data.carbs_per100g,
      fat_per100g: data.fat_per100g,
      fiber_per100g: data.fiber_per100g,
      serving_size_g: data.serving_size_g,
      serving_unit: data.serving_unit,
      is_custom: true,
      created_by: userId,
    },
  });
}

// ─── Food Logs ────────────────────────────────────────────────────────────────

export async function getFoodLogs(userId: string, date: string) {
  const logs = await prisma.foodLog.findMany({
    where: {
      user_id: userId,
      logged_at: new Date(date),
    },
    orderBy: { created_at: 'asc' },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          brand: true,
          calories_per100g: true,
          protein_per100g: true,
          carbs_per100g: true,
          fat_per100g: true,
          fiber_per100g: true,
          serving_size_g: true,
          serving_unit: true,
        },
      },
    },
  });

  // Calculate macros per log entry
  return logs.map((log) => {
    const ratio = log.quantity_g / 100;
    return {
      ...log,
      macros: {
        calories: Math.round(log.food.calories_per100g * ratio),
        protein_g: Math.round(log.food.protein_per100g * ratio * 10) / 10,
        carbs_g: Math.round(log.food.carbs_per100g * ratio * 10) / 10,
        fat_g: Math.round(log.food.fat_per100g * ratio * 10) / 10,
        fiber_g: Math.round(log.food.fiber_per100g * ratio * 10) / 10,
      },
    };
  });
}

export async function createFoodLog(
  userId: string,
  data: {
    food_id: string;
    logged_at: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    quantity_g: number;
  },
) {
  // Verify food exists in DB (not an OFF id)
  const food = await prisma.food.findFirst({
    where: {
      id: data.food_id,
      OR: [{ is_custom: false }, { created_by: userId }],
    },
  });
  if (!food) {
    const err = new Error('Food not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }

  return prisma.foodLog.create({
    data: {
      user_id: userId,
      food_id: data.food_id,
      logged_at: new Date(data.logged_at),
      meal_type: data.meal_type,
      quantity_g: data.quantity_g,
    },
    include: {
      food: {
        select: {
          id: true,
          name: true,
          brand: true,
          calories_per100g: true,
          protein_per100g: true,
          carbs_per100g: true,
          fat_per100g: true,
        },
      },
    },
  });
}

export async function deleteFoodLog(logId: string, userId: string) {
  const log = await prisma.foodLog.findFirst({ where: { id: logId, user_id: userId } });
  if (!log) {
    const err = new Error('Log entry not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  await prisma.foodLog.delete({ where: { id: logId } });
}
