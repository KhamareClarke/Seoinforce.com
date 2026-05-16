import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { touchUserLastActive } from '@/lib/user-activity';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, email_verified, is_banned, full_name, account_type, agency_id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is banned
    if (user.is_banned) {
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email address before signing in. Check your inbox for the verification link.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    // Create response and set auth cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        email_verified: user.email_verified,
        account_type: user.account_type || 'personal',
        agency_id: user.agency_id ?? null,
      },
    });

    setAuthCookie(token, response);

    void (async () => {
      try {
        await touchUserLastActive(user.id);
        void syncUserToGhlById(user.id);
      } catch (e) {
        console.warn('activity/ghl sync on sign-in:', e);
      }
    })();

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
