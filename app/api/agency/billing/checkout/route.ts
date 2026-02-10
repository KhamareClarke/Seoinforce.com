import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { AGENCY_PACKAGES, AgencyPackageTier } from '@/lib/agency-packages';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secretKey);
}

const VALID_TIERS: AgencyPackageTier[] = ['starter', 'growth', 'empire'];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user || user.account_type !== 'brand') {
      return NextResponse.json({ error: 'Agency access required' }, { status: 403 });
    }

    const body = await request.json();
    const plan = (body.plan || body.package_tier) as string;
    if (!plan || !VALID_TIERS.includes(plan as AgencyPackageTier)) {
      return NextResponse.json({ error: 'Invalid plan. Use starter, growth, or empire.' }, { status: 400 });
    }

    const pkg = AGENCY_PACKAGES[plan as AgencyPackageTier];
    const supabase = createSupabaseServerClient();

    let { data: settings } = await supabase
      .from('agency_settings')
      .select('id, stripe_customer_id')
      .eq('agency_user_id', user.id)
      .single();

    const stripe = getStripe();
    let customerId = settings?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { agency_user_id: user.id },
      });
      customerId = customer.id;
      if (settings?.id) {
        await supabase
          .from('agency_settings')
          .update({
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('agency_user_id', user.id);
      } else {
        await supabase.from('agency_settings').insert({
          agency_user_id: user.id,
          stripe_customer_id: customerId,
          package_tier: plan,
          audits_limit: pkg.auditsLimit,
          clients_limit: pkg.clientsLimit,
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Agency ${pkg.name} Plan`,
              description: `${pkg.auditsLimit} audits/mo, ${pkg.clientsLimit} clients`,
            },
            unit_amount: pkg.pricePence,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/agency/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/agency/dashboard?billing=canceled`,
      metadata: {
        agency_user_id: user.id,
        plan,
        context: 'agency_subscription',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (e) {
    console.error('Agency billing checkout error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
