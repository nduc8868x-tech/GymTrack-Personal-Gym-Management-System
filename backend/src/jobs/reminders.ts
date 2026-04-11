import { Request, Response } from 'express';
import * as Brevo from '@getbrevo/brevo';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { sendPushNotification } from '../services/notifications.service';
import { sendSuccess } from '../utils/response';

async function sendReminderEmail(
  toEmail: string,
  toName: string,
  workoutName: string,
  scheduledTime: string,
): Promise<void> {
  if (!env.BREVO_API_KEY) return;

  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);

  const email = new Brevo.SendSmtpEmail();
  email.to = [{ email: toEmail, name: toName }];
  email.sender = { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME };
  email.subject = `Reminder: ${workoutName} at ${scheduledTime}`;
  email.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Workout Reminder</h2>
      <p>Hi ${toName},</p>
      <p>Your workout <strong>${workoutName}</strong> is coming up at <strong>${scheduledTime}</strong>.</p>
      <a href="${env.FRONTEND_URL}/schedule"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
        View Schedule
      </a>
      <p style="color:#9ca3af;font-size:12px;">GymTrack — Personal Gym Management System</p>
    </div>
  `;

  await apiInstance.sendTransacEmail(email);
}

export async function reminderHandler(req: Request, res: Response) {
  // Verify internal secret
  const secret = req.headers['x-internal-secret'];
  if (env.INTERNAL_SECRET && secret !== env.INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Find workouts scheduled today that haven't had reminders sent
  const upcoming = await prisma.scheduledWorkout.findMany({
    where: {
      scheduled_date: { gte: todayStart, lte: todayEnd },
      reminder_sent: false,
      is_completed: false,
      scheduled_time: { not: null },
    },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const processed: string[] = [];

  for (const workout of upcoming) {
    if (!workout.scheduled_time) continue;

    const t = workout.scheduled_time;
    const workoutMinutes = t.getHours() * 60 + t.getMinutes();
    const minutesUntil = workoutMinutes - nowMinutes;

    // Send reminder if workout is within the next 60 minutes
    if (minutesUntil < 0 || minutesUntil > 60) continue;

    const workoutName = workout.name ?? 'Workout';
    const timeStr = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;

    // Try push notifications first
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user_id: workout.user_id },
    });

    let pushSent = false;
    if (subscriptions.length > 0) {
      for (const sub of subscriptions) {
        await sendPushNotification(sub, {
          title: `Workout Reminder: ${workoutName}`,
          body: `Your workout starts at ${timeStr}. Time to get ready!`,
          url: '/schedule',
        });
      }
      pushSent = true;
    }

    // Fallback to email if no push subscriptions
    if (!pushSent) {
      try {
        await sendReminderEmail(workout.user.email, workout.user.name, workoutName, timeStr);
      } catch (err) {
        console.error(`[Reminders] Email failed for workout ${workout.id}:`, err);
      }
    }

    // Mark reminder as sent
    await prisma.scheduledWorkout.update({
      where: { id: workout.id },
      data: { reminder_sent: true },
    });

    processed.push(workout.id);
  }

  return sendSuccess(res, { processed: processed.length, ids: processed });
}
