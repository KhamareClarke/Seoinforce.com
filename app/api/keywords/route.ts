import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import { KeywordTracker } from '@/lib/seo/keyword-tracker';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, keyword, location = 'United Kingdom', deviceType = 'desktop' } = await request.json();

    if (!projectId || !keyword) {
      return NextResponse.json({ error: 'Project ID and keyword are required' }, { status: 400 });
    }

    // Check if keyword already exists
    const { data: existing } = await supabase
      .from('keywords')
      .select('id')
      .eq('project_id', projectId)
      .eq('keyword', keyword)
      .eq('location', location)
      .eq('device_type', deviceType)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Keyword already tracked' }, { status: 400 });
    }

    // Get project to verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('domain, user_id')
      .eq('id', projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check keyword limit (free: 20, starter: 100, growth: 1000, empire: unlimited)
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', user.id)
      .single();

    const limits: Record<string, number> = {
      free: 20,
      starter: 100,
      growth: 1000,
      empire: 999999,
    };

    const limit = limits[profile?.plan_type || 'free'] || 20;

    const { count } = await supabase
      .from('keywords')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: `Keyword limit reached. Upgrade to track more keywords.` },
        { status: 403 }
      );
    }

    // Create keyword
    const { data: keywordRecord, error: keywordError } = await supabase
      .from('keywords')
      .insert({
        project_id: projectId,
        keyword,
        location,
        device_type: deviceType,
      })
      .select()
      .single();

    if (keywordError) {
      return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 });
    }

    // Get initial ranking
    const tracker = new KeywordTracker();
    const ranking = await tracker.getRanking(keyword, project.domain, location);

    // Save ranking
    await supabase
      .from('keyword_rankings')
      .insert({
        keyword_id: keywordRecord.id,
        rank: ranking.rank,
        url: ranking.url,
        title: ranking.title,
        date: new Date().toISOString().split('T')[0],
      });

    return NextResponse.json({
      keyword: keywordRecord,
      initial_ranking: ranking,
    });
  } catch (error) {
    console.error('Keyword API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerComponentClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const keywordId = searchParams.get('keyword_id');

    if (keywordId) {
      const { data: keyword, error } = await supabase
        .from('keywords')
        .select(`
          *,
          projects!inner(user_id),
          keyword_rankings(*)
        `)
        .eq('id', keywordId)
        .single();

      if (error || keyword.projects.user_id !== user.id) {
        return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
      }

      return NextResponse.json({ keyword });
    }

    if (projectId) {
      const { data: keywords, error } = await supabase
        .from('keywords')
        .select(`
          *,
          projects!inner(user_id),
          keyword_rankings(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
      }

      return NextResponse.json({ keywords });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Get keywords error:', error);
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
    const keywordId = searchParams.get('id');
    const { keyword } = await request.json();

    if (!keywordId || !keyword) {
      return NextResponse.json({ error: 'Keyword ID and keyword text are required' }, { status: 400 });
    }

    // Verify ownership
    const { data: existingKeyword } = await supabase
      .from('keywords')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', keywordId)
      .single();

    if (!existingKeyword || existingKeyword.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Update keyword
    const { data: updatedKeyword, error } = await supabase
      .from('keywords')
      .update({ keyword })
      .eq('id', keywordId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 });
    }

    return NextResponse.json({ keyword: updatedKeyword });
  } catch (error) {
    console.error('Update keyword error:', error);
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
    const keywordId = searchParams.get('id');

    if (!keywordId) {
      return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: keyword } = await supabase
      .from('keywords')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', keywordId)
      .single();

    if (!keyword || keyword.projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Keyword not found' }, { status: 404 });
    }

    // Delete keyword (cascade will delete rankings)
    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('id', keywordId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete keyword error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
