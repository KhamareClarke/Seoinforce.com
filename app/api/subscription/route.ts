import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { planType } = await request.json();

    if (!planType || !['starter', 'growth', 'empire'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // For now, just update the plan without payment (free)
    // In production, you would integrate Stripe here
    
    // Check if profile exists, create if it doesn't
    let { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    if (!profile) {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.full_name || user.email?.split('@')[0] || 'User',
          plan_type: 'free',
          api_credits: 100,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      profile = newProfile;
    }

    // Update plan and set appropriate API credits based on plan
    let apiCredits = 100; // default
    if (planType === 'starter') {
      apiCredits = 500; // 100 keywords, monthly audits
    } else if (planType === 'growth') {
      apiCredits = 2000; // 1,000 keywords, weekly reports
    } else if (planType === 'empire') {
      apiCredits = 10000; // Unlimited keywords
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan_type: planType,
        api_credits: apiCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      planType,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
