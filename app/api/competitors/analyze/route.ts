import { NextRequest, NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/client';

import { getCurrentUser } from '@/lib/auth';

import { KeywordTracker } from '@/lib/seo/keyword-tracker';

import { handleCompetitorRankImprovement } from '@/lib/ghl/competitor-change-detector';

import { runCompetitorAnalysis } from '@/lib/seo/competitor-analysis';



export const maxDuration = 120;



export async function POST(request: NextRequest) {

  try {

    const user = await getCurrentUser(request);



    if (!user) {

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    }



    const supabase = createSupabaseServerClient();



    const { projectId, competitorDomains } = await request.json();



    if (!projectId || !competitorDomains || !Array.isArray(competitorDomains)) {

      return NextResponse.json(

        { error: 'Project ID and competitor domains are required' },

        { status: 400 }

      );

    }



    const { data: project } = await supabase

      .from('projects')

      .select('id, user_id, domain')

      .eq('id', projectId)

      .single();



    if (!project || project.user_id !== user.id) {

      return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    }



    const { data: userKeywords } = await supabase
      .from('keywords')
      .select('id, keyword')
      .eq('project_id', projectId);

    const yourKeywordRows: Array<{
      keyword: string;
      rank?: number | null;
    }> = [];

    for (const kw of userKeywords ?? []) {
      const { data: latestRank } = await supabase
        .from('keyword_rankings')
        .select('rank')
        .eq('keyword_id', kw.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      yourKeywordRows.push({ keyword: kw.keyword, rank: latestRank?.rank ?? null });
    }



    const tracker = new KeywordTracker();

    const competitorAnalysis: Array<Record<string, unknown>> = [];



    for (const competitorDomain of competitorDomains) {

      try {

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



        const competitorKeywords = await tracker.getCompetitorKeywords(competitorDomain, 50);



        const analysis = await runCompetitorAnalysis({

          yourDomain: project.domain ?? '',

          competitorDomain,

          yourKeywords: yourKeywordRows,

          competitorKeywords,

          serpSampleSize: 3,

        });



        if (competitor?.id) {

          const { data: existingKws } = await supabase

            .from('competitor_keywords')

            .select('keyword, rank')

            .eq('competitor_id', competitor.id);



          const prevByKeyword = new Map(

            (existingKws ?? []).map((r) => [r.keyword.toLowerCase(), r.rank])

          );



          for (const kw of competitorKeywords) {

            const prev = prevByKeyword.get(kw.keyword.toLowerCase());

            handleCompetitorRankImprovement({

              userId: project.user_id,

              userDomain: project.domain ?? '',

              competitorDomain,

              keyword: kw.keyword,

              previousRank: prev,

              newRank: kw.rank,

            });

          }



          if (competitorKeywords.length > 0) {

            await supabase.from('competitor_keywords').upsert(

              competitorKeywords.map((kw) => ({

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



          await supabase.from('competitor_analysis').insert({

            project_id: projectId,

            competitor_id: competitor.id,

            your_domain: project.domain,

            competitor_domain: competitorDomain,

            keyword_overlap: analysis.keywordOverlap,

            backlink_gaps: analysis.backlinkGaps,

            serp_features: analysis.serpFeatures,

            rank_comparisons: analysis.rankComparisons,

            content_strategy: analysis.contentStrategy,

            overall_score: analysis.overallScore,

          });

        }



        competitorAnalysis.push({

          id: competitor?.id,

          domain: competitorDomain,

          score: analysis.overallScore,

          overlap: analysis.keywordOverlap.sharedCount,

          missing: analysis.keywordOverlap.opportunityCount,

          missingKeywords: analysis.keywordOverlap.opportunities

            .slice(0, 5)

            .map((o) => o.keyword),

          analysis,

        });

      } catch (error) {

        console.error(`Error analyzing competitor ${competitorDomain}:`, error);

      }

    }



    const overallScore =

      competitorAnalysis.length > 0

        ? Math.round(

            competitorAnalysis.reduce((sum, c) => sum + ((c.score as number) || 0), 0) /

              competitorAnalysis.length

          )

        : 0;



    return NextResponse.json({

      competitor_score: overallScore,

      competitors: competitorAnalysis,

    });

  } catch (error) {

    console.error('Competitor analysis error:', error);

    return NextResponse.json({ error: 'Failed to analyze competitors' }, { status: 500 });

  }

}


