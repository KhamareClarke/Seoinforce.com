import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get backlinks for the project
    const { data: backlinks, error } = await supabase
      .from('backlinks')
      .select(`
        *,
        projects!inner(user_id)
      `)
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
