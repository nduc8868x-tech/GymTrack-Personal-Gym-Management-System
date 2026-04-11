import * as Brevo from '@getbrevo/brevo';
import { env } from '../config/env';

const getApiInstance = () => {
  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    env.BREVO_API_KEY || '',
  );
  return apiInstance;
};

export const sendPasswordResetEmail = async (
  toEmail: string,
  toName: string,
  resetToken: string,
): Promise<void> => {
  if (!env.BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY not set — skipping email send');
    console.log(`[Email] Reset link: ${env.FRONTEND_URL}/reset-password?token=${resetToken}`);
    return;
  }

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const apiInstance = getApiInstance();
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.to = [{ email: toEmail, name: toName }];
  sendSmtpEmail.sender = {
    email: env.BREVO_SENDER_EMAIL,
    name: env.BREVO_SENDER_NAME,
  };
  sendSmtpEmail.subject = 'Reset your GymTrack password';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Reset your password</h2>
      <p>Hi ${toName},</p>
      <p>We received a request to reset your GymTrack password. Click the button below to create a new password:</p>
      <a href="${resetUrl}"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Reset Password
      </a>
      <p style="color:#6b7280;font-size:14px;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="color:#9ca3af;font-size:12px;">GymTrack — Personal Gym Management System</p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};

export const sendWelcomeEmail = async (
  toEmail: string,
  toName: string,
): Promise<void> => {
  if (!env.BREVO_API_KEY) return;

  const apiInstance = getApiInstance();
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.to = [{ email: toEmail, name: toName }];
  sendSmtpEmail.sender = {
    email: env.BREVO_SENDER_EMAIL,
    name: env.BREVO_SENDER_NAME,
  };
  sendSmtpEmail.subject = 'Welcome to GymTrack!';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to GymTrack!</h2>
      <p>Hi ${toName},</p>
      <p>Your account has been created. Start tracking your workouts, nutrition, and progress today.</p>
      <a href="${env.FRONTEND_URL}/onboarding"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0;">
        Complete your profile
      </a>
      <p style="color:#9ca3af;font-size:12px;">GymTrack — Personal Gym Management System</p>
    </div>
  `;

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};
