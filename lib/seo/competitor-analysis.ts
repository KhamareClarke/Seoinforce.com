import { KeywordTracker } from './keyword-tracker';
import { BacklinkChecker } from './backlink-checker';
import { fetchSerpFeaturesForKeyword, type SerpFeatureSnapshot } from './serp-features';
import axios from 'axios';

let cheerioModule: typeof import('cheerio') | null = null;
async function loadCheerio() {
  if (!cheerioModule) {
    const mod = await import('cheerio');
    cheerioModule = (mod as { default?: typeof import('cheerio') }).default || mod;
  }
  return cheerioModule;
}

export type KeywordGapItem = {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  competitorRank?: number;
  yourRank?: number | null;
  opportunityScore: number;
  type: 'opportunity' | 'advantage' | 'shared';
};

export type CompetitorAnalysisResult = {
  competitorDomain: string;
  yourDomain: string;
  analyzedAt: string;
  overallScore: number;
  keywordOverlap: {
    shared: KeywordGapItem[];
    opportunities: KeywordGapItem[];
    advantages: KeywordGapItem[];
    sharedCount: number;
    opportunityCount: number;
    advantageCount: number;
  };
  backlinkGaps: {
    yourTotal: number;
    yourReferringDomains: number;
    competitorTotal: number;
    competitorReferringDomains: number;
    gapTotal: number;
    recommendedTargets: Array<{
      domain: string;
      estimatedAuthority: 'high' | 'medium';
      reason: string;
    }>;
    note?: string;
  };
  serpFeatures: {
    samples: SerpFeatureSnapshot[];
    summary: string;
  };
  rankComparisons: Array<{
    keyword: string;
    yourRank: number | null;
    competitorRank: number | null;
    positionsToBeat: number | null;
    leader: 'you' | 'competitor' | 'neither';
  }>;
  contentStrategy: {
    topics: string[];
    blogPostsFound: number;
    avgWordCountEstimate: number;
    contentGaps: string[];
    recommendations: string[];
  };
};

function scoreOpportunity(args: {
  competitorRank?: number;
  yourRank?: number | null;
  searchVolume?: number;
}): number {
  let score = 50;
  if (args.competitorRank && args.competitorRank <= 10) score += 25;
  if (args.yourRank == null || args.yourRank > 20) score += 15;
  if (args.searchVolume && args.searchVolume > 500) score += 10;
  return Math.min(100, score);
}

/** High-value outreach targets when per-link lists are unavailable (industry directories). */
const OUTREACH_SEED_TARGETS: Array<{ domain: string; estimatedAuthority: 'high' | 'medium'; reason: string }> = [
  { domain: 'forbes.com', estimatedAuthority: 'high', reason: 'Authority publication — guest post / expert quote' },
  { domain: 'huffpost.com', estimatedAuthority: 'high', reason: 'Contributor content opportunity' },
  { domain: 'techcrunch.com', estimatedAuthority: 'high', reason: 'Tech/startup coverage' },
  { domain: 'medium.com', estimatedAuthority: 'medium', reason: 'Publish thought leadership with backlinks' },
  { domain: 'linkedin.com', estimatedAuthority: 'medium', reason: 'Company page + article backlinks' },
];

