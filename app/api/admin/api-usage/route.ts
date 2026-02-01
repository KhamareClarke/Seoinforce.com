import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

// GET - Get API usage statistics
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

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const userId = searchParams.get('userId');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('api_usage')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name,
          plan_type
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: usage, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate statistics
    const totalCreditsUsed = usage?.reduce((sum, u) => sum + (u.credits_used || 0), 0) || 0;
    const usageByType = usage?.reduce((acc: any, u) => {
      acc[u.api_type] = (acc[u.api_type] || 0) + (u.credits_used || 0);
      return acc;
    }, {}) || {};

    const usageByUser = usage?.reduce((acc: any, u) => {
      const uid = u.user_id;
      if (!acc[uid]) {
        acc[uid] = {
          user: u.users,
          totalCredits: 0,
          count: 0,
        };
      }
      acc[uid].totalCredits += u.credits_used || 0;
      acc[uid].count += 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      usage,
      statistics: {
        totalCreditsUsed,
        totalRequests: usage?.length || 0,
        usageByType,
        usageByUser: Object.values(usageByUser),
      },
    });
  } catch (error: any) {
    console.error('Admin API usage API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}