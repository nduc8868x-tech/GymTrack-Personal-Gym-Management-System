export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body',
] as const;

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other',
] as const;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const DEFAULT_REST_SECONDS = 90;

export const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