export async function runCompetitorAnalysis(args: {
  yourDomain: string;
  competitorDomain: string;
  yourKeywords: Array<{ keyword: string; rank?: number | null; search_volume?: number; difficulty?: number }>;
  competitorKeywords: Array<{ keyword: string; rank: number; search_volume?: number; difficulty?: number }>;
  serpSampleSize?: number;
}): Promise<CompetitorAnalysisResult> {
  const tracker = new KeywordTracker();
  const backlinkChecker = new BacklinkChecker();
  const analyzedAt = new Date().toISOString();

  const yourMap = new Map(
    args.yourKeywords.map((k) => [k.keyword.toLowerCase(), k])
  );
  const compMap = new Map(
    args.competitorKeywords.map((k) => [k.keyword.toLowerCase(), k])
  );

  const shared: KeywordGapItem[] = [];
  const opportunities: KeywordGapItem[] = [];
  const advantages: KeywordGapItem[] = [];

  for (const [kw, comp] of compMap) {
    const yours = yourMap.get(kw);
    if (yours) {
      shared.push({
        keyword: comp.keyword,
        searchVolume: comp.search_volume ?? yours.search_volume,
        difficulty: comp.difficulty ?? yours.difficulty,
        competitorRank: comp.rank,
        yourRank: yours.rank ?? null,
        opportunityScore: scoreOpportunity({
          competitorRank: comp.rank,
          yourRank: yours.rank,
          searchVolume: comp.search_volume,
        }),
        type: 'shared',
      });
    } else {
      opportunities.push({
        keyword: comp.keyword,
        searchVolume: comp.search_volume,
        difficulty: comp.difficulty,
        competitorRank: comp.rank,
        yourRank: null,
        opportunityScore: scoreOpportunity({
          competitorRank: comp.rank,
          searchVolume: comp.search_volume,
        }),
        type: 'opportunity',
      });
    }
  }

  for (const [kw, yours] of yourMap) {
    if (!compMap.has(kw)) {
      advantages.push({
        keyword: yours.keyword,
        searchVolume: yours.search_volume,
        difficulty: yours.difficulty,
        yourRank: yours.rank ?? null,
        opportunityScore: 40,
        type: 'advantage',
      });
    }
  }

  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  advantages.sort((a, b) => b.opportunityScore - a.opportunityScore);

  const rankComparisons: CompetitorAnalysisResult['rankComparisons'] = [];
  const compareSet = new Set([...shared.map((s) => s.keyword), ...opportunities.slice(0, 15).map((o) => o.keyword)]);

  for (const keyword of compareSet) {
    const yours = yourMap.get(keyword.toLowerCase());
    const comp = compMap.get(keyword.toLowerCase());
    let yourRank = yours?.rank ?? null;
    let competitorRank = comp?.rank ?? null;

    if (yourRank == null && yours) {
      try {
        const r = await tracker.getRanking(keyword, args.yourDomain);
        yourRank = r.rank;
      } catch {
        /* skip */
      }
    }
    if (competitorRank == null || competitorRank === 0) {
      try {
        const r = await tracker.getRanking(keyword, args.competitorDomain);
        competitorRank = r.rank;
      } catch {
        /* skip */
      }
    }

    let leader: 'you' | 'competitor' | 'neither' = 'neither';
    let positionsToBeat: number | null = null;
    if (yourRank != null && competitorRank != null) {
      if (yourRank < competitorRank) leader = 'you';
      else if (competitorRank < yourRank) {
        leader = 'competitor';
        positionsToBeat = yourRank - competitorRank;
      }
    } else if (competitorRank != null) leader = 'competitor';

    rankComparisons.push({
      keyword,
      yourRank,
      competitorRank,
      positionsToBeat,
      leader,
    });
  }

  let yourBl = { total_count: 0, domain_count: 0 };
  let compBl = { total_count: 0, domain_count: 0 };
  try {
    yourBl = await backlinkChecker.getBacklinks(args.yourDomain);
    compBl = await backlinkChecker.getBacklinks(args.competitorDomain);
  } catch {
    /* optional */
  }

  const serpSamples: SerpFeatureSnapshot[] = [];
  const sampleKeywords = [...shared, ...opportunities]
    .slice(0, args.serpSampleSize ?? 3)
    .map((k) => k.keyword);
  for (const kw of sampleKeywords) {
    try {
      serpSamples.push(
        await fetchSerpFeaturesForKeyword(kw, args.yourDomain, args.competitorDomain)
      );
    } catch {
      /* skip */
    }
  }

  const contentStrategy = await analyzeCompetitorContent(args.competitorDomain, opportunities.slice(0, 10).map((o) => o.keyword));

  const overlapRatio =
    yourMap.size > 0 ? shared.length / Math.max(yourMap.size, 1) : 0;
  const overallScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(overlapRatio * 50 + Math.min(opportunities.length, 20) * 2 - Math.min(opportunities.length, 30))
    )
  );

  return {
    competitorDomain: args.competitorDomain,
    yourDomain: args.yourDomain,
    analyzedAt,
    overallScore,
    keywordOverlap: {
      shared: shared.slice(0, 50),
      opportunities: opportunities.slice(0, 50),
      advantages: advantages.slice(0, 50),
      sharedCount: shared.length,
      opportunityCount: opportunities.length,
      advantageCount: advantages.length,
    },
    backlinkGaps: {
      yourTotal: yourBl.total_count,
      yourReferringDomains: yourBl.domain_count,
      competitorTotal: compBl.total_count,
      competitorReferringDomains: compBl.domain_count,
      gapTotal: Math.max(0, compBl.total_count - yourBl.total_count),
      recommendedTargets: OUTREACH_SEED_TARGETS.slice(0, 20),
      note:
        compBl.total_count > yourBl.total_count
          ? 'Competitor has more backlinks — prioritize high-DA outreach targets below.'
          : 'You match or exceed competitor backlink volume at summary level.',
    },
    serpFeatures: {
      samples: serpSamples,
      summary:
        serpSamples.length > 0
          ? `${serpSamples.filter((s) => s.hasFeaturedSnippet).length}/${serpSamples.length} sampled keywords have featured snippets`
          : 'Add SERPAPI_KEY to enable SERP feature sampling',
    },
    rankComparisons: rankComparisons.slice(0, 30),
    contentStrategy,
  };
}

async function analyzeCompetitorContent(
  competitorDomain: string,
  gapKeywords: string[]
): Promise<CompetitorAnalysisResult['contentStrategy']> {
  const topics: string[] = [];
  const contentGaps: string[] = [];
  const recommendations: string[] = [];
  let blogPostsFound = 0;
  let totalWords = 0;

  try {
    const url = competitorDomain.startsWith('http') ? competitorDomain : `https://${competitorDomain}`;
    const res = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 SEOInForce Bot' },
    });
    const Cheerio = await loadCheerio();
    const $ = Cheerio.load(res.data as string);

    const blogLinks = $('a[href*="/blog"], a[href*="/article"], a[href*="/post"], a[href*="/news"]')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 10);
    blogPostsFound = new Set(blogLinks).size;

    $('h1, h2').each((_, el) => {
      const t = $(el).text().trim();
      if (t.length > 4 && t.length < 120) topics.push(t);
    });

    const bodyWords = $('article, main, .content, #content, body')
      .first()
      .text()
      .split(/\s+/)
      .filter(Boolean).length;
    totalWords = bodyWords;
  } catch {
    recommendations.push('Could not crawl competitor homepage — verify domain is reachable');
  }

  for (const kw of gapKeywords.slice(0, 5)) {
    contentGaps.push(`Create content targeting "${kw}" (competitor ranks, you do not)`);
  }

  if (blogPostsFound < 5) {
    recommendations.push('Competitor has limited visible blog content — opportunity to out-publish them');
  } else {
    recommendations.push(`Competitor publishes ~${blogPostsFound}+ content URLs — match frequency with pillar + cluster pages`);
  }

  return {
    topics: [...new Set(topics)].slice(0, 15),
    blogPostsFound,
    avgWordCountEstimate: blogPostsFound > 0 ? Math.round(totalWords / Math.max(blogPostsFound, 1)) : totalWords,
    contentGaps,
    recommendations,
  };
}
