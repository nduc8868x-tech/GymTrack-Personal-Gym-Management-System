import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess, sendError } from '../utils/response';
import * as exercisesService from '../services/exercises.service';
import * as imagekitService from '../services/imagekit.service';
import {
  listExercisesSchema,
  createExerciseSchema,
} from '../validators/exercises.validators';

const router = Router();

// Multer: store file in memory (max 5MB, images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// All routes require auth
router.use(authenticate);

// ─── GET /exercises ───────────────────────────────────────────────────────────
router.get('/', validate(listExercisesSchema, 'query'), async (req: Request, res: Response) => {
  // req.query is replaced by validated+coerced data from the validate middleware
  const q = req.query as unknown as {
    search?: string;
    muscle?: string;
    equipment?: string;
    limit: number;
    offset: number;
  };

  const result = await exercisesService.listExercises(req.user!.id, {
    search: q.search,
    muscle: q.muscle as never,
    equipment: q.equipment as never,
    limit: q.limit,
    offset: q.offset,
  });

  return sendSuccess(res, result.exercises, {
    total: result.total,
    limit: q.limit,
    offset: q.offset,
  });
});

// ─── GET /exercises/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const exercise = await exercisesService.getExercise(req.params.id as string, req.user!.id);
    return sendSuccess(res, exercise);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Exercise not found');
    }
    throw err;
  }
});

// ─── POST /exercises ──────────────────────────────────────────────────────────
router.post('/', validate(createExerciseSchema), async (req: Request, res: Response) => {
  const exercise = await exercisesService.createCustomExercise(req.user!.id, req.body);
  return sendSuccess(res, exercise, undefined, 201);
});

// ─── DELETE /exercises/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await exercisesService.deleteCustomExercise(req.params.id as string, req.user!.id);
    return sendSuccess(res, { message: 'Exercise deleted' });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Exercise not found or not deletable');
    }
    throw err;
  }
});

// ─── POST /exercises/:id/image ────────────────────────────────────────────────
// Upload ảnh bài tập lên ImageKit. Chấp nhận cả exercise system và custom.
router.post('/:id/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'NO_FILE', 'No image file uploaded (field name: image)');
    }

    // Verify exercise exists and user can access it
    const exercise = await exercisesService.getExercise(req.params.id as string, req.user!.id);

    // Upload to ImageKit
    const { url } = await imagekitService.uploadExerciseImage(
      exercise.id,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
    );

    // Save URL to database
    await exercisesService.updateExerciseImage(exercise.id, url);

    return sendSuccess(res, { image_url: url });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Exercise not found');
    }
    if (e.message?.includes('ImageKit is not configured')) {
      return sendError(res, 503, 'IMAGEKIT_NOT_CONFIGURED', e.message);
    }
    throw err;
  }
});

// ─── DELETE /exercises/:id/image ──────────────────────────────────────────────
// Xóa ảnh bài tập khỏi ImageKit và database.
router.delete('/:id/image', async (req: Request, res: Response) => {
  try {
    const exercise = await exercisesService.getExercise(req.params.id as string, req.user!.id);

    if (!exercise.image_url) {
      return sendError(res, 404, 'NO_IMAGE', 'Exercise has no image');
    }

    // Try to delete from ImageKit (non-fatal if fails)
    try {
      const fileId = await imagekitService.findFileIdByUrl(exercise.id, exercise.image_url);
      if (fileId) {
        await imagekitService.deleteImageByFileId(fileId);
      }
    } catch {
      // Log but don't fail if ImageKit deletion fails
      console.warn(`Could not delete ImageKit file for exercise ${exercise.id}`);
    }

    // Remove URL from database
    await exercisesService.removeExerciseImage(exercise.id);

    return sendSuccess(res, { message: 'Image deleted' });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') {
      return sendError(res, 404, 'NOT_FOUND', 'Exercise not found');
    }
    throw err;
  }
});

export default router;
