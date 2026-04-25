import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import * as aiService from '../services/ai.service';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const notFound = (res: Response, err: unknown) => {
  const e = err as Error & { code?: string };
  if (e.code === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', e.message);
  throw err;
};

const createConversationSchema = z.object({
  context_type: z.enum(['general', 'workout_analysis', 'nutrition_advice', 'progress_review']).default('general'),
  title: z.string().max(200).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

const insightsSchema = z.object({
  period: z.enum(['week', 'month']).default('week'),
});

// ─── Conversations ────────────────────────────────────────────────────────────

router.get('/conversations', async (req: Request, res: Response) => {
  const conversations = await aiService.listConversations(req.user!.id);
  return sendSuccess(res, conversations);
});

router.post('/conversations', async (req: Request, res: Response) => {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }
  const conversation = await aiService.createConversation(req.user!.id, parsed.data);
  return sendSuccess(res, conversation, undefined, 201);
});

router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const conv = await aiService.getConversationMessages(req.params.id as string, req.user!.id);
    return sendSuccess(res, conv);
  } catch (err) { return notFound(res, err); }
});

router.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    await aiService.deleteConversation(req.params.id as string, req.user!.id);
    return sendSuccess(res, { message: 'Conversation deleted' });
  } catch (err) { return notFound(res, err); }
});

// ─── Streaming message ────────────────────────────────────────────────────────

router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', parsed.error.errors[0]?.message ?? 'Validation error');
  }

  try {
    await aiService.streamMessage(req.params.id as string, req.user!.id, parsed.data.content, res);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'NOT_FOUND') return sendError(res, 404, 'NOT_FOUND', e.message);
    if (!res.headersSent) {
      return sendError(res, 503, 'INTERNAL_ERROR', 'AI service unavailable. Please try again.');
    }
  }
});

// ─── Analyze food image ───────────────────────────────────────────────────────

const analyzeFoodSchema = z.object({
  image: z.string().min(1),
});

router.post('/analyze-food', async (req: Request, res: Response) => {
  if (!process.env.GROQ_API_KEY) {
    return sendError(res, 503, 'SERVICE_UNAVAILABLE', 'AI chưa được cấu hình');
  }
  const parsed = analyzeFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'image là bắt buộc');
  }
  try {
    const result = await aiService.analyzeFoodImage(parsed.data.image);
    return sendSuccess(res, result);
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'ANALYSIS_FAILED') {
      return sendError(res, 422, 'ANALYSIS_FAILED', e.message);
    }
    return sendError(res, 503, 'AI_ERROR', 'Không thể phân tích ảnh, vui lòng thử lại');
  }
});

// ─── Insights ─────────────────────────────────────────────────────────────────

router.get('/insights', async (req: Request, res: Response) => {
  const parsed = insightsSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'period must be "week" or "month"');
  }
  const insights = await aiService.getInsights(req.user!.id, parsed.data.period);
  return sendSuccess(res, insights);
});

export default router;
