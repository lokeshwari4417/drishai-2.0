import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Sends the password reset email. If RESEND_API_KEY isn't configured yet,
 * logs the reset link to the server console instead of failing — so you
 * can still test the reset flow locally before setting up email.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.warn(
      `[DrishAI] RESEND_API_KEY not set — no email sent. For testing, here's the reset link for ${to}:\n${resetUrl}`
    );
    return { sent: false };
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "DrishAI <onboarding@resend.dev>",
    to,
    subject: "Reset your DrishAI password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #146060;">Reset your DrishAI password</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; background: #146060; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
      </div>
    `,
  });

  return { sent: true };
}
