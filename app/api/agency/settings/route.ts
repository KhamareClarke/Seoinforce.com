import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { AGENCY_PACKAGES } from '@/lib/agency-packages';

export const dynamic = 'force-dynamic';

// GET: agency gets own settings; client gets their agency's theme (for dashboard)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    // Agency (brand) viewing own settings
    if (user.account_type === 'brand') {
      const { data: settings, error } = await supabase
        .from('agency_settings')
        .select('*')
        .eq('agency_user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
      }

      const pkg = settings?.package_tier ? AGENCY_PACKAGES[settings.package_tier as keyof typeof AGENCY_PACKAGES] : AGENCY_PACKAGES.starter;
      return NextResponse.json({
        settings: settings || {
          agency_user_id: user.id,
          logo_url: null,
          primary_color: '#facc15',
          secondary_color: '#eab308',
          package_tier: 'starter',
          audits_used_this_period: 0,
          audits_limit: pkg.auditsLimit,
          clients_limit: pkg.clientsLimit,
          period_start_at: new Date().toISOString(),
        },
        isAgency: true,
      });
    }

    // Client viewing agency theme + agency name (for branding)
    if (user.agency_id) {
      const { data: settings, error } = await supabase
        .from('agency_settings')
        .select('logo_url, primary_color, secondary_color')
        .eq('agency_user_id', user.agency_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Failed to fetch theme' }, { status: 500 });
      }

      const { data: agencyUser } = await supabase
        .from('users')
        .select('brand_name, full_name')
        .eq('id', user.agency_id)
        .single();

      const agencyName = agencyUser?.brand_name || agencyUser?.full_name || 'Dashboard';

      return NextResponse.json({
        theme: {
          logo_url: settings?.logo_url || null,
          primary_color: settings?.primary_color || '#facc15',
          secondary_color: settings?.secondary_color || '#eab308',
        },
        agency_name: agencyName,
        isAgency: false,
      });
    }

    return NextResponse.json({ error: 'Not an agency or client' }, { status: 403 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: agency only - update theme (logo, colors)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const body = await request.json();
    const { logo_url, primary_color, secondary_color } = body;

    const supabase = createSupabaseServerClient();

    const { data: existing } = await supabase
      .from('agency_settings')
      .select('id')
      .eq('agency_user_id', user.id)
      .single();

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (logo_url !== undefined) payload.logo_url = logo_url;
    if (primary_color !== undefined) payload.primary_color = primary_color;
    if (secondary_color !== undefined) payload.secondary_color = secondary_color;

    if (existing) {
      const { data, error } = await supabase
        .from('agency_settings')
        .update(payload)
        .eq('agency_user_id', user.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      return NextResponse.json({ settings: data });
    }

    const { data, error } = await supabase
      .from('agency_settings')
      .insert({
        agency_user_id: user.id,
        logo_url: logo_url ?? null,
        primary_color: primary_color ?? '#facc15',
        secondary_color: secondary_color ?? '#eab308',
        package_tier: 'starter',
        audits_limit: 10,
        clients_limit: 3,
        ...payload,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
