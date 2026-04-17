import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendError } from '../utils/response';
import * as scheduleService from '../services/schedule.service';
import {
  listScheduleSchema,
  createScheduleSchema,
  updateScheduleSchema,
  addScheduledExerciseSchema,
  updateScheduledExerciseSchema,
  todayScheduleSchema,
} from '../validators/schedule.validators';

const router = Router();
router.use(authenticate);

const handleNotFound = (res: Response, err: unknown) => {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', e.message);
  throw err;
};

// GET /schedule/today — must be before /:id
router.get('/today', validate(todayScheduleSchema, 'query'), async (req: Request, res: Response) => {
  const { date } = req.query as { date?: string };
  const schedules = await scheduleService.getTodaySchedule(req.user!.id, date);
  return sendSuccess(res, schedules);
});

router.get('/', validate(listScheduleSchema, 'query'), async (req: Request, res: Response) => {
  const q = req.query as unknown as { from: string; to: string };
  const schedules = await scheduleService.listSchedule(req.user!.id, q.from, q.to);
  return sendSuccess(res, schedules);
});

router.post('/', validate(createScheduleSchema), async (req: Request, res: Response) => {
  try {
    const schedule = await scheduleService.createSchedule(req.user!.id, req.body);
    return sendSuccess(res, schedule, undefined, 201);
  } catch (err) { return handleNotFound(res, err); }
});

router.put('/:id', validate(updateScheduleSchema), async (req: Request, res: Response) => {
  try {
    const schedule = await scheduleService.updateSchedule(
      req.params.id as string, req.user!.id, req.body,
    );
    return sendSuccess(res, schedule);
  } catch (err) { return handleNotFound(res, err); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await scheduleService.deleteSchedule(req.params.id as string, req.user!.id);
    return sendSuccess(res, { message: 'Scheduled workout deleted' });
  } catch (err) { return handleNotFound(res, err); }
});

// ─── Scheduled Exercises ──────────────────────────────────────────────────────

router.post('/:id/exercises', validate(addScheduledExerciseSchema), async (req: Request, res: Response) => {
  try {
    const entry = await scheduleService.addScheduledExercise(
      req.params.id as string, req.user!.id, req.body,
    );
    return sendSuccess(res, entry, undefined, 201);
  } catch (err) { return handleNotFound(res, err); }
});

router.put('/:id/exercises/:entryId', validate(updateScheduledExerciseSchema), async (req: Request, res: Response) => {
  try {
    const entry = await scheduleService.updateScheduledExercise(
      req.params.id as string, req.params.entryId as string, req.user!.id, req.body,
    );
    return sendSuccess(res, entry);
  } catch (err) { return handleNotFound(res, err); }
});

router.delete('/:id/exercises/:entryId', async (req: Request, res: Response) => {
  try {
    await scheduleService.removeScheduledExercise(
      req.params.id as string, req.params.entryId as string, req.user!.id,
    );
    return sendSuccess(res, { message: 'Scheduled exercise removed' });
  } catch (err) { return handleNotFound(res, err); }
});

export default router;
