import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get backlinks for the project
    const { data: backlinks, error } = await supabase
      .from('backlinks')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: 'Failed to fetch backlinks' }, { status: 500 });
    }

    // Get backlink history
    const { data: history } = await supabase
      .from('backlink_history')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      backlinks: backlinks || null,
      history: history || [],
    });
  } catch (error) {
    console.error('Get backlinks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
