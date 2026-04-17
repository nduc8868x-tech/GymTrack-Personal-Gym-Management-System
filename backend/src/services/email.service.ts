import * as Brevo from '@getbrevo/brevo';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

// ─── Gmail SMTP transporter (lazy init) ──────────────────────────────────────

let _gmailTransport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getGmailTransport() {
  if (!_gmailTransport) {
    _gmailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: env.GMAIL_USER, pass: env.GMAIL_APP_PASSWORD },
    });
  }
  return _gmailTransport;
}

// ─── Dispatcher: Brevo → Gmail → warn ────────────────────────────────────────

async function sendEmail(
  toEmail: string,
  toName: string,
  subject: string,
  html: string,
): Promise<void> {
  if (env.BREVO_API_KEY) {
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY);
    const mail = new Brevo.SendSmtpEmail();
    mail.to = [{ email: toEmail, name: toName }];
    mail.sender = { email: env.BREVO_SENDER_EMAIL, name: env.BREVO_SENDER_NAME };
    mail.subject = subject;
    mail.htmlContent = html;
    await apiInstance.sendTransacEmail(mail);
    return;
  }

  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    await getGmailTransport().sendMail({
      from: `"GymTrack" <${env.GMAIL_USER}>`,
      to: `"${toName}" <${toEmail}>`,
      subject,
      html,
    });
    return;
  }

  console.warn('[Email] No email provider configured — skipping send');
}

// ─── Public functions ─────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (
  toEmail: string,
  toName: string,
  resetToken: string,
): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (!env.BREVO_API_KEY && !env.GMAIL_USER) {
    console.warn('[Email] No email provider — reset link (dev only):');
    console.log(`[Email] ${resetUrl}`);
    return;
  }

  const html = `
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

  await sendEmail(toEmail, toName, 'Reset your GymTrack password', html);
};

export const sendWelcomeEmail = async (
  toEmail: string,
  toName: string,
): Promise<void> => {
  if (!env.BREVO_API_KEY && !env.GMAIL_USER) return;

  const html = `
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

  await sendEmail(toEmail, toName, 'Welcome to GymTrack!', html);
};
