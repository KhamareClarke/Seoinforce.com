import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all agencies with client count and package
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    const { data: agencies, error: agenciesError } = await supabase
      .from('users')
      .select('id, email, full_name, brand_name, brand_website, created_at')
      .eq('account_type', 'brand')
      .order('created_at', { ascending: false });

    if (agenciesError) {
      return NextResponse.json({ error: agenciesError.message }, { status: 500 });
    }

    const result: Array<{
      id: string;
      email: string;
      full_name: string | null;
      brand_name: string | null;
      brand_website: string | null;
      created_at: string;
      package_tier: string;
      audits_used: number;
      audits_limit: number;
      clients_limit: number;
      clients_count: number;
      subscription_status: string | null;
      admin_granted_free: boolean;
    }> = [];

    for (const agency of agencies || []) {
      const { data: settings } = await supabase
        .from('agency_settings')
        .select('package_tier, audits_used_this_period, audits_limit, clients_limit, subscription_status, admin_granted_free')
        .eq('agency_user_id', agency.id)
        .single();

      const { count: clientsCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agency.id);

      result.push({
        id: agency.id,
        email: agency.email,
        full_name: agency.full_name || null,
        brand_name: agency.brand_name || null,
        brand_website: agency.brand_website || null,
        created_at: agency.created_at,
        package_tier: settings?.package_tier || 'starter',
        audits_used: settings?.audits_used_this_period ?? 0,
        audits_limit: settings?.audits_limit ?? 10,
        clients_limit: settings?.clients_limit ?? 3,
        clients_count: clientsCount ?? 0,
        subscription_status: settings?.subscription_status ?? null,
        admin_granted_free: settings?.admin_granted_free ?? false,
      });
    }

    return NextResponse.json({
      agencies: result,
      total: result.length,
    });
  } catch (error: any) {
    console.error('Admin agencies API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Admin toggle free/paid (admin_granted_free) for an agency
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { agency_id, admin_granted_free } = body;
    if (!agency_id || typeof admin_granted_free !== 'boolean') {
      return NextResponse.json(
        { error: 'Body must include agency_id (UUID) and admin_granted_free (boolean)' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: existing } = await supabase
      .from('agency_settings')
      .select('id')
      .eq('agency_user_id', agency_id)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('agency_settings')
        .update({
          admin_granted_free,
          updated_at: new Date().toISOString(),
        })
        .eq('agency_user_id', agency_id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, settings: data });
    }

    const { data: inserted, error: insertError } = await supabase
      .from('agency_settings')
      .insert({
        agency_user_id: agency_id,
        admin_granted_free,
        package_tier: 'starter',
        audits_limit: 10,
        clients_limit: 3,
      })
      .select()
      .single();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ ok: true, settings: inserted });
  } catch (error: any) {
    console.error('Admin agencies PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
