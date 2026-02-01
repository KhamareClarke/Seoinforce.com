import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid verification link', code: 'invalid_token' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Find user with this verification token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, verification_token_expires, email_verified')
      .eq('verification_token', token)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'Invalid verification link', code: 'invalid_token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified',
        code: 'already_verified',
      });
    }

    // Check if token expired
    if (user.verification_token_expires) {
      const expiresAt = new Date(user.verification_token_expires);
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Verification link has expired', code: 'token_expired' },
          { status: 400 }
        );
      }
    }

    // Verify the user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error verifying user:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email', code: 'verification_failed' },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json({
      success: true,
      message: 'Your email has been verified successfully!',
      code: 'email_verified',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', code: 'verification_failed' },
      { status: 500 }
    );
  }
}
