import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { buildAdvancedRankReport } from '@/lib/seo/rank-advanced';

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('project_id');
    if (!projectId) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
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

    const report = await buildAdvancedRankReport({
      projectId,
      userId: user.id,
      domain: project.domain,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Advanced rankings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to build report' },
      { status: 500 }
    );
  }
}
