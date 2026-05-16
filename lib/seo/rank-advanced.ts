import { createSupabaseServerClient } from '@/lib/supabase/client';
import { fetchSerpForKeyword } from '@/lib/seo/serp-fetch';

export type KeywordVolatility = {
  keywordId: string;
  keyword: string;
  volatilityScore: number;
  label: 'stable' | 'moderate' | 'high';
  changeCount30d: number;
};

export type KeywordSerpRow = {
  keywordId: string;
  keyword: string;
  device: string;
  organicPosition: number | null;
  mobilePosition: number | null;
  desktopPosition: number | null;
  features: {
    featuredSnippet: boolean;
    knowledgePanel: boolean;
    peopleAlsoAsk: boolean;
    localPack: boolean;
    imagePack: boolean;
    videoPack: boolean;
    newsPack: boolean;
  };
};

export type AdvancedRankReport = {
  generatedAt: string;
  volatility: KeywordVolatility[];
  serp: KeywordSerpRow[];
  summary: {
    keywordsTracked: number;
    avgVolatility: number;
    serpFeatureHits: number;
    mobileDesktopGap: number;
  };
};

function volatilityFromRanks(ranks: number[]): { score: number; label: KeywordVolatility['label'] } {
  if (ranks.length < 2) return { score: 0, label: 'stable' };
  const deltas: number[] = [];
  for (let i = 1; i < ranks.length; i++) {
    deltas.push(Math.abs(ranks[i - 1] - ranks[i]));
  }
  const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const score = Math.round(avg * 10) / 10;
  if (score >= 5) return { score, label: 'high' };
  if (score >= 2) return { score, label: 'moderate' };
  return { score, label: 'stable' };
}

export async function buildAdvancedRankReport(args: {
  projectId: string;
  userId: string;
  domain: string;
  maxKeywords?: number;
}): Promise<AdvancedRankReport> {
  const supabase = createSupabaseServerClient();
  const max = args.maxKeywords ?? 8;

  const { data: keywords } = await supabase
    .from('keywords')
    .select('id, keyword, device_type')
    .eq('project_id', args.projectId)
    .order('created_at', { ascending: false })
    .limit(max);

  const keywordIds = (keywords || []).map((k) => k.id);
  const { data: rankings } = keywordIds.length
    ? await supabase
        .from('keyword_rankings')
        .select('keyword_id, rank, checked_at')
        .in('keyword_id', keywordIds)
        .order('checked_at', { ascending: false })
    : { data: [] };

  const byKeyword = new Map<string, number[]>();
  for (const r of rankings || []) {
    if (r.rank == null) continue;
    const list = byKeyword.get(r.keyword_id) || [];
    list.push(r.rank);
    byKeyword.set(r.keyword_id, list);
  }

  const volatility: KeywordVolatility[] = (keywords || []).map((k) => {
    const ranks = (byKeyword.get(k.id) || []).slice(0, 30);
    const { score, label } = volatilityFromRanks(ranks);
    let changeCount30d = 0;
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] !== ranks[i - 1]) changeCount30d += 1;
    }
    return {
      keywordId: k.id,
      keyword: k.keyword,
      volatilityScore: score,
      label,
      changeCount30d,
    };
  });

  const serp: KeywordSerpRow[] = [];
  let serpFeatureHits = 0;
  let mobileDesktopGap = 0;

  for (const k of keywords || []) {
    const device = (k.device_type === 'mobile' ? 'mobile' : 'desktop') as 'desktop' | 'mobile';
    const primary = await fetchSerpForKeyword({
      keyword: k.keyword,
      domain: args.domain,
      device,
    });
    const altDevice = device === 'mobile' ? 'desktop' : 'mobile';
    const alt =
      process.env.SERPAPI_KEY?.trim() && (keywords || []).length <= 5
        ? await fetchSerpForKeyword({
            keyword: k.keyword,
            domain: args.domain,
            device: altDevice,
          })
        : null;

    const features = {
      featuredSnippet: primary.featuredSnippet,
      knowledgePanel: primary.knowledgePanel,
      peopleAlsoAsk: primary.peopleAlsoAsk,
      localPack: primary.localPack,
      imagePack: primary.imagePack,
      videoPack: primary.videoPack,
      newsPack: primary.newsPack,
    };
    if (Object.values(features).some(Boolean)) serpFeatureHits += 1;

    const desktopPos = device === 'desktop' ? primary.domainRank : alt?.domainRank ?? null;
    const mobilePos = device === 'mobile' ? primary.domainRank : alt?.domainRank ?? null;
    if (desktopPos != null && mobilePos != null) {
      mobileDesktopGap += Math.abs(desktopPos - mobilePos);
    }

    serp.push({
      keywordId: k.id,
      keyword: k.keyword,
      device: k.device_type || 'desktop',
      organicPosition: primary.domainRank,
      mobilePosition: mobilePos,
      desktopPosition: desktopPos,
      features,
    });

    if (primary.rawAvailable) {
      await supabase.from('keyword_serp_snapshots').upsert(
        {
          keyword_id: k.id,
          device_type: device,
          snapshot_date: new Date().toISOString().slice(0, 10),
          organic_position: primary.domainRank,
          serp_features: features,
          volatility_score: volatility.find((v) => v.keywordId === k.id)?.volatilityScore ?? 0,
        },
        { onConflict: 'keyword_id,device_type,snapshot_date' }
      );
    }
  }

  const avgVolatility =
    volatility.length > 0
      ? Math.round((volatility.reduce((s, v) => s + v.volatilityScore, 0) / volatility.length) * 10) / 10
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    volatility,
    serp,
    summary: {
      keywordsTracked: keywords?.length ?? 0,
      avgVolatility,
      serpFeatureHits,
      mobileDesktopGap,
    },
  };
}
