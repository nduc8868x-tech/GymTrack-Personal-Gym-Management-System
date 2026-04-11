import { Router, Request, Response } from 'express';
import passport from '../config/passport';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { sendSuccess, sendError } from '../utils/response';
import * as authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  updateSettingsSchema,
  onboardingSchema,
} from '../validators/auth.validators';
import { env } from '../config/env';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name: string;
    };
    const { user, accessToken, refreshToken } = await authService.register(email, password, name);

    res.cookie('refresh_token', refreshToken, COOKIE_OPTS);

    return sendSuccess(
      res,
      {
        access_token: accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      },
      undefined,
      201,
    );
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'EMAIL_EXISTS') {
      return sendError(res, 409, 'EMAIL_EXISTS', 'Email already in use');
    }
    throw err;
  }
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    res.cookie('refresh_token', refreshToken, COOKIE_OPTS);

    return sendSuccess(res, {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'INVALID_CREDENTIALS') {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    throw err;
  }
});

// ─── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.refresh_token as string | undefined;
  if (rawRefreshToken) {
    await authService.logout(rawRefreshToken);
  }
  res.clearCookie('refresh_token');
  return sendSuccess(res, { message: 'Logged out' });
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.refresh_token as string | undefined;
  if (!rawRefreshToken) {
    return sendError(res, 401, 'MISSING_TOKEN', 'Refresh token required');
  }

  try {
    const { accessToken, refreshToken } = await authService.refresh(rawRefreshToken);
    res.cookie('refresh_token', refreshToken, COOKIE_OPTS);
    return sendSuccess(res, { access_token: accessToken });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'INVALID_TOKEN') {
      res.clearCookie('refresh_token');
      return sendError(res, 401, 'INVALID_TOKEN', 'Invalid or expired refresh token');
    }
    throw err;
  }
});

// ─── POST /auth/forgot-password ───────────────────────────────────────────────
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  // Always 200 to prevent enumeration
  return sendSuccess(res, { message: 'If that email exists, a reset link has been sent' });
});

// ─── POST /auth/reset-password ────────────────────────────────────────────────
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    return sendSuccess(res, { message: 'Password updated successfully' });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'INVALID_TOKEN') {
      return sendError(res, 400, 'INVALID_TOKEN', 'Reset token is invalid or expired');
    }
    throw err;
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return sendSuccess(res, user);
});

// ─── PUT /auth/profile ────────────────────────────────────────────────────────
router.put('/profile', authenticate, validate(updateProfileSchema), async (req: Request, res: Response) => {
  const updated = await authService.updateProfile(req.user!.id, req.body);
  return sendSuccess(res, updated);
});

// ─── PUT /auth/settings ───────────────────────────────────────────────────────
router.put('/settings', authenticate, validate(updateSettingsSchema), async (req: Request, res: Response) => {
  const settings = await authService.updateSettings(req.user!.id, req.body);
  return sendSuccess(res, settings);
});

// ─── POST /auth/onboarding ────────────────────────────────────────────────────
router.post('/onboarding', authenticate, validate(onboardingSchema), async (req: Request, res: Response) => {
  const result = await authService.completeOnboarding(req.user!.id, req.body);
  return sendSuccess(res, result);
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────
router.get(
  '/google',
  passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed` }),
  (req: Request, res: Response) => {
    const oauthUser = req.user;

    if (!oauthUser?.accessToken || !oauthUser?.refreshToken) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    res.cookie('refresh_token', oauthUser.refreshToken, COOKIE_OPTS);
    return res.redirect(`${env.FRONTEND_URL}/google/callback?token=${encodeURIComponent(oauthUser.accessToken)}`);
  },
);

export default router;
