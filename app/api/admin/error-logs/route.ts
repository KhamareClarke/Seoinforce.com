import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

// GET - Get error logs
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');

    let query = supabase
      .from('error_logs')
      .select(`
        *,
        users:user_id (
          id,
          email,
          full_name
        ),
        resolved_by_user:resolved_by (
          id,
          email,
          full_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (resolved !== null) {
      query = query.eq('resolved', resolved === 'true');
    }

    const { data: logs, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get statistics
    const stats = {
      total: count || 0,
      critical: logs?.filter(l => l.severity === 'critical').length || 0,
      error: logs?.filter(l => l.severity === 'error').length || 0,
      warning: logs?.filter(l => l.severity === 'warning').length || 0,
      info: logs?.filter(l => l.severity === 'info').length || 0,
      resolved: logs?.filter(l => l.resolved).length || 0,
      unresolved: logs?.filter(l => !l.resolved).length || 0,
    };

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error: any) {
    console.error('Admin error logs API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark error as resolved
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const supabase = createSupabaseServerClient();

    const { logId, resolved } = await request.json();

    if (!logId) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const updateData: any = {
      resolved: resolved === true,
      updated_at: new Date().toISOString(),
    };

    if (resolved === true) {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.id;
    } else {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { data, error } = await supabase
      .from('error_logs')
      .update(updateData)
      .eq('id', logId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, log: data });
  } catch (error: any) {
    console.error('Admin update error log API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}