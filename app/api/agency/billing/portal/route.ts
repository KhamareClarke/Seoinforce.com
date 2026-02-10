import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secretKey);
}

/** GET: return Stripe Customer Portal URL for the agency to manage/cancel subscription */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();
    const { data: settings } = await supabase
      .from('agency_settings')
      .select('stripe_customer_id')
      .eq('agency_user_id', user.id)
      .single();

    if (!settings?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Subscribe to a plan first.' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: settings.stripe_customer_id,
      return_url: `${baseUrl}/agency/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('Agency billing portal error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
