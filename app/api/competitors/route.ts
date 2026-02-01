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

    let query = supabase
      .from('competitors')
      .select(`
        *,
        projects!inner(user_id)
      `);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: competitors, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch competitors' }, { status: 500 });
    }

    // Filter by user ownership
    const userCompetitors = competitors?.filter((c: any) => c.projects?.user_id === user.id) || [];

    return NextResponse.json({ competitors: userCompetitors });
  } catch (error) {
    console.error('Get competitors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, domain, name } = await request.json();

    if (!projectId || !domain) {
      return NextResponse.json({ error: 'Project ID and domain are required' }, { status: 400 });
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

    const { data: competitor, error } = await supabase
      .from('competitors')
      .insert({
        project_id: projectId,
        domain,
        name: name || domain,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create competitor' }, { status: 500 });
    }

    return NextResponse.json({ competitor });
  } catch (error) {
    console.error('Create competitor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('id');
    const { domain, name } = await request.json();

    if (!competitorId || !domain) {
      return NextResponse.json({ error: 'Competitor ID and domain are required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingCompetitor } = await supabase
      .from('competitors')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', competitorId)
      .single();

    if (!existingCompetitor || existingCompetitor.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    // Update competitor
    const { data: updatedCompetitor, error } = await supabase
      .from('competitors')
      .update({
        domain,
        name: name || domain,
      })
      .eq('id', competitorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update competitor' }, { status: 500 });
    }

    return NextResponse.json({ competitor: updatedCompetitor });
  } catch (error) {
    console.error('Update competitor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('id');

    if (!competitorId) {
      return NextResponse.json({ error: 'Competitor ID is required' }, { status: 400 });
    }

    // Verify ownership through project
    const { data: competitor } = await supabase
      .from('competitors')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', competitorId)
      .single();

    if (!competitor || competitor.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', competitorId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete competitor' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete competitor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
