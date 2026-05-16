import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { hashPassword, generateVerificationToken } from '@/lib/auth';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';
import { getSiteUrl } from '@/lib/site-url';
import { emitSignupWorkflow } from '@/lib/ghl/workflow-triggers';
import { buildVerificationUrl, sendVerificationEmail } from '@/lib/auth-email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, accountType, brandName, brandWebsite } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please sign in instead.' },
        { status: 400 }
      );
    }

    if (accountType === 'brand' && !brandName) {
      return NextResponse.json(
        { error: 'Brand name is required for brand accounts' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = new Date();
    verificationTokenExpires.setHours(verificationTokenExpires.getHours() + 24);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName || email.split('@')[0],
        account_type: accountType || 'personal',
        brand_name: accountType === 'brand' ? brandName : null,
        brand_website: accountType === 'brand' ? brandWebsite || null : null,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires.toISOString(),
      })
      .select('id, email, full_name, account_type, brand_name')
      .single();

    if (userError || !user) {
      console.error('Error creating user:', userError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    void syncUserToGhlById(user.id).catch((err) => console.warn('GHL contact sync after signup:', err));

    const verificationUrl = buildVerificationUrl(verificationToken);

    emitSignupWorkflow({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      accountType: user.account_type ?? undefined,
      brandName: user.brand_name,
      planType: 'free',
      signupAt: new Date().toISOString(),
      appBaseUrl: getSiteUrl(),
      firstAuditUrl: `${getSiteUrl()}/audit/dashboard`,
      verifyEmailUrl: verificationUrl,
    });

    const mail = await sendVerificationEmail({
      to: user.email,
      fullName: user.full_name,
      token: verificationToken,
    });

    if (!mail.sent) {
      console.error('Verification email not sent:', mail.error);
      return NextResponse.json({
        success: true,
        emailSent: false,
        message:
          'Account created, but we could not send the verification email. Use Resend below or contact support.',
        warning: mail.error,
        user: { id: user.id, email: user.email },
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'Account created! Check your inbox (and spam) for the verification link.',
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
