import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendError } from '../utils/response';
import * as workoutsService from '../services/workouts.service';
import {
  startSessionSchema,
  endSessionSchema,
  logSetSchema,
  updateSetSchema,
  listSessionsSchema,
} from '../validators/workouts.validators';

const router = Router();

router.use(authenticate);

// ─── GET /workouts/sessions ───────────────────────────────────────────────────
router.get(
  '/sessions',
  validate(listSessionsSchema, 'query'),
  async (req: Request, res: Response) => {
    const q = req.query as unknown as {
      from?: string;
      to?: string;
      limit: number;
      offset: number;
    };

    const result = await workoutsService.listSessions(req.user!.id, {
      from: q.from,
      to: q.to,
      limit: q.limit,
      offset: q.offset,
    });

    return sendSuccess(res, result.sessions, {
      total: result.total,
      limit: q.limit,
      offset: q.offset,
    });
  },
);

// ─── POST /workouts/sessions ──────────────────────────────────────────────────
router.post('/sessions', validate(startSessionSchema), async (req: Request, res: Response) => {
  const session = await workoutsService.startSession(req.user!.id, req.body);
  return sendSuccess(res, session, undefined, 201);
});

// ─── GET /workouts/sessions/:id ───────────────────────────────────────────────
router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const session = await workoutsService.getSession(req.params.id as string, req.user!.id);
    return sendSuccess(res, session);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Session not found');
    }
    throw err;
  }
});

// ─── PUT /workouts/sessions/:id ───────────────────────────────────────────────
router.put('/sessions/:id', validate(endSessionSchema), async (req: Request, res: Response) => {
  try {
    const session = await workoutsService.endSession(req.params.id as string, req.user!.id, req.body);
    return sendSuccess(res, session);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Session not found');
    }
    throw err;
  }
});

// ─── POST /workouts/sessions/:id/sets ─────────────────────────────────────────
router.post(
  '/sessions/:id/sets',
  validate(logSetSchema),
  async (req: Request, res: Response) => {
    try {
      const set = await workoutsService.logSet(req.params.id as string, req.user!.id, req.body);
      return sendSuccess(res, set, undefined, 201);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'NOT_FOUND') {
        return sendError(res, 404, 'NOT_FOUND', e.message);
      }
      if (e.code === 'SESSION_ENDED') {
        return sendError(res, 400, 'SESSION_ENDED', 'Session already ended');
      }
      throw err;
    }
  },
);

// ─── PUT /workouts/sessions/:id/sets/:setId ────────────────────────────────────
router.put(
  '/sessions/:id/sets/:setId',
  validate(updateSetSchema),
  async (req: Request, res: Response) => {
    try {
      const set = await workoutsService.updateSet(
        req.params.id as string,
        req.params.setId as string,
        req.user!.id,
        req.body,
      );
      return sendSuccess(res, set);
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'NOT_FOUND') {
        return sendError(res, 404, 'NOT_FOUND', e.message);
      }
      throw err;
    }
  },
);

// ─── DELETE /workouts/sessions/:id/sets/:setId ────────────────────────────────
router.delete('/sessions/:id/sets/:setId', async (req: Request, res: Response) => {
  try {
    await workoutsService.deleteSet(req.params.id as string, req.params.setId as string, req.user!.id);
    return sendSuccess(res, { message: 'Set deleted' });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', e.message);
    }
    if (e.code === 'SESSION_ENDED') {
      return sendError(res, 400, 'SESSION_ENDED', 'Cannot delete sets from a completed session');
    }
    throw err;
  }
});

export default router;
