import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import Stripe from 'stripe';
import { sendPackagePurchaseEmail } from '@/lib/email';
import { AGENCY_PACKAGES } from '@/lib/agency-packages';
import { notifySubscriptionChange } from '@/lib/ghl/subscription-notify';
import { isPaidPlan } from '@/lib/ghl/plan-features';
import { emitEmpireActivity } from '@/lib/empire-activity';

// Allow more time for Supabase + email so Stripe doesn't get timeout (e.g. Vercel 10s default)
export const maxDuration = 25;

// Lazy initialization to avoid build-time errors
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch (err) {
    console.error('Stripe webhook: failed to read body', err);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    console.error('Stripe webhook: missing stripe-signature header');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Stripe webhook: STRIPE_WEBHOOK_SECRET is not set (use Live mode signing secret from Stripe Dashboard)');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Stripe webhook signature verification failed:', msg);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        const agencyUserId = session.metadata?.agency_user_id;
        const agencyPlan = session.metadata?.plan;
        const context = session.metadata?.context;

        // Agency subscription: update agency_settings
        if (context === 'agency_subscription' && agencyUserId && agencyPlan && ['starter', 'growth', 'empire'].includes(agencyPlan)) {
          const pkg = AGENCY_PACKAGES[agencyPlan as keyof typeof AGENCY_PACKAGES];
          await supabase
            .from('agency_settings')
            .update({
              package_tier: agencyPlan,
              audits_limit: pkg.auditsLimit,
              clients_limit: pkg.clientsLimit,
              stripe_subscription_id: session.subscription as string,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('agency_user_id', agencyUserId);
          console.log(`Agency ${agencyUserId} subscribed to ${agencyPlan}`);
        }

        if (userId && planType) {
          const { data: beforeUser } = await supabase
            .from('users')
            .select('plan_type, email, full_name')
            .eq('id', userId)
            .single();
          const previousPlan = beforeUser?.plan_type || 'free';

          // Update user's plan
          let apiCredits = 100;
          if (planType === 'starter') {
            apiCredits = 500;
          } else if (planType === 'growth') {
            apiCredits = 2000;
          } else if (planType === 'empire') {
            apiCredits = 10000;
          } else if (planType === 'brand') {
            apiCredits = 1000; // Brand plan gets 1000 credits
          }

          // Update both users and profiles tables
          await supabase
            .from('users')
            .update({
              plan_type: planType,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          await supabase
            .from('profiles')
            .update({
              plan_type: planType,
              api_credits: apiCredits,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          console.log(`Updated user ${userId} to ${planType} plan`);

          // Get user details and send purchase email
          try {
            const { data: user } = await supabase
              .from('users')
              .select('email, full_name')
              .eq('id', userId)
              .single();

            if (user) {
              await sendPackagePurchaseEmail(
                user.email,
                user.full_name || user.email?.split('@')[0] || 'User',
                planType
              );
            }
          } catch (emailError) {
            console.error('Error sending purchase email:', emailError);
          }

          if (beforeUser?.email && !isPaidPlan(previousPlan) && isPaidPlan(planType)) {
            try {
              await notifySubscriptionChange({
                userId,
                email: beforeUser.email,
                fullName: beforeUser.full_name,
                changeType: 'upgraded',
                previousPlan,
                newPlan: planType,
              });
            } catch (e) {
              console.warn('GHL subscription upgraded:', e);
            }
          }

          void emitEmpireActivity({
            event_type: 'payment_succeeded',
            user_email: beforeUser?.email || undefined,
            user_id: userId,
            user_name: beforeUser?.full_name || undefined,
            message: `Checkout completed: ${planType}`,
            metadata: {
              plan: planType,
              previous_plan: previousPlan,
              amount_total: session.amount_total,
              currency: session.currency,
              stripe_session: session.id,
            },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null;
        };
        if (invoice.billing_reason !== 'subscription_cycle') {
          break;
        }
        const subRaw = invoice.subscription;
        const subId = typeof subRaw === 'string' ? subRaw : subRaw?.id;
        if (!subId) break;

        const { data: prof } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle();

        const userId = prof?.id;
        if (!userId) break;

        const { data: u } = await supabase
          .from('users')
          .select('email, full_name, plan_type')
          .eq('id', userId)
          .single();

        const nextBilling =
          invoice.period_end != null
            ? new Date(invoice.period_end * 1000).toLocaleDateString('en-GB')
            : '—';

        if (u?.email) {
          try {
            await notifySubscriptionChange({
              userId,
              email: u.email,
              fullName: u.full_name,
              changeType: 'renewed',
              previousPlan: u.plan_type || 'free',
              newPlan: u.plan_type || 'free',
              nextBillingDate: nextBilling,
            });
          } catch (e) {
            console.warn('invoice.paid GHL subscription renewed:', e);
          }

          void emitEmpireActivity({
            event_type: 'subscription_created',
            user_email: u.email,
            user_id: userId,
            user_name: u.full_name || undefined,
            message: 'Subscription renewed',
            metadata: {
              plan: u.plan_type || 'free',
              next_billing_date: nextBilling,
              stripe_subscription: subId,
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Agency: update subscription_status (or clear on deleted)
        const { data: agencyRow } = await supabase
          .from('agency_settings')
          .select('agency_user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (agencyRow) {
          if (event.type === 'customer.subscription.deleted') {
            await supabase
              .from('agency_settings')
              .update({
                stripe_subscription_id: null,
                subscription_status: 'canceled',
                package_tier: 'starter',
                audits_limit: AGENCY_PACKAGES.starter.auditsLimit,
                clients_limit: AGENCY_PACKAGES.starter.clientsLimit,
                updated_at: new Date().toISOString(),
              })
              .eq('agency_user_id', agencyRow.agency_user_id);
          } else {
            const status = subscription.status as string;
            await supabase
              .from('agency_settings')
              .update({
                subscription_status: status === 'active' || status === 'trialing' ? status : (status || null),
                updated_at: new Date().toISOString(),
              })
              .eq('agency_user_id', agencyRow.agency_user_id);
          }
        }

        // User (profiles) subscription
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (profile) {
          const { data: u } = await supabase
            .from('users')
            .select('email, full_name, plan_type')
            .eq('id', profile.id)
            .single();

          if (event.type === 'customer.subscription.deleted') {
            const previousPlan = u?.plan_type || 'free';

            await supabase
              .from('users')
              .update({
                plan_type: 'free',
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            await supabase
              .from('profiles')
              .update({
                plan_type: 'free',
                api_credits: 100,
                stripe_subscription_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);

            if (u?.email && isPaidPlan(previousPlan)) {
              try {
                await notifySubscriptionChange({
                  userId: profile.id,
                  email: u.email,
                  fullName: u.full_name,
                  changeType: 'downgraded',
                  previousPlan,
                  newPlan: 'free',
                });
              } catch (e) {
                console.warn('GHL subscription downgraded:', e);
              }
            }

            void emitEmpireActivity({
              event_type: 'subscription_cancelled',
              user_email: u?.email || undefined,
              user_id: profile.id,
              user_name: u?.full_name || undefined,
              message: 'Subscription cancelled',
              metadata: {
                previous_plan: u?.plan_type || 'free',
                stripe_subscription: subscription.id,
              },
            });
          }
        }
        break;
      }

      default:
        // Acknowledge other event types so Stripe stops retrying; we only act on the ones above
        console.log(`Stripe webhook: received unhandled event type ${event.type} (${event.id})`);
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
