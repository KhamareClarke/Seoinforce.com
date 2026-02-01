import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  return profile?.is_admin === true;
}

// GET - Get overall admin statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: bannedUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_banned', true);

    const { data: subscriptionData } = await supabase
      .from('profiles')
      .select('plan_type');

    const subscriptionCounts = {
      free: subscriptionData?.filter(p => p.plan_type === 'free').length || 0,
      starter: subscriptionData?.filter(p => p.plan_type === 'starter').length || 0,
      growth: subscriptionData?.filter(p => p.plan_type === 'growth').length || 0,
      empire: subscriptionData?.filter(p => p.plan_type === 'empire').length || 0,
    };

    // Get audit statistics
    const { count: totalAudits } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true });

    const { count: completedAudits } = await supabase
      .from('audits')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Get API usage statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsage } = await supabase
      .from('api_usage')
      .select('credits_used')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const totalCreditsUsed = recentUsage?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;

    // Get error log statistics
    const { count: totalErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true });

    const { count: unresolvedErrors } = await supabase
      .from('error_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    // Get recent subscriptions (users who upgraded in last 30 days)
    const { data: recentSubscriptions } = await supabase
      .from('profiles')
      .select('id, email, full_name, plan_type, updated_at')
      .in('plan_type', ['starter', 'growth', 'empire'])
      .gte('updated_at', thirtyDaysAgo.toISOString())
      .order('updated_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        banned: bannedUsers || 0,
        active: (totalUsers || 0) - (bannedUsers || 0),
        subscriptionCounts,
      },
      audits: {
        total: totalAudits || 0,
        completed: completedAudits || 0,
      },
      apiUsage: {
        totalCreditsUsedLast30Days: totalCreditsUsed,
        totalRequestsLast30Days: recentUsage?.length || 0,
      },
      errors: {
        total: totalErrors || 0,
        unresolved: unresolvedErrors || 0,
      },
      recentSubscriptions: recentSubscriptions || [],
    });
  } catch (error: any) {
    console.error('Admin stats API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}