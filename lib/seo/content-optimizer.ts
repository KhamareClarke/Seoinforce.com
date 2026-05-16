import axios from 'axios';
import { analyzeReadability } from './readability';
import { KeywordTracker } from './keyword-tracker';
import { buildContentOptimizationChecklist, type ContentChecklistResult } from './content-checklist';
import { fetchPageLoadSeconds } from './pagespeed-lite';

let cheerioModule: any;
async function loadCheerio() {
  if (!cheerioModule) {
    const mod = await import('cheerio');
    cheerioModule = (mod as any).default || mod;
  }
  return cheerioModule;
}

const LSI_BY_SEED: Record<string, string[]> = {
  seo: [
    'search engine optimization',
    'ranking factors',
    'backlinks',
    'on-page SEO',
    'technical SEO',
    'organic traffic',
    'SERP',
    'meta tags',
  ],
  marketing: ['conversion', 'audience', 'campaign', 'ROI', 'content strategy', 'analytics'],
};

function extractMainText($: ReturnType<Awaited<ReturnType<typeof loadCheerio>>['load']>): string {
  $('script, style, nav, footer, header, aside, noscript').remove();
  const main =
    $('article').text() ||
    $('main').text() ||
    $('[role="main"]').text() ||
    $('.content, #content, .post-content').text() ||
    $('body').text();
  return main.replace(/\s+/g, ' ').trim();
}

export type ContentOptimizeResult = {
  url: string;
  targetKeyword: string;
  analyzedAt: string;
  contentAnalysis: {
    wordCount: number;
    keywordMentions: number;
    keywordDensityPercent: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    listCount: number;
    internalLinks: number;
    externalLinks: number;
    images: number;
    imagesWithAlt: number;
    keywordInTitle: boolean;
    keywordInH1: boolean;
    keywordInFirst100Words: boolean;
  };
  readability: ReturnType<typeof analyzeReadability>;
  keywordOptimization: {
    score: number;
    maxScore: number;
    variationsFound: string[];
    lsiKeywordsFound: string[];
    recommendations: string[];
  };
  contentGaps: {
    topicsCompetitorsCover: string[];
    yourMissingTopics: string[];
    topRecommendation: string | null;
  };
  topicCluster: {
    pillarTopic: string;
    suggestedClusters: string[];
    internalLinkingNote: string;
  };
  overallScore: number;
  checklist: ContentChecklistResult;
};

