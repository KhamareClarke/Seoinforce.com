import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import Stripe from 'stripe';
import { sendPackagePurchaseEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;

        if (userId && planType) {
          // Update user's plan
          let apiCredits = 100;
          if (planType === 'starter') {
            apiCredits = 500;
          } else if (planType === 'growth') {
            apiCredits = 2000;
          } else if (planType === 'empire') {
            apiCredits = 10000;
          }

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
            // Don't fail the webhook if email fails
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by subscription ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (profile) {
          if (event.type === 'customer.subscription.deleted') {
            // Downgrade to free plan
            await supabase
              .from('profiles')
              .update({
                plan_type: 'free',
                api_credits: 100,
                stripe_subscription_id: null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', profile.id);
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
