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

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get all keywords for this project
    const { data: keywords, error: keywordsError } = await supabase
      .from('keywords')
      .select(`
        *,
        projects!inner(user_id, domain)
      `)
      .eq('project_id', projectId);

    if (keywordsError || !keywords || keywords.length === 0) {
      return NextResponse.json({ error: 'No keywords found' }, { status: 404 });
    }

    // Verify ownership
    if (keywords[0].projects.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tracker = new KeywordTracker();
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Update rankings for each keyword
    for (const keyword of keywords) {
      try {
        const ranking = await tracker.getRanking(
          keyword.keyword,
          keyword.projects.domain,
          keyword.location
        );

        // Check if ranking already exists for today
        const { data: existing } = await supabase
          .from('keyword_rankings')
          .select('id')
          .eq('keyword_id', keyword.id)
          .eq('date', today)
          .single();

        if (existing) {
          // Update existing
          await supabase
            .from('keyword_rankings')
            .update({
              rank: ranking.rank,
              url: ranking.url,
              title: ranking.title,
            })
            .eq('id', existing.id);
        } else {
          // Create new
          await supabase
            .from('keyword_rankings')
            .insert({
              keyword_id: keyword.id,
              rank: ranking.rank,
              url: ranking.url,
              title: ranking.title,
              date: today,
            });
        }

        results.push({
          keyword_id: keyword.id,
          keyword: keyword.keyword,
          ranking: ranking.rank,
        });
      } catch (error) {
        console.error(`Error updating ranking for keyword ${keyword.keyword}:`, error);
        results.push({
          keyword_id: keyword.id,
          keyword: keyword.keyword,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: results.length,
      results,
    });
  } catch (error) {
    console.error('Update rankings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
