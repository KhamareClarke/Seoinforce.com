import { createSmtpTransporter, getMailFrom, getSmtpCredentials } from '@/lib/smtp';
import { getSiteUrl } from '@/lib/site-url';

export type SendVerificationEmailResult = {
  sent: boolean;
  error?: string;
};

export function buildVerificationUrl(token: string): string {
  const appUrl = getSiteUrl();
  return `${appUrl}/verify-email?token=${token}`;
}

export async function sendVerificationEmail(args: {
  to: string;
  fullName?: string | null;
  token: string;
}): Promise<SendVerificationEmailResult> {
  const transporter = createSmtpTransporter();
  const from = getMailFrom();
  const { user } = getSmtpCredentials();

  if (!transporter || !from || !user) {
    return {
      sent: false,
      error: 'Email is not configured on the server (SMTP_USER / SMTP_PASS).',
    };
  }

  const verificationUrl = buildVerificationUrl(args.token);
  const displayName = args.fullName || args.to.split('@')[0];

  try {
    await transporter.sendMail({
      from,
      to: args.to,
      subject: 'Verify Your SEOInForce Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #fbbf24; background: #1f2937; padding: 20px; margin: 0; text-align: center; border-radius: 8px 8px 0 0;">
            Verify Your Email Address
          </h2>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; font-size: 16px;">Hi ${displayName},</p>
            <p style="color: #374151; font-size: 16px;">
              Thank you for joining SEOInForce. Click below to verify your email (link expires in 24 hours):
            </p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #fbbf24; color: #1f2937; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Verify Email Address
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all;">Or copy: ${verificationUrl}</p>
          </div>
        </div>
      `,
      text: `Hi ${displayName},\n\nVerify your SEOInForce account:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    });
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('sendVerificationEmail failed:', msg);
    return { sent: false, error: msg };
  }
}
