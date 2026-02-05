import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { getCurrentUser } from '@/lib/auth';
import { KeywordTracker } from '@/lib/seo/keyword-tracker';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServerClient();

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
    const firstProject = Array.isArray(keywords[0]?.projects) ? keywords[0].projects[0] : keywords[0]?.projects;
    if (!firstProject || firstProject.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const tracker = new KeywordTracker();
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Update rankings for each keyword
    let quotaExhausted = false;
    
    for (const keyword of keywords) {
      try {
        // If quota is exhausted, skip remaining keywords
        if (quotaExhausted) {
          results.push({
            keyword_id: keyword.id,
            keyword: keyword.keyword,
            error: 'API quota exhausted - skipped',
          });
          continue;
        }

        const project = Array.isArray(keyword.projects) ? keyword.projects[0] : keyword.projects;
        const ranking = await tracker.getRanking(
          keyword.keyword,
          project?.domain || '',
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
          // Update existing (only if we got a valid ranking)
          if (ranking.rank !== null) {
            await supabase
              .from('keyword_rankings')
              .update({
                rank: ranking.rank,
                url: ranking.url,
                title: ranking.title,
              })
              .eq('id', existing.id);
          }
        } else {
          // Create new (only if we got a valid ranking)
          if (ranking.rank !== null) {
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
        }

        results.push({
          keyword_id: keyword.id,
          keyword: keyword.keyword,
          ranking: ranking.rank,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error updating ranking for keyword ${keyword.keyword}:`, errorMessage);
        
        // Check if it's a quota exhaustion error
        if (errorMessage === 'SERPAPI_QUOTA_EXHAUSTED' || errorMessage.includes('quota') || errorMessage.includes('run out of searches')) {
          quotaExhausted = true;
          results.push({
            keyword_id: keyword.id,
            keyword: keyword.keyword,
            error: 'API quota exhausted. Remaining keywords were not updated.',
          });
        } else {
          results.push({
            keyword_id: keyword.id,
            keyword: keyword.keyword,
            error: errorMessage,
          });
        }
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
