import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return sendError(res, 422, 'VALIDATION_ERROR', err.errors[0]?.message || 'Validation failed');
  }

  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'INVALID_TOKEN', 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Token expired');
  }

  console.error(err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
};
