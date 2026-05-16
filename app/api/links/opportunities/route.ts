import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { findLinkOpportunities } from '@/lib/seo/link-opportunities';

export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const projectId = typeof body.projectId === 'string' ? body.projectId : '';
    const competitorDomain =
      typeof body.competitorDomain === 'string' ? body.competitorDomain.trim() : undefined;
    const niche = typeof body.niche === 'string' ? body.niche.trim() : undefined;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, domain, user_id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const report = await findLinkOpportunities({
      yourDomain: project.domain,
      competitorDomain,
      niche,
    });

    await supabase.from('link_opportunity_runs').insert({
      project_id: projectId,
      your_domain: project.domain,
      competitor_domain: competitorDomain || null,
      opportunities: report.opportunities,
      summary: report.summary,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Link opportunities error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to find opportunities' },
      { status: 500 }
    );
  }
}