export async function optimizeContent(args: {
  url: string;
  targetKeyword: string;
  location?: string;
}): Promise<ContentOptimizeResult> {
  const targetKeyword = args.targetKeyword.trim();
  const kwLower = targetKeyword.toLowerCase();
  const pageUrl = args.url;

  const [res, pageLoadSeconds] = await Promise.all([
    axios.get(pageUrl, {
      timeout: 20000,
      headers: { 'User-Agent': 'Mozilla/5.0 SEOInForce ContentAnalyzer' },
      maxRedirects: 5,
    }),
    fetchPageLoadSeconds(pageUrl),
  ]);

  const Cheerio = await loadCheerio();
  const $ = Cheerio.load(res.data as string);
  const host = new URL(pageUrl).hostname;
  const title = $('title').text().trim();
  const h1 = $('h1').first().text().trim();
  const text = extractMainText($);
  const words = text.match(/\b[\w']+\b/g) || [];
  const wordCount = words.length;
  const lower = text.toLowerCase();

  const keywordMentions = (lower.match(new RegExp(kwLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const keywordDensityPercent =
    wordCount > 0 ? Math.round((keywordMentions / wordCount) * 10000) / 100 : 0;

  const first100 = words.slice(0, 100).join(' ').toLowerCase();
  const keywordInFirst100Words = first100.includes(kwLower);

  const readability = analyzeReadability(text);

  const variationsFound: string[] = [];
  const seed = kwLower.split(/\s+/)[0];
  const variations = [
    targetKeyword.replace(/tips?/i, 'advice'),
    targetKeyword.replace(/seo/i, 'search engine optimization'),
  ].filter((v) => v !== targetKeyword && lower.includes(v.toLowerCase()));
  variationsFound.push(...variations);

  const lsiPool = LSI_BY_SEED[seed] || LSI_BY_SEED.seo;
  const lsiKeywordsFound = lsiPool.filter((term) => lower.includes(term.toLowerCase()));

  const recommendations: string[] = [];
  let kwScore = 0;
  if ($('title').text().toLowerCase().includes(kwLower)) kwScore += 2;
  else recommendations.push('Add target keyword to title tag');
  if (h1.toLowerCase().includes(kwLower)) kwScore += 2;
  else recommendations.push('Include keyword in H1');
  if (keywordInFirst100Words) kwScore += 2;
  else recommendations.push('Use keyword in the first 100 words');
  if (keywordDensityPercent >= 0.5 && keywordDensityPercent <= 3) kwScore += 2;
  else if (keywordDensityPercent < 0.5) recommendations.push('Increase natural keyword mentions (aim 1–2% density)');
  else recommendations.push('Reduce keyword density — may look spammy');
  if (lsiKeywordsFound.length >= 3) kwScore += 2;
  else recommendations.push('Add related LSI terms (synonyms, related concepts)');

  const contentGaps = await findContentGaps(targetKeyword, args.location);

  const h2Texts = $('h2')
    .map((_: unknown, el: unknown) => $(el as never).text().trim())
    .get()
    .filter(Boolean);
  const suggestedClusters = [
    'On-Page SEO',
    'Technical SEO',
    'Link Building',
    'Keyword Research',
    'Content Optimization',
  ].filter((c) => !h2Texts.some((h: string) => h.toLowerCase().includes(c.toLowerCase())));

  const structureScore =
    ($('h1').length === 1 ? 10 : 0) +
    ($('h2').length >= 2 ? 10 : 0) +
    ($('ul, ol').length >= 1 ? 5 : 0) +
    (readability.fleschReadingEase >= 60 ? 10 : 0);

  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
  const hasViewport = Boolean($('meta[name="viewport"]').attr('content'));
  const hasSchema = $('script[type="application/ld+json"]').length > 0;
  const internalLinks = $(`a[href^="/"], a[href*="${host}"]`).length;
  const externalLinks = $('a[href^="http"]')
    .filter((_: unknown, el: unknown) => {
      const href = String($(el as never).attr('href') || '');
      return !href.includes(host);
    })
    .length;
  const imageCount = $('img').length;
  const imagesWithAlt = $('img[alt]')
    .filter((_: unknown, el: unknown) => Boolean(String($(el as never).attr('alt') || '').trim()))
    .length;

  const checklist = buildContentOptimizationChecklist({
    targetKeyword,
    wordCount,
    keywordDensityPercent,
    keywordInTitle: title.toLowerCase().includes(kwLower),
    keywordInH1: h1.toLowerCase().includes(kwLower),
    keywordInFirst100Words,
    keywordVariationsCount: variationsFound.length + (lsiKeywordsFound.length > 0 ? 1 : 0),
    fleschReadingEase: readability.fleschReadingEase,
    internalLinks,
    externalLinks,
    imageCount,
    imagesWithAlt,
    h1Count: $('h1').length,
    h2Count: $('h2').length,
    h3Count: $('h3').length,
    listCount: $('ul, ol').length,
    hasMetaDescription: metaDesc.length > 0,
    metaDescriptionLength: metaDesc.length,
    hasViewport,
    hasSchema,
    pageLoadSeconds,
  });

  const overallScore = Math.round((checklist.score / checklist.maxScore) * 100);

  return {
    url: args.url,
    targetKeyword: args.targetKeyword,
    analyzedAt: new Date().toISOString(),
    contentAnalysis: {
      wordCount,
      keywordMentions,
      keywordDensityPercent,
      h1Count: $('h1').length,
      h2Count: $('h2').length,
      h3Count: $('h3').length,
      listCount: $('ul, ol').length,
      internalLinks,
      externalLinks,
      images: imageCount,
      imagesWithAlt,
      keywordInTitle: title.toLowerCase().includes(kwLower),
      keywordInH1: h1.toLowerCase().includes(kwLower),
      keywordInFirst100Words,
    },
    readability,
    keywordOptimization: {
      score: kwScore,
      maxScore: 10,
      variationsFound,
      lsiKeywordsFound,
      recommendations,
    },
    contentGaps,
    topicCluster: {
      pillarTopic: `Complete guide to ${args.targetKeyword}`,
      suggestedClusters,
      internalLinkingNote:
        'Link pillar page to cluster pages and back; related clusters should cross-link.',
    },
    overallScore,
    checklist,
  };
}

async function findContentGaps(keyword: string, location?: string) {
  const topicsCompetitorsCover: string[] = [];
  const yourMissingTopics: string[] = [];

  if (!process.env.SERPAPI_KEY && !process.env.SCRAPEOPS_API_KEY) {
    return {
      topicsCompetitorsCover,
      yourMissingTopics,
      topRecommendation: 'Configure SERPAPI_KEY to compare against top-ranking pages',
    };
  }

  try {
    const tracker = new KeywordTracker();
    const serpKey = process.env.SERPAPI_KEY;
    if (!serpKey) {
      return { topicsCompetitorsCover, yourMissingTopics, topRecommendation: null };
    }

    const axios = (await import('axios')).default;
    const res = await axios.get('https://serpapi.com/search', {
      params: { api_key: serpKey, q: keyword, location: location || 'United Kingdom', num: 5 },
      timeout: 25000,
    });

    const organic = (res.data.organic_results || []) as Array<{ link?: string }>;
    const Cheerio = await loadCheerio();
    const topicCounts: Record<string, number> = {};

    for (const item of organic.slice(0, 5)) {
      if (!item.link) continue;
      try {
        const page = await axios.get(item.link, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = Cheerio.load(page.data);
        $('h2').each((_: unknown, el: unknown) => {
          const t = $(el as never).text().trim();
          if (t.length > 5) topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      } catch {
        /* skip */
      }
    }

    for (const [topic, count] of Object.entries(topicCounts).sort((a, b) => b[1] - a[1])) {
      if (count >= 2) topicsCompetitorsCover.push(`${topic} (${count}/5 top pages)`);
    }

    yourMissingTopics.push(
      ...topicsCompetitorsCover.slice(0, 5).map((t) => `Add section: ${t.split(' (')[0]}`)
    );
  } catch {
    /* optional */
  }

  return {
    topicsCompetitorsCover,
    yourMissingTopics,
    topRecommendation: yourMissingTopics[0] || null,
  };
}
