import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { hashPassword } from '@/lib/auth';
import { AGENCY_PACKAGES, isAgencySubscribed } from '@/lib/agency-packages';

export const dynamic = 'force-dynamic';

// GET: list clients for this agency
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const { data: clients, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('agency_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }

    return NextResponse.json({ clients: clients || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: add client (email, password) - agency only, check clients_limit
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    const { data: settings } = await supabase
      .from('agency_settings')
      .select('package_tier, clients_limit, subscription_status, admin_granted_free')
      .eq('agency_user_id', user.id)
      .single();

    if (!isAgencySubscribed(settings)) {
      return NextResponse.json(
        { error: 'Subscribe to a plan to add clients. Go to Package tab and choose a plan.' },
        { status: 402 }
      );
    }

    const pkg = settings?.package_tier
      ? AGENCY_PACKAGES[settings.package_tier as keyof typeof AGENCY_PACKAGES]
      : AGENCY_PACKAGES.starter;
    const clientsLimit = settings?.clients_limit ?? pkg.clientsLimit;

    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', user.id);

    if ((count ?? 0) >= clientsLimit) {
      return NextResponse.json(
        { error: `Client limit reached (${clientsLimit}). Upgrade your package to add more.` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existing = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing.data) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName || email.split('@')[0],
        account_type: 'personal',
        agency_id: user.id,
        email_verified: true,
      })
      .select('id, email, full_name, created_at')
      .single();

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    return NextResponse.json({ client: newUser });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
