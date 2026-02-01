import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

// Helper function to check if user is admin
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  
  return profile?.is_admin === true;
}

// GET - List all users
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get subscription counts
    const subscriptionCounts = {
      free: users?.filter(u => u.plan_type === 'free').length || 0,
      starter: users?.filter(u => u.plan_type === 'starter').length || 0,
      growth: users?.filter(u => u.plan_type === 'growth').length || 0,
      empire: users?.filter(u => u.plan_type === 'empire').length || 0,
    };

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      subscriptionCounts,
    });
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user (ban/unban, update credits, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { userId, action, ...updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    if (action === 'ban') {
      updateData.is_banned = true;
      updateData.banned_at = new Date().toISOString();
      updateData.banned_reason = updates.reason || 'No reason provided';
    } else if (action === 'unban') {
      updateData.is_banned = false;
      updateData.banned_at = null;
      updateData.banned_reason = null;
    } else if (action === 'update') {
      if (updates.api_credits !== undefined) updateData.api_credits = updates.api_credits;
      if (updates.plan_type !== undefined) updateData.plan_type = updates.plan_type;
      if (updates.is_admin !== undefined) updateData.is_admin = updates.is_admin;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data });
  } catch (error: any) {
    console.error('Admin update user API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}