import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export const validate =
  (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return sendError(
        res,
        422,
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'Validation failed',
      );
    }
    req[source] = result.data;
    return next();
  };
