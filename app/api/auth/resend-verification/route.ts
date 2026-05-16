import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { generateVerificationToken } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/auth-email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name, email_verified')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If that email is registered and unverified, we sent a new link.',
        emailSent: true,
      });
    }

    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'This email is already verified. You can sign in.',
        alreadyVerified: true,
      });
    }

    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Could not refresh verification link' }, { status: 500 });
    }

    const mail = await sendVerificationEmail({
      to: user.email,
      fullName: user.full_name,
      token: verificationToken,
    });

    if (!mail.sent) {
      return NextResponse.json(
        {
          error:
            mail.error ||
            'Could not send email. Check spam, or contact support — server email may not be configured.',
          emailSent: false,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Check your inbox and spam folder.',
      emailSent: true,
    });
  } catch (e) {
    console.error('resend-verification error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
