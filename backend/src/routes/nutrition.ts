import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import * as nutritionService from '../services/nutrition.service';
import {
  createNutritionPlanSchema,
  updateNutritionPlanSchema,
  createFoodLogSchema,
  createCustomFoodSchema,
  foodSearchSchema,
} from '../validators/nutrition.validators';

const router = Router();
router.use(authenticate);

const notFound = (res: Response, err: unknown) => {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', e.message);
  throw err;
};

// ─── Nutrition Plans ──────────────────────────────────────────────────────────

router.get('/plan', async (req: Request, res: Response) => {
  const plan = await nutritionService.getActivePlan(req.user!.id);
  return sendSuccess(res, plan);
});

router.get('/plans', async (req: Request, res: Response) => {
  const plans = await nutritionService.listPlans(req.user!.id);
  return sendSuccess(res, plans);
});

router.post('/plan', async (req: Request, res: Response) => {
  const parsed = createNutritionPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  const plan = await nutritionService.createPlan(req.user!.id, parsed.data);
  return sendSuccess(res, plan, undefined, 201);
});

router.put('/plan/:id', async (req: Request, res: Response) => {
  const parsed = updateNutritionPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  try {
    const plan = await nutritionService.updatePlan(req.params.id as string, req.user!.id, parsed.data);
    return sendSuccess(res, plan);
  } catch (err) { return notFound(res, err); }
});

// ─── Food Search ──────────────────────────────────────────────────────────────

router.get('/foods/search', async (req: Request, res: Response) => {
  const parsed = foodSearchSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid query');
  }
  const results = await nutritionService.searchFoods(req.user!.id, parsed.data.q, parsed.data.limit);
  return sendSuccess(res, results);
});

router.post('/foods', async (req: Request, res: Response) => {
  const parsed = createCustomFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  const food = await nutritionService.createCustomFood(req.user!.id, parsed.data);
  return sendSuccess(res, food, undefined, 201);
});

// ─── Food Logs ────────────────────────────────────────────────────────────────

router.get('/logs', async (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  }
  const logs = await nutritionService.getFoodLogs(req.user!.id, date);
  return sendSuccess(res, logs);
});

router.post('/logs', async (req: Request, res: Response) => {
  const parsed = createFoodLogSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  try {
    const log = await nutritionService.createFoodLog(req.user!.id, parsed.data);
    return sendSuccess(res, log, undefined, 201);
  } catch (err) { return notFound(res, err); }
});

router.delete('/logs/:id', async (req: Request, res: Response) => {
  try {
    await nutritionService.deleteFoodLog(req.params.id as string, req.user!.id);
    return sendSuccess(res, { message: 'Log entry deleted' });
  } catch (err) { return notFound(res, err); }
});

export default router;
