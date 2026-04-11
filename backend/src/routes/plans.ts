import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendError } from '../utils/response';
import * as plansService from '../services/plans.service';
import {
  createPlanSchema,
  updatePlanSchema,
  createPlanDaySchema,
  updatePlanDaySchema,
  addExerciseToDaySchema,
  updatePlanExerciseSchema,
} from '../validators/plans.validators';

const router = Router();
router.use(authenticate);

const handleNotFound = (res: Response, err: unknown) => {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', e.message);
  throw err;
};

// ─── Plans ────────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  const plans = await plansService.listPlans(req.user!.id);
  return sendSuccess(res, plans);
});

router.post('/', validate(createPlanSchema), async (req: Request, res: Response) => {
  const plan = await plansService.createPlan(req.user!.id, req.body);
  return sendSuccess(res, plan, undefined, 201);
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plan = await plansService.getPlan(req.params.id as string, req.user!.id);
    return sendSuccess(res, plan);
  } catch (err) { return handleNotFound(res, err); }
});

router.put('/:id', validate(updatePlanSchema), async (req: Request, res: Response) => {
  try {
    const plan = await plansService.updatePlan(req.params.id as string, req.user!.id, req.body);
    return sendSuccess(res, plan);
  } catch (err) { return handleNotFound(res, err); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await plansService.deletePlan(req.params.id as string, req.user!.id);
    return sendSuccess(res, { message: 'Plan deleted' });
  } catch (err) { return handleNotFound(res, err); }
});

router.post('/:id/activate', async (req: Request, res: Response) => {
  try {
    const plan = await plansService.activatePlan(req.params.id as string, req.user!.id);
    return sendSuccess(res, plan);
  } catch (err) { return handleNotFound(res, err); }
});

router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const plan = await plansService.duplicatePlan(req.params.id as string, req.user!.id);
    return sendSuccess(res, plan, undefined, 201);
  } catch (err) { return handleNotFound(res, err); }
});

// ─── Plan Days ────────────────────────────────────────────────────────────────

router.post('/:id/days', validate(createPlanDaySchema), async (req: Request, res: Response) => {
  try {
    const day = await plansService.addPlanDay(req.params.id as string, req.user!.id, req.body);
    return sendSuccess(res, day, undefined, 201);
  } catch (err) { return handleNotFound(res, err); }
});

router.put('/:id/days/:dayId', validate(updatePlanDaySchema), async (req: Request, res: Response) => {
  try {
    const day = await plansService.updatePlanDay(
      req.params.id as string, req.params.dayId as string, req.user!.id, req.body,
    );
    return sendSuccess(res, day);
  } catch (err) { return handleNotFound(res, err); }
});

router.delete('/:id/days/:dayId', async (req: Request, res: Response) => {
  try {
    await plansService.deletePlanDay(req.params.id as string, req.params.dayId as string, req.user!.id);
    return sendSuccess(res, { message: 'Day deleted' });
  } catch (err) { return handleNotFound(res, err); }
});

// ─── Plan Exercises ───────────────────────────────────────────────────────────

router.post(
  '/:id/days/:dayId/exercises',
  validate(addExerciseToDaySchema),
  async (req: Request, res: Response) => {
    try {
      const pe = await plansService.addExerciseToDay(
        req.params.id as string, req.params.dayId as string, req.user!.id, req.body,
      );
      return sendSuccess(res, pe, undefined, 201);
    } catch (err) { return handleNotFound(res, err); }
  },
);

router.put(
  '/:id/days/:dayId/exercises/:exId',
  validate(updatePlanExerciseSchema),
  async (req: Request, res: Response) => {
    try {
      const pe = await plansService.updatePlanExercise(
        req.params.id as string, req.params.dayId as string,
        req.params.exId as string, req.user!.id, req.body,
      );
      return sendSuccess(res, pe);
    } catch (err) { return handleNotFound(res, err); }
  },
);

router.delete(
  '/:id/days/:dayId/exercises/:exId',
  async (req: Request, res: Response) => {
    try {
      await plansService.removePlanExercise(
        req.params.id as string, req.params.dayId as string,
        req.params.exId as string, req.user!.id,
      );
      return sendSuccess(res, { message: 'Exercise removed' });
    } catch (err) { return handleNotFound(res, err); }
  },
);

export default router;
