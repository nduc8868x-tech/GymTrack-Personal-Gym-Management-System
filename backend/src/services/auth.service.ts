import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendWelcomeEmail } from './email.service';

// ─── Token helpers ────────────────────────────────────────────────────────────

const hashToken = (token: string) =>
  crypto.createHash('sha256').update(token).digest('hex');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function issueTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken({ userId, email });

  await prisma.refreshToken.create({
    data: {
      user_id: userId,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + REFRESH_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    (err as Error & { code: string }).code = 'EMAIL_EXISTS';
    throw err;
  }

  const password_hash = await hashPassword(password);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, password_hash, name, provider: 'local' },
      });
      await tx.userSettings.create({ data: { user_id: newUser.id } });
      return newUser;
    });
  } catch (err) {
    if ((err as { code?: string }).code === 'P2002') {
      const e = new Error('Email already in use');
      (e as Error & { code: string }).code = 'EMAIL_EXISTS';
      throw e;
    }
    throw err;
  }

  const tokens = await issueTokens(user.id, user.email);

  // Fire-and-forget welcome email
  sendWelcomeEmail(user.email, user.name).catch(() => {});

  return { user, ...tokens };
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password_hash) {
    const err = new Error('Invalid credentials');
    (err as Error & { code: string }).code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    (err as Error & { code: string }).code = 'INVALID_CREDENTIALS';
    throw err;
  }

  const tokens = await issueTokens(user.id, user.email);
  return { user, ...tokens };
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

export async function refresh(rawRefreshToken: string) {
  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken) as { userId: string; email: string };
  } catch {
    const err = new Error('Invalid refresh token');
    (err as Error & { code: string }).code = 'INVALID_TOKEN';
    throw err;
  }

  const tokenHash = hashToken(rawRefreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { user_id: payload.userId, token_hash: tokenHash },
  });

  if (!stored || stored.expires_at < new Date()) {
    const err = new Error('Refresh token expired or not found');
    (err as Error & { code: string }).code = 'INVALID_TOKEN';
    throw err;
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const tokens = await issueTokens(payload.userId, payload.email);

  return tokens;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(rawRefreshToken: string) {
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user || !user.password_hash) return;

  // Token signed with a secret that includes current password_hash → single-use
  const resetSecret = env.JWT_ACCESS_SECRET + user.password_hash;
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    resetSecret,
    { expiresIn: '1h' },
  );

  await sendPasswordResetEmail(user.email, user.name, resetToken);
}

// ─── Reset password ───────────────────────────────────────────────────────────

export async function resetPassword(token: string, newPassword: string) {
  // Decode without verify first to get userId
  const decoded = jwt.decode(token) as {
    userId?: string;
    type?: string;
  } | null;

  if (!decoded?.userId || decoded.type !== 'password_reset') {
    const err = new Error('Invalid reset token');
    (err as Error & { code: string }).code = 'INVALID_TOKEN';
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.password_hash) {
    const err = new Error('Invalid reset token');
    (err as Error & { code: string }).code = 'INVALID_TOKEN';
    throw err;
  }

  // Verify with combined secret (invalidates after password change)
  try {
    jwt.verify(token, env.JWT_ACCESS_SECRET + user.password_hash);
  } catch {
    const err = new Error('Reset token is invalid or expired');
    (err as Error & { code: string }).code = 'INVALID_TOKEN';
    throw err;
  }

  const password_hash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password_hash } }),
    prisma.refreshToken.deleteMany({ where: { user_id: user.id } }),
  ]);
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { user_settings: true, user_goals: { where: { is_active: true } } },
  });
  if (!user) {
    const err = new Error('User not found');
    (err as Error & { code: string }).code = 'NOT_FOUND';
    throw err;
  }
  const { password_hash, google_id, ...safeUser } = user;
  return safeUser;
}

// ─── Update profile ───────────────────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    gender?: 'male' | 'female' | 'other';
    birthdate?: string;
    height_cm?: number;
    avatar_url?: string;
  },
) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.gender && { gender: data.gender }),
      ...(data.birthdate && { birthdate: new Date(data.birthdate) }),
      ...(data.height_cm !== undefined && { height_cm: data.height_cm }),
      ...(data.avatar_url && { avatar_url: data.avatar_url }),
    },
  });
  const { password_hash, google_id, ...safeUser } = updated;
  return safeUser;
}

// ─── Update settings ──────────────────────────────────────────────────────────

export async function updateSettings(
  userId: string,
  data: {
    weight_unit?: 'kg' | 'lbs';
    notifications_enabled?: boolean;
    timezone?: string;
  },
) {
  const settings = await prisma.userSettings.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...data },
    update: data,
  });
  return settings;
}

// ─── Find or create Google user ───────────────────────────────────────────────

export async function findOrCreateGoogleUser(profile: {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}) {
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ google_id: profile.id }, { email: profile.email }],
    },
  });

  if (user) {
    // Link Google if not already linked
    if (!user.google_id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { google_id: profile.id, provider: 'google' },
      });
    }
  } else {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          google_id: profile.id,
          provider: 'google',
          avatar_url: profile.avatar_url,
        },
      });
      await tx.userSettings.create({ data: { user_id: newUser.id } });
      return newUser;
    });
  }

  const tokens = await issueTokens(user.id, user.email);
  return { user, ...tokens };
}

// ─── Complete onboarding ──────────────────────────────────────────────────────

export async function completeOnboarding(
  userId: string,
  data: {
    name?: string;
    gender?: 'male' | 'female' | 'other';
    birthdate?: string;
    height_cm?: number;
    current_weight?: number;
    goal_type?: 'muscle_gain' | 'fat_loss' | 'strength' | 'general_health';
    target_weight?: number;
    target_date?: string;
    weight_unit?: 'kg' | 'lbs';
    timezone?: string;
  },
) {
  const { goal_type, target_weight, target_date, weight_unit, timezone, current_weight, ...profileData } = data;

  await prisma.$transaction(async (tx) => {
    // Update profile
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(profileData.name && { name: profileData.name }),
        ...(profileData.gender && { gender: profileData.gender }),
        ...(profileData.birthdate && { birthdate: new Date(profileData.birthdate) }),
        ...(profileData.height_cm !== undefined && { height_cm: profileData.height_cm }),
      },
    });

    // Upsert settings
    if (weight_unit || timezone) {
      await tx.userSettings.upsert({
        where: { user_id: userId },
        create: { user_id: userId, ...(weight_unit && { weight_unit }), ...(timezone && { timezone }) },
        update: { ...(weight_unit && { weight_unit }), ...(timezone && { timezone }) },
      });
    }

    // Create initial measurement if current_weight provided
    if (current_weight !== undefined) {
      await tx.bodyMeasurement.create({
        data: { user_id: userId, weight_kg: current_weight, measured_at: new Date() },
      });
    }

    // Create goal if provided
    if (goal_type) {
      // Deactivate previous goals
      await tx.userGoal.updateMany({
        where: { user_id: userId, is_active: true },
        data: { is_active: false },
      });
      await tx.userGoal.create({
        data: {
          user_id: userId,
          goal_type,
          ...(target_weight !== undefined && { target_weight }),
          ...(target_date && { target_date: new Date(target_date) }),
        },
      });
    }
  });

  return getMe(userId);
}
