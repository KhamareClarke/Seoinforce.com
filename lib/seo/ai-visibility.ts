import axios from 'axios';

export interface AIVisibilitySignals {
  has_organization_schema: boolean;
  has_faq_schema: boolean;
  has_article_schema: boolean;
  has_same_as_links: boolean;
  has_consistent_brand: boolean;
  has_author_info: boolean;
  has_about_page: boolean;
  content_depth_score: number; // 0-100
  structured_data_count: number;
}

export interface AIPlatformEstimate {
  estimated_visibility: 'not_visible' | 'low' | 'moderate' | 'high';
  basis: string;
}

export interface AIQueryResult {
  query: string;
  mentioned: boolean;
  context?: string;
}

export interface AIVisibilityResult {
  score: number; // 0-100
  visibility_level: 'not_visible' | 'low' | 'moderate' | 'high' | 'dominant';
  mode: 'heuristic' | 'simulated';
  signals: AIVisibilitySignals;
  platform_estimates: {
    chatgpt: AIPlatformEstimate;
    gemini: AIPlatformEstimate;
    perplexity: AIPlatformEstimate;
  };
  query_results?: AIQueryResult[];
  recommendations: string[];
  last_checked: Date;
}

function levelFromScore(score: number): AIVisibilityResult['visibility_level'] {
  if (score >= 80) return 'dominant';
  if (score >= 60) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'not_visible';
}

function platformEstimate(score: number, platformName: string): AIPlatformEstimate {
  if (score >= 70) return { estimated_visibility: 'high', basis: `${platformName} likely surfaces your brand for relevant queries` };
  if (score >= 45) return { estimated_visibility: 'moderate', basis: `${platformName} may mention your brand in some niche contexts` };
  if (score >= 25) return { estimated_visibility: 'low', basis: `${platformName} rarely surfaces your brand — more signals needed` };
  return { estimated_visibility: 'not_visible', basis: `${platformName} does not have sufficient signals to surface your brand` };
}

export class AIVisibilityChecker {
  private domain: string;
  private baseUrl: string;

  constructor(domain: string) {
    this.domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.baseUrl = `https://${this.domain}`;
  }

  async check(): Promise<AIVisibilityResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Always run heuristic pass first (fast, no API cost)
    const { signals, heuristicScore, brandName } = await this.runHeuristicPass();

    if (apiKey) {
      return this.runSimulatedPass(signals, heuristicScore, brandName, apiKey);
    }

