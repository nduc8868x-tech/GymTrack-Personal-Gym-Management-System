import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import { getImageKitAuthParams } from '../config/imagekit';
import * as progressService from '../services/progress.service';
import {
  createMeasurementSchema,
  listMeasurementsSchema,
  chartsQuerySchema,
} from '../validators/progress.validators';

const router = Router();
router.use(authenticate);

// ─── Measurements ─────────────────────────────────────────────────────────────

router.get('/measurements', async (req: Request, res: Response) => {
  const parsed = listMeasurementsSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid query');
  }
  const { measurements, total } = await progressService.listMeasurements(req.user!.id, parsed.data);
  return sendSuccess(res, measurements, { total, limit: parsed.data.limit, offset: parsed.data.offset });
});

router.post('/measurements', async (req: Request, res: Response) => {
  const parsed = createMeasurementSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  const measurement = await progressService.createMeasurement(req.user!.id, parsed.data);
  return sendSuccess(res, measurement, undefined, 201);
});

// ─── Charts ───────────────────────────────────────────────────────────────────

router.get('/charts', async (req: Request, res: Response) => {
  const parsed = chartsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Invalid query');
  }
  const { type, from, to, exercise_id } = parsed.data;

  let data;
  if (type === 'weight') {
    data = await progressService.getWeightChart(req.user!.id, from, to);
  } else if (type === 'volume') {
    data = await progressService.getVolumeChart(req.user!.id, from, to);
  } else {
    data = await progressService.getStrengthChart(req.user!.id, exercise_id, from, to);
  }

  return sendSuccess(res, data);
});

// ─── Personal Records ─────────────────────────────────────────────────────────

router.get('/records', async (req: Request, res: Response) => {
  const records = await progressService.getPersonalRecords(req.user!.id);
  return sendSuccess(res, records);
});

// ─── ImageKit auth params (for client-side photo upload) ─────────────────────

router.get('/imagekit-auth', (_req: Request, res: Response) => {
  const params = getImageKitAuthParams();
  if (!params) return sendError(res, 503, 'INTERNAL_ERROR', 'ImageKit is not configured');
  return sendSuccess(res, params);
});

export default router;
