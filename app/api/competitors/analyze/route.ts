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

    const { projectId, competitorDomains } = await request.json();

    if (!projectId || !competitorDomains || !Array.isArray(competitorDomains)) {
      return NextResponse.json({ error: 'Project ID and competitor domains are required' }, { status: 400 });
    }

    // Get user's tracked keywords
    const { data: userKeywords } = await supabase
      .from('keywords')
      .select('keyword')
      .eq('project_id', projectId);

    const userKeywordSet = new Set(userKeywords?.map(k => k.keyword.toLowerCase()) || []);

    // Analyze each competitor
    const competitorAnalysis = [];

    for (const competitorDomain of competitorDomains) {
      try {
        // Get or create competitor record
        const { data: project } = await supabase
          .from('projects')
          .select('id, user_id')
          .eq('id', projectId)
          .single();

        if (!project || project.user_id !== user.id) {
          continue;
        }

        let { data: competitor } = await supabase
          .from('competitors')
          .select('id')
          .eq('project_id', projectId)
          .eq('domain', competitorDomain)
          .single();

        if (!competitor) {
          const { data: newCompetitor } = await supabase
            .from('competitors')
            .insert({
              project_id: projectId,
              domain: competitorDomain,
              name: competitorDomain,
            })
            .select()
            .single();
          competitor = newCompetitor;
        }

        // Get competitor keywords (real extraction from their website)
        // First extract keywords directly (before filtering by rank)
        const tracker = new KeywordTracker();
        const extractedKeywords = await tracker.extractKeywordsFromDomain(competitorDomain, 50);
        const competitorKeywordSet = new Set(extractedKeywords.map(k => k.toLowerCase()));
        
        // Also get ranked keywords for display
        const competitorKeywords = await tracker.getCompetitorKeywords(competitorDomain, 50);

        // Calculate overlap and missing keywords (using real extracted keywords)
        const overlap = Array.from(userKeywordSet).filter(k => competitorKeywordSet.has(k));
        const missing = Array.from(competitorKeywordSet).filter(k => !userKeywordSet.has(k));
        
        // Get actual missing keywords from competitor keywords list (not just counts)
        const missingKeywordsList = competitorKeywords
          .filter(kw => !userKeywordSet.has(kw.keyword.toLowerCase()))
          .slice(0, 10)
          .map(kw => kw.keyword);

        // Calculate competitor score (based on overlap ratio and missing opportunities)
        // More balanced scoring: reward overlap, penalize missing opportunities proportionally
        const overlapRatio = userKeywordSet.size > 0 ? overlap.length / userKeywordSet.size : 0;
        const overlapScore = overlapRatio * 100; // 0-100 based on overlap percentage
        
        // Missing penalty: proportional to tracked keywords, not absolute count
        // If you track 2 keywords and competitor has 49 more, that's a lot of opportunities
        // But we don't want to completely negate your overlap score
        // Penalty = (missing / (tracked + missing)) * 40, capped at 40
        const totalKeywords = userKeywordSet.size + missing.length;
        const missingRatio = totalKeywords > 0 ? missing.length / totalKeywords : 0;
        const missingPenalty = Math.min(missingRatio * 40, 40); // Max 40 point penalty
        
        // Score = overlap score - missing penalty, but ensure it's at least 0
        // This way, 50% overlap with many missing = 50 - 40 = 10 (still positive)
        const competitorScore = Math.max(0, Math.round(overlapScore - missingPenalty));

        competitorAnalysis.push({
          id: competitor?.id, // Include competitor ID for UI matching
          domain: competitorDomain,
          overlap: overlap.length,
          missing: missing.length,
          missingKeywords: missingKeywordsList.slice(0, 5), // Top 5 real keywords for display
          score: competitorScore,
        });

        // Save competitor keywords to database
        if (competitorKeywords.length > 0 && competitor?.id) {
          await supabase
            .from('competitor_keywords')
            .upsert(
              competitorKeywords.map(kw => ({
                competitor_id: competitor.id,
                keyword: kw.keyword,
                rank: kw.rank,
                search_volume: kw.search_volume,
                difficulty: kw.difficulty,
                url: kw.url,
              })),
              { onConflict: 'competitor_id,keyword' }
            );
        }
      } catch (error) {
        console.error(`Error analyzing competitor ${competitorDomain}:`, error);
        // Continue with other competitors
      }
    }

    // Calculate overall competitor score (average of all competitor scores)
    const overallScore = competitorAnalysis.length > 0
      ? Math.round(competitorAnalysis.reduce((sum, c) => sum + c.score, 0) / competitorAnalysis.length)
      : 0;

    return NextResponse.json({
      competitor_score: overallScore,
      competitors: competitorAnalysis,
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze competitors' },
      { status: 500 }
    );
  }
}