    return this.buildHeuristicResult(signals, heuristicScore);
  }

  private async runHeuristicPass(): Promise<{ signals: AIVisibilitySignals; heuristicScore: number; brandName: string }> {
    let html = '';
    let brandName = this.domain.split('.')[0];

    try {
      const res = await axios.get(this.baseUrl, {
        timeout: 12000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOInForce/1.0)' },
        maxRedirects: 5,
      });
      html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
    } catch {
      // Return low-signal result if unreachable
      const signals = this.emptySignals();
      return { signals, heuristicScore: 5, brandName };
    }

    // Extract brand name from OG or title
    const ogSiteName = html.match(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i)?.[1];
    const titleText = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    brandName = ogSiteName || (titleText ? titleText.split(/[|–\-,]/)[0].trim() : brandName);

    // Schema detection
    const jsonLdBlocks = Array.from(html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))
      .map(m => { try { return JSON.parse(m[1]); } catch { return null; } })
      .filter(Boolean);

    const flatSchemas = jsonLdBlocks.flatMap((b: any) =>
      Array.isArray(b) ? b : b['@graph'] ? b['@graph'] : [b]
    );

    const types = flatSchemas.map((s: any) => (s['@type'] || '').toLowerCase());

    const has_organization_schema = types.some(t => ['organization', 'localbusiness', 'corporation', 'nonprofit'].includes(t));
    const has_faq_schema = types.some(t => t === 'faqpage' || t === 'question');
    const has_article_schema = types.some(t => ['article', 'blogposting', 'newsarticle', 'howto'].includes(t));
    const has_same_as_links = flatSchemas.some((s: any) => Array.isArray(s.sameAs) && s.sameAs.length > 0);
    const has_author_info = flatSchemas.some((s: any) => s.author || s.founder);

    // Brand consistency
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || '';
    const twitterTitle = html.match(/<meta[^>]+name="twitter:title"[^>]+content="([^"]+)"/i)?.[1] || '';
    const has_consistent_brand =
      brandName.length > 2 &&
      ((ogTitle.toLowerCase().includes(brandName.toLowerCase()) || twitterTitle.toLowerCase().includes(brandName.toLowerCase())));

    // About page signal (simple check — might be linked)
    const has_about_page = /href="[^"]*\/about[^"]*"/i.test(html) || /href="[^"]*about-us[^"]*"/i.test(html);

    // Content depth (rough word count)
    const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = bodyText.split(' ').filter(w => w.length > 3).length;
    const content_depth_score = Math.min(100, Math.round((wordCount / 2000) * 100));

    const signals: AIVisibilitySignals = {
      has_organization_schema,
      has_faq_schema,
      has_article_schema,
      has_same_as_links,
      has_consistent_brand,
      has_author_info,
      has_about_page,
      content_depth_score,
      structured_data_count: jsonLdBlocks.length,
    };

    const heuristicScore = this.calculateHeuristicScore(signals);
    return { signals, heuristicScore, brandName };
  }

  private calculateHeuristicScore(s: AIVisibilitySignals): number {
    let score = 10; // base
    if (s.has_organization_schema) score += 20;
    if (s.has_faq_schema) score += 12;
    if (s.has_article_schema) score += 10;
    if (s.has_same_as_links) score += 15;
    if (s.has_consistent_brand) score += 10;
    if (s.has_author_info) score += 8;
    if (s.has_about_page) score += 5;
    score += Math.round(s.content_depth_score * 0.1); // up to 10 pts from content
    return Math.min(100, score);
  }

  private buildHeuristicResult(signals: AIVisibilitySignals, score: number): AIVisibilityResult {
    return {
      score,
      visibility_level: levelFromScore(score),
      mode: 'heuristic',
      signals,
      platform_estimates: {
        chatgpt: platformEstimate(score, 'ChatGPT'),
        gemini: platformEstimate(score, 'Gemini'),
        perplexity: platformEstimate(score, 'Perplexity'),
      },
      recommendations: this.buildRecommendations(signals, score),
      last_checked: new Date(),
    };
  }

  private async runSimulatedPass(
    signals: AIVisibilitySignals,
    baseScore: number,
    brandName: string,
    apiKey: string
  ): Promise<AIVisibilityResult> {
    const queries = this.generateQueries(brandName);
    const queryResults: AIQueryResult[] = [];
    let mentionCount = 0;

    for (const query of queries) {
      try {
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            messages: [{ role: 'user', content: query }],
            system: `You are a helpful AI assistant. Answer the user's question based on your general knowledge. Be concise and factual. If you don't know specific businesses in a niche, say so honestly.`,
          },
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            timeout: 15000,
          }
        );

        const answer = response.data?.content?.[0]?.text || '';
        const domainWithoutTld = this.domain.split('.')[0].toLowerCase();
        const mentioned =
          answer.toLowerCase().includes(this.domain.toLowerCase()) ||
          answer.toLowerCase().includes(domainWithoutTld) ||
          (brandName.length > 3 && answer.toLowerCase().includes(brandName.toLowerCase()));

        if (mentioned) {
          mentionCount++;
          const idx = answer.toLowerCase().indexOf(brandName.toLowerCase());
          const context = idx >= 0 ? answer.slice(Math.max(0, idx - 40), idx + brandName.length + 80).trim() : undefined;
          queryResults.push({ query, mentioned: true, context });
        } else {
          queryResults.push({ query, mentioned: false });
        }
      } catch {
        queryResults.push({ query, mentioned: false });
      }
    }

    const mentionRate = queries.length > 0 ? (mentionCount / queries.length) * 100 : 0;
    const simulatedScore = Math.round(baseScore * 0.4 + mentionRate * 0.6);
    const finalScore = Math.min(100, Math.max(baseScore, simulatedScore));

    return {
      score: finalScore,
      visibility_level: levelFromScore(finalScore),
      mode: 'simulated',
      signals,
      platform_estimates: {
        chatgpt: platformEstimate(finalScore, 'ChatGPT'),
        gemini: platformEstimate(finalScore, 'Gemini'),
        perplexity: platformEstimate(finalScore, 'Perplexity'),
      },
      query_results: queryResults,
      recommendations: this.buildRecommendations(signals, finalScore),
      last_checked: new Date(),
    };
  }

  private generateQueries(brandName: string): string[] {
    const safeBrand = brandName.length > 2 ? brandName : this.domain;
    return [
      `What are some well-known businesses or tools similar to ${safeBrand}? List a few by name.`,
      `Tell me about ${safeBrand} — what do they do and are they reputable?`,
      `Who are the main competitors of ${safeBrand}?`,
      `Is ${safeBrand} a trusted company? What do people say about them?`,
      `Give me an overview of ${this.domain} — what services do they offer?`,
    ];
  }

  private buildRecommendations(s: AIVisibilitySignals, score: number): string[] {
    const recs: string[] = [];
    if (!s.has_organization_schema)
      recs.push('Add Organization or LocalBusiness JSON-LD schema — AI systems heavily rely on structured data to identify and describe your brand.');
    if (!s.has_faq_schema)
      recs.push('Add FAQ schema to key pages — FAQ content is frequently surfaced verbatim in AI answers.');
    if (!s.has_same_as_links)
      recs.push('Add sameAs links (Wikipedia, Wikidata, social profiles) inside your Organization schema — these establish entity authority for AI systems.');
    if (!s.has_consistent_brand)
      recs.push('Ensure your brand name is consistent across the page title, og:title, and twitter:title tags.');
    if (!s.has_article_schema)
      recs.push('Publish articles or guides with Article/BlogPosting schema — AI tools like Perplexity actively crawl and cite published content.');
    if (!s.has_author_info)
      recs.push('Add author or founder information to your schema and About page to strengthen E-E-A-T signals.');
    if (s.content_depth_score < 50)
      recs.push('Increase content depth on key pages (aim for 2,000+ words) — thin pages are rarely cited by AI search tools.');
    if (!s.has_about_page)
      recs.push('Create a dedicated /about page with your company story, team, and contact details.');
    if (score < 40)
      recs.push('Submit a press release or get coverage from industry publications — AI tools are more likely to cite brands that appear in reputable media.');
    return recs.slice(0, 5);
  }

  private emptySignals(): AIVisibilitySignals {
    return {
      has_organization_schema: false,
      has_faq_schema: false,
      has_article_schema: false,
      has_same_as_links: false,
      has_consistent_brand: false,
      has_author_info: false,
      has_about_page: false,
      content_depth_score: 0,
      structured_data_count: 0,
    };
  }
}
