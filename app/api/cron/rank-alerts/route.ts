import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';
import { KeywordTracker } from '@/lib/seo/keyword-tracker';
import { handleKeywordRankChange } from '@/lib/ghl/rank-change-detector';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorizeCron(request: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET ?? '').trim();
  if (!secret) return process.env.NODE_ENV === 'development';
  const hdr = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const q = request.nextUrl.searchParams.get('secret') ?? '';
  return hdr === secret || q === secret;
}

/**
 * POST /api/cron/rank-alerts — refresh keyword ranks and fire Workflow 2 GHL/SMS alerts.
 * Schedule daily in Vercel cron or external scheduler. Requires CRON_SECRET in production.
 */
export async function POST(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseServerClient();
  const tracker = new KeywordTracker();
  const today = new Date().toISOString().split('T')[0];

  const { data: keywords, error } = await supabase
    .from('keywords')
    .select(
      `
      id,
      keyword,
      location,
      project_id,
      projects!inner(id, user_id, domain)
    `
    )
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let processed = 0;
  let alerts = 0;

  for (const row of keywords ?? []) {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    if (!project?.user_id || !project?.domain) continue;

    const { data: history } = await supabase
      .from('keyword_rankings')
      .select('rank, date')
      .eq('keyword_id', row.id)
      .order('date', { ascending: false })
      .limit(2);

    const previousRank =
      history?.find((h) => h.date !== today)?.rank ?? history?.[1]?.rank ?? null;

    try {
      const ranking = await tracker.getRanking(row.keyword, project.domain, row.location);
      if (ranking.rank == null) continue;

      const before = previousRank;
      handleKeywordRankChange({
        userId: project.user_id,
        domain: project.domain,
        keyword: row.keyword,
        previousRank: before,
        newRank: ranking.rank,
      });
      if (
        before != null &&
        ranking.rank != null &&
        Math.abs(ranking.rank - before) >= 5
      ) {
        alerts += 1;
      }

      const { data: existing } = await supabase
        .from('keyword_rankings')
        .select('id')
        .eq('keyword_id', row.id)
        .eq('date', today)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from('keyword_rankings')
          .update({ rank: ranking.rank, url: ranking.url, title: ranking.title })
          .eq('id', existing.id);
      } else {
        await supabase.from('keyword_rankings').insert({
          keyword_id: row.id,
          rank: ranking.rank,
          url: ranking.url,
          title: ranking.title,
          date: today,
        });
      }

      processed += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('QUOTA') || msg.includes('quota')) break;
      console.warn('cron rank-alerts keyword', row.keyword, msg);
    }
  }

  return NextResponse.json({ ok: true, processed, alertsTriggered: alerts, date: today });
}
