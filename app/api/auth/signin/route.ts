import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { touchUserLastActive } from '@/lib/user-activity';
import { syncUserToGhlById } from '@/lib/ghl/sync-user';

export const dynamic = 'force-dynamic';

type SignInBody = {
  email: string;
  password: string;
  redirect: boolean;
};

async function parseSignInBody(request: NextRequest): Promise<SignInBody> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    return {
      email: String(body.email || '').trim(),
      password: String(body.password || ''),
      redirect: body.redirect === true || body.redirect === '1',
    };
  }
  const formData = await request.formData();
  return {
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
    redirect:
      formData.get('redirect') === '1' ||
      formData.get('redirect') === 'true' ||
      formData.get('_redirect') === '1',
  };
}

function signInErrorRedirect(request: NextRequest, code: string) {
  const url = new URL('/sign-in', request.url);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  let redirect = false;
  try {
    const body = await parseSignInBody(request);
    const { email, password } = body;
    redirect = body.redirect;

    if (!email || !email.includes('@')) {
      if (redirect) return signInErrorRedirect(request, 'invalid_email');
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (!password) {
      if (redirect) return signInErrorRedirect(request, 'missing_password');
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, email_verified, is_banned, full_name, account_type, agency_id')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      if (redirect) return signInErrorRedirect(request, 'invalid_credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.is_banned) {
      if (redirect) return signInErrorRedirect(request, 'banned');
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact support.' },
        { status: 403 }
      );
    }

    if (!user.email_verified) {
      if (redirect) return signInErrorRedirect(request, 'email_unverified');
      return NextResponse.json(
        {
          error:
            'Please verify your email address before signing in. Check your inbox for the verification link.',
        },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      if (redirect) return signInErrorRedirect(request, 'invalid_credentials');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = generateToken(user.id, user.email);

    let redirectTo = '/audit/dashboard';
    if (user.account_type === 'brand') {
      redirectTo = '/agency/dashboard';
    } else if (user.agency_id) {
      redirectTo = '/client/dashboard';
    } else {
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!count) {
        redirectTo = '/create-project';
      }
    }

    void (async () => {
      try {
        await touchUserLastActive(user.id);
        void syncUserToGhlById(user.id);
      } catch (e) {
        console.warn('activity/ghl sync on sign-in:', e);
      }
    })();

    if (redirect) {
      const dest = new URL(redirectTo, request.url);
      const redirectResponse = NextResponse.redirect(dest, 303);
      setAuthCookie(token, redirectResponse);
      return redirectResponse;
    }

    const response = NextResponse.json({
      success: true,
      redirectTo,
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
    return response;
  } catch (error) {
    console.error('Signin error:', error);
    if (redirect) return signInErrorRedirect(request, 'signin_failed');
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
