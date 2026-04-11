import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { sendSuccess } from '../utils/response';
import * as notificationsService from '../services/notifications.service';

const router = Router();
router.use(authenticate);

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

router.post('/subscribe', validate(subscribeSchema), async (req: Request, res: Response) => {
  const sub = await notificationsService.subscribe(
    req.user!.id,
    req.body,
    req.headers['user-agent'],
  );
  return sendSuccess(res, sub, undefined, 201);
});

router.delete('/subscribe', validate(unsubscribeSchema), async (req: Request, res: Response) => {
  await notificationsService.unsubscribe(req.user!.id, req.body.endpoint);
  return sendSuccess(res, { message: 'Unsubscribed' });
});

export default router;
