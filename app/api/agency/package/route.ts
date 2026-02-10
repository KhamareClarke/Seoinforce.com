import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { AGENCY_PACKAGES, AgencyPackageTier, isAgencySubscribed } from '@/lib/agency-packages';

export const dynamic = 'force-dynamic';

const VALID_TIERS: AgencyPackageTier[] = ['starter', 'growth', 'empire'];

// GET: current package and usage
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const { data: settings, error } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('agency_user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 });
    }

    const tier = (settings?.package_tier || 'starter') as AgencyPackageTier;
    const pkg = AGENCY_PACKAGES[tier] || AGENCY_PACKAGES.starter;

    const { count: clientCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', user.id);

    return NextResponse.json({
      package: {
        tier,
        name: pkg.name,
        auditsLimit: settings?.audits_limit ?? pkg.auditsLimit,
        auditsUsed: settings?.audits_used_this_period ?? 0,
        clientsLimit: settings?.clients_limit ?? pkg.clientsLimit,
        clientsCount: clientCount ?? 0,
        price: pkg.pricePence / 100,
      },
      packages: Object.fromEntries(
        (['starter', 'growth', 'empire'] as const).map(t => [t, { ...AGENCY_PACKAGES[t], price: AGENCY_PACKAGES[t].pricePence / 100 }])
      ),
      subscriptionStatus: settings?.subscription_status ?? null,
      adminGrantedFree: settings?.admin_granted_free ?? false,
      subscribed: isAgencySubscribed(settings ?? undefined),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: create or ensure agency_settings row (tier is set by Stripe checkout or admin only)
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const body = await request.json();
    const { package_tier } = body;
    // Agency cannot set tier via this API; tier is set by Stripe webhook after checkout or by admin
    if (package_tier) {
      return NextResponse.json(
        { error: 'Subscribe to a plan using the Subscribe button, or contact support for admin-granted access.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: existing } = await supabase
      .from('agency_settings')
      .select('id')
      .eq('agency_user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ package: existing });
    }

    // First-time: create row with default starter limits (no subscription yet)
    const pkg = AGENCY_PACKAGES.starter;
    const { data, error } = await supabase
      .from('agency_settings')
      .insert({
        agency_user_id: user.id,
        package_tier: 'starter',
        audits_limit: pkg.auditsLimit,
        clients_limit: pkg.clientsLimit,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
    return NextResponse.json({ package: data });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
