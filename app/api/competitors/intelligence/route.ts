import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import type { CompetitorAnalysisResult } from '@/lib/seo/competitor-analysis';

function rowToAnalysis(row: Record<string, unknown>): CompetitorAnalysisResult {
  return {
    competitorDomain: String(row.competitor_domain || ''),
    yourDomain: String(row.your_domain || ''),
    analyzedAt: String(row.created_at || new Date().toISOString()),
    overallScore: Number(row.overall_score || 0),
    keywordOverlap: (row.keyword_overlap as CompetitorAnalysisResult['keywordOverlap']) || {
      shared: [],
      opportunities: [],
      advantages: [],
      sharedCount: 0,
      opportunityCount: 0,
      advantageCount: 0,
    },
    backlinkGaps: (row.backlink_gaps as CompetitorAnalysisResult['backlinkGaps']) || {
      yourTotal: 0,
      yourReferringDomains: 0,
      competitorTotal: 0,
      competitorReferringDomains: 0,
      gapTotal: 0,
      recommendedTargets: [],
    },
    serpFeatures: (row.serp_features as CompetitorAnalysisResult['serpFeatures']) || {
      samples: [],
      summary: '',
    },
    rankComparisons: (row.rank_comparisons as CompetitorAnalysisResult['rankComparisons']) || [],
    contentStrategy: (row.content_strategy as CompetitorAnalysisResult['contentStrategy']) || {
      topics: [],
      blogPostsFound: 0,
      avgWordCountEstimate: 0,
      contentGaps: [],
      recommendations: [],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('project_id');
    const competitorId = request.nextUrl.searchParams.get('competitor_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    let query = supabase
      .from('competitor_analysis')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(competitorId ? 1 : 20);

    if (competitorId) {
      query = query.eq('competitor_id', competitorId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const analyses = (data || []).map((row) => ({
      id: row.id,
      competitorId: row.competitor_id,
      competitorDomain: row.competitor_domain,
      createdAt: row.created_at,
      analysis: rowToAnalysis(row as Record<string, unknown>),
    }));

    return NextResponse.json({ analyses });
  } catch (error) {
    console.error('Competitor intelligence GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load intelligence' },
      { status: 500 }
    );
  }
}
