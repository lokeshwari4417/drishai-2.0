import nodemailer from "nodemailer";

// Retrieve SMTP settings from environment variables
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpFrom = process.env.SMTP_FROM || "DrishAI Support <noreply@drishai.dev>";

// Initialize the Nodemailer SMTP transporter if host is configured
const transporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser && smtpPassword ? { user: smtpUser, pass: smtpPassword } : undefined,
    })
  : null;

/**
 * Sends a generic styled email.
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!transporter) {
    console.log(
      `\n[DrishAI Mail Fallback] SMTP not configured. Logged Email to ${to}:\nSubject: ${subject}\nContent:\n${text || html}\n`
    );
    return { sent: false, loggedToConsole: true };
  }

  try {
    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject,
      html,
      text: text || subject,
    });
    return { sent: true };
  } catch (error) {
    console.error(`[DrishAI Mail Error] Failed to send email to ${to}:`, error);
    return { sent: false, error };
  }
}

/**
 * Sends a 6-digit OTP verification email.
 */
export async function sendOtpEmail(to: string, otp: string) {
  const subject = "Your DrishAI Verification Code";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px border-neutral-200; border-radius: 12px;">
      <h2 style="color: #146060; margin-top: 0;">Verification Code</h2>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        Please use the following 6-digit verification code to complete your login. This code expires in 5 minutes.
      </p>
      <div style="background-color: #eef6f6; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #146060;">
          ${otp}
        </span>
      </div>
      <p style="color: #888; font-size: 12px; line-height: 1.4;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>
  `;
  const text = `Your DrishAI verification code is ${otp}. It will expire in 5 minutes.`;
  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a welcome email upon registration.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  const subject = "Welcome to DrishAI!";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px border-neutral-200; border-radius: 12px;">
      <h2 style="color: #146060; margin-top: 0;">Welcome, ${name}!</h2>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        Thank you for creating an account on DrishAI. Our AI-powered screening platform helps you detect diabetic retinopathy quickly and accurately.
      </p>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        Get started by checking your dashboard or reviewing available patient screening data.
      </p>
      <div style="margin: 24px 0;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}" 
           style="display: inline-block; background-color: #146060; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
           Go to Dashboard
        </a>
      </div>
      <p style="color: #888; font-size: 12px;">
        DrishAI Platform Support Team
      </p>
    </div>
  `;
  const text = `Welcome to DrishAI, ${name}! Log in to your dashboard to get started: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}`;
  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const subject = "Reset your DrishAI password";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px border-neutral-200; border-radius: 12px;">
      <h2 style="color: #146060; margin-top: 0;">Reset your password</h2>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        We received a request to reset the password for your DrishAI account. This link expires in 1 hour.
      </p>
      <div style="margin: 24px 0;">
        <a href="${resetUrl}" 
           style="display: inline-block; background-color: #146060; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">
           Reset password
        </a>
      </div>
      <p style="color: #888; font-size: 12px; line-height: 1.4;">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
    </div>
  `;
  const text = `We received a request to reset your password. Use the following link to reset it: ${resetUrl}`;
  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a security notification when a user successfully logs in.
 */
export async function sendLoginNotification(to: string, ip: string, userAgent: string) {
  const subject = "New Login Detected on DrishAI";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px border-neutral-200; border-radius: 12px;">
      <h2 style="color: #b06f17; margin-top: 0;">New Login Notification</h2>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        Your DrishAI account was recently logged into from a new device or IP address.
      </p>
      <div style="background-color: #fdf6e9; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #78350f;">
        <strong>Time:</strong> ${new Date().toUTCString()}<br/>
        <strong>IP Address:</strong> ${ip}<br/>
        <strong>Device:</strong> ${userAgent}
      </div>
      <p style="color: #888; font-size: 12px; line-height: 1.4;">
        If this was you, no action is needed. If you do not recognize this login, please change your password immediately.
      </p>
    </div>
  `;
  const text = `New login detected on your DrishAI account on ${new Date().toUTCString()} from IP: ${ip}, Device: ${userAgent}.`;
  return sendEmail({ to, subject, html, text });
}

/**
 * Sends a notification when an account is blocked.
 */
export async function sendAccountBlockedNotification(to: string) {
  const subject = "Your DrishAI Account Has Been Suspended";
  const html = `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px border-neutral-200; border-radius: 12px; border-top: 4px solid #c43d3d;">
      <h2 style="color: #c43d3d; margin-top: 0;">Account Suspended</h2>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        We regret to inform you that your DrishAI account has been suspended by an administrator.
      </p>
      <p style="color: #444; font-size: 14px; line-height: 1.5;">
        You will no longer be able to log in or access screenings. If you believe this is an error, please contact your organization administrator.
      </p>
      <p style="color: #888; font-size: 12px;">
        DrishAI Administration Team
      </p>
    </div>
  `;
  const text = `Your DrishAI account has been suspended by an administrator. Please contact your organization administrator.`;
  return sendEmail({ to, subject, html, text });
}
