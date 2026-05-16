import axios from 'axios';

export type SerpFeatureSnapshot = {
  keyword: string;
  hasFeaturedSnippet: boolean;
  hasKnowledgePanel: boolean;
  hasPeopleAlsoAsk: boolean;
  hasLocalPack: boolean;
  hasImagePack: boolean;
  hasVideoPack: boolean;
  hasNewsPack: boolean;
  featuredSnippetDomain: string | null;
  yourRank: number | null;
  competitorRank: number | null;
  opportunities: string[];
};

/** Parse SerpAPI / ScrapeOps SERP JSON for feature flags (sample keywords). */
export async function fetchSerpFeaturesForKeyword(
  keyword: string,
  yourDomain: string,
  competitorDomain: string,
  location = 'United Kingdom'
): Promise<SerpFeatureSnapshot> {
  const clean = (d: string) =>
    d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

  const you = clean(yourDomain);
  const them = clean(competitorDomain);
  const opportunities: string[] = [];

  let data: Record<string, unknown> = {};

  const serpKey = process.env.SERPAPI_KEY;
  if (serpKey) {
    try {
      const res = await axios.get('https://serpapi.com/search', {
        params: { api_key: serpKey, q: keyword, location, num: 20 },
        timeout: 25000,
      });
      data = res.data as Record<string, unknown>;
    } catch {
      /* fall through */
    }
  }

  const organic = (data.organic_results as Array<{ link?: string; position?: number }>) || [];
  let yourRank: number | null = null;
  let competitorRank: number | null = null;
  for (const r of organic) {
    const link = (r.link || '').toLowerCase();
    if (yourRank == null && link.includes(you)) yourRank = r.position ?? null;
    if (competitorRank == null && link.includes(them)) competitorRank = r.position ?? null;
  }

  const fs = data.featured_snippet as { link?: string } | undefined;
  const fsDomain = fs?.link ? clean(new URL(fs.link.startsWith('http') ? fs.link : `https://${fs.link}`).hostname) : null;
  const hasFeaturedSnippet = Boolean(fs);
  const hasKnowledgePanel = Boolean(data.knowledge_graph);
  const related = (data.related_questions as unknown[]) || [];
  const hasPeopleAlsoAsk = related.length > 0;
  const hasLocalPack = Boolean(data.local_results);
  const hasImagePack = Boolean((data.inline_images as unknown[])?.length);
  const hasVideoPack = Boolean((data.video_results as unknown[])?.length);
  const hasNewsPack = Boolean((data.news_results as unknown[])?.length);

  if (hasFeaturedSnippet && fsDomain !== you) {
    opportunities.push('Featured snippet held by another site — optimize for answer format');
  }
  if (!hasFeaturedSnippet) {
    opportunities.push('No featured snippet — opportunity to claim with concise answer block');
  }
  if (hasPeopleAlsoAsk) {
    opportunities.push('Target People Also Ask questions in FAQ section');
  }
  if (hasLocalPack) {
    opportunities.push('Local pack present — ensure Google Business Profile is optimized');
  }

  return {
    keyword,
    hasFeaturedSnippet,
    hasKnowledgePanel,
    hasPeopleAlsoAsk,
    hasLocalPack,
    hasImagePack,
    hasVideoPack,
    hasNewsPack,
    featuredSnippetDomain: fsDomain,
    yourRank,
    competitorRank,
    opportunities,
  };
}
