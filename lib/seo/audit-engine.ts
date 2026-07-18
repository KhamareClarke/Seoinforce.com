import axios from 'axios';

// Dynamic import for cheerio to avoid build issues
let cheerioModule: any;
const loadCheerio = async () => {
  if (!cheerioModule) {
    const mod = await import('cheerio');
    cheerioModule = (mod as any).default || mod;
  }
  return cheerioModule;
};

export interface AuditResult {
  overall_score: number;
  technical_score: number;
  onpage_score: number;
  content_score: number;
  competitor_score: number;
  /** Category breakdown for reports (AIOSEO-style sections) */
  categories?: {
    basic_seo: number;
    advanced_seo: number;
    performance: number;
    security: number;
  };
  technical: {
    lcp?: number;
    fcp?: number;
    tti?: number;
    cls?: number;
    https: boolean;
    mobile: boolean;
    ssl_grade?: string;
    robots?: boolean;
    sitemap?: boolean;
    response_time_ms?: number | null;
    page_size_bytes?: number | null;
    request_count?: number | null;
    mixed_content_count?: number;
    redirect_chain_length?: number;
    sitemap_url_count?: number;
  };
  onpage: {
    title: { length: number; keyword: boolean; optimal: boolean; text?: string };
    description: { missing: boolean; tooLong: boolean; tooShort: boolean; length: number };
    h1: number;
    h2: number;
    h3: number;
    images: { total: number; missing: number; valid: number; alt_coverage_pct: number };
    canonical: boolean;
    robots: boolean;
    sitemap: boolean;
    open_graph: boolean;
    twitter_card: boolean;
    structured_data: boolean;
    favicon?: boolean;
    lang?: boolean;
    charset?: boolean;
    links: { internal: number; external: number; total: number; external_nofollow?: number };
    // Extended checks
    noindex?: boolean;
    heading_hierarchy_ok?: boolean;
    h1_text?: string;
    images_lazy?: number;
    images_with_dimensions?: number;
    schema_types?: string[];
    generic_anchors?: number;
    // Social, compliance, CMS, accessibility
    social_presence?: { facebook: boolean; instagram: boolean; linkedin: boolean; twitter: boolean; youtube: boolean };
    has_privacy_policy?: boolean;
    has_cookie_consent?: boolean;
    cms_detected?: string;
    accessibility_score?: number;
    // Depth checks
    third_party_scripts?: number;
    webp_images?: number;
    hreflang_count?: number;
  };
  content: {
    readability: number;
    word_count: number;
    keyword_density: Array<{ term: string; pct: number }>;
    duplicate: boolean;
    suggestions: string[];
  };
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info' | 'good';
    title: string;
    description: string;
    fix_suggestion: string;
    page_url?: string;
  }>;
  technical_deep?: import('./technical-deep').TechnicalDeepResult;
  backlinks?: {
    total_count: number;
    domain_count: number;
    anchor_text: Array<{ text: string; count: number }>;
    last_checked: Date;
  };
  local_seo?: import('./local-seo').LocalSEOData;
  ppc_signals?: import('./ppc-detection').PPCSignals;
  spell_check?: import('./spell-check').SpellCheckResult;
  local_grid?: import('./local-grid').LocalGridResult;
  local_rank?: import('./local-rank').LocalRankResult;
  security_headers?: import('./security-headers').SecurityHeadersResult;
}

type FetchResult = {
  html: string;
  responseTimeMs: number;
  pageSizeBytes: number;
  statusCode: number;
  finalUrl: string;
};

export class SEOAuditEngine {
  private domain: string;
  private baseUrl: string;
  private lastFetch: FetchResult | null = null;
  private responseHeaders: Record<string, string | string[]> = {};

  constructor(domain: string) {
    this.domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const originalProtocol = domain.match(/^https?:\/\//)?.[0]?.replace('://', '') || 'https';
    this.baseUrl = `${originalProtocol}://${this.domain}`;
  }

  async runAudit(): Promise<AuditResult> {
    try {
      const fetchResult = await this.fetchPage();
      this.lastFetch = fetchResult;
      const html = fetchResult.html;

      if (!html || html.length < 100) {
        throw new Error(
          'Page returned empty or minimal content. The site may require authentication or block automated access.'
        );
      }

      const botBlockPatterns = [
        /access denied.*bot|bot.*access denied/i,
        /you have been blocked/i,
        /cloudflare.*challenge|challenge.*cloudflare/i,
        /captcha.*required|required.*captcha/i,
        /please.*enable.*javascript.*to.*continue/i,
      ];

      const blockingScore = botBlockPatterns.filter((pattern: RegExp) => pattern.test(html)).length;
      if (
        blockingScore >= 2 ||
        html.includes('cf-browser-verification') ||
        html.includes('challenge-platform')
      ) {
        throw new Error(
          'Site appears to be blocking automated access or requires authentication. Try a different website or ensure the site allows public access.'
        );
      }

      const cheerioModule = await loadCheerio();
      const $ = cheerioModule.load(html);

      const [technicalBase, onpagePartial, content] = await Promise.all([
        this.checkTechnical($, fetchResult),
        Promise.resolve(this.checkOnPage($)),
        Promise.resolve(this.checkContent($)),
      ]);

      // PPC detection (fast regex — runs immediately)
      const { detectPPCSignals } = await import('./ppc-detection');
      const ppc_signals = detectPPCSignals(html);

      // Spell check on body text
      const { checkSpelling } = await import('./spell-check');
      const bodyTextForSpell = $('p, h1, h2, h3, h4, li')
        .map((_: any, el: any) => $(el).text())
        .get()
        .join(' ');
      const spell_check = checkSpelling(bodyTextForSpell);

      // Security headers
      const { checkSecurityHeaders } = await import('./security-headers');
      const security_headers = checkSecurityHeaders(this.responseHeaders);

      // Sitemap URL count (extend technical check)
      let sitemapUrlCount = 0;
      try {
        const sitemapRes = await axios.get(`${new URL(this.baseUrl).origin}/sitemap.xml`, {
          timeout: 6000,
        });
        sitemapUrlCount = (sitemapRes.data as string).match(/<loc>/g)?.length ?? 0;
      } catch {
        /* non-critical */
      }

      // Broken internal link spot-check (first 6 unique internal links)
      const internalHrefs: string[] = [];
      $('a[href]').each((_: any, el: any) => {
        const href = $(el).attr('href') || '';
        if (
          (href.startsWith('/') || href.includes(this.domain)) &&
          !href.startsWith('#') &&
          !href.startsWith('mailto:') &&
          !href.startsWith('tel:')
        ) {
          const full = href.startsWith('/') ? `${new URL(this.baseUrl).origin}${href}` : href;
          if (!internalHrefs.includes(full)) internalHrefs.push(full);
        }
      });
      const brokenLinks: string[] = [];
      await Promise.all(
        internalHrefs.slice(0, 6).map(async (link) => {
          try {
            const r = await axios.head(link, {
              timeout: 5000,
              maxRedirects: 5,
              validateStatus: () => true,
            });
            if (r.status === 404 || r.status === 410) brokenLinks.push(link);
          } catch {
            /* ignore */
          }
        })
      );

      // Google Local Rank (non-blocking, timeout guarded)
      let local_rank: import('./local-rank').LocalRankResult | undefined;
      try {
        const { checkGoogleLocalRank } = await import('./local-rank');
        local_rank = await Promise.race([
          checkGoogleLocalRank(
            this.domain,
            null,
            $('[itemprop="addressLocality"], [itemprop="addressRegion"]').first().text().trim() ||
              null,
            onpagePartial.schema_types ?? []
          ),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000)),
        ]);
      } catch {
        /* non-critical */
      }

      const bodyText = $('body').text().trim();
      const hasTitle = onpagePartial.title.length > 0;
      const hasContent = bodyText.length >= 50;
      const hasMeta = onpagePartial.description.length > 0;

      if (!hasTitle && !hasContent && !hasMeta) {
        throw new Error(
          'Unable to extract meaningful content. The site may be JavaScript-heavy (SPA), require authentication, or block automated access. Our audit tool works best with traditional HTML websites that allow public access.'
        );
      }

      if (!hasContent && hasTitle) {
        console.warn('Limited content extracted - site may be JavaScript-heavy');
      }

      // Align on-page robots/sitemap with live technical checks
      const onpage = {
        ...onpagePartial,
        robots: !!technicalBase.robots,
        sitemap: !!technicalBase.sitemap,
      };

      let technical: AuditResult['technical'] = {
        ...technicalBase,
        sitemap_url_count: sitemapUrlCount,
      };
      let technical_deep: AuditResult['technical_deep'];
      let issues = this.generateIssues(technical, onpage, content);

      try {
        const { analyzeTechnicalDeep } = await import('./technical-deep');
        technical_deep = await analyzeTechnicalDeep({
          baseUrl: this.baseUrl,
          html,
          pagespeed: {
            lcp: technical.lcp ?? null,
            fcp: technical.fcp ?? null,
            cls: technical.cls ?? null,
          },
        });

        technical = {
          ...technical,
          response_time_ms: technical_deep.serverResponseMs ?? technical.response_time_ms,
          mixed_content_count: technical_deep.mixedContentCount,
          redirect_chain_length: technical_deep.redirectChainLength,
        };

        for (const check of technical_deep.checks) {
          if (check.pass) continue;
          issues.push({
            type: 'technical',
            severity: check.severity,
            title: check.label,
            description: check.detail,
            fix_suggestion: check.fix || 'See technical recommendations in your audit dashboard.',
          });
        }
      } catch (deepErr) {
        console.warn('Technical deep analysis skipped:', deepErr);
      }

      // Local ranking grid — estimated from on-page signals (no API needed)
      const { generateLocalGrid } = await import('./local-grid');
      const localBizTypes = [
        'LocalBusiness',
        'Store',
        'Restaurant',
        'MedicalOrganization',
        'LegalService',
        'HomeAndConstructionBusiness',
        'HealthAndBeautyBusiness',
        'Plumber',
        'Attorney',
        'Dentist',
        'Doctor',
        'AccountingService',
        'RealEstateAgent',
        'AutoDealer',
        'BeautySalon',
        'FoodEstablishment',
        'GroceryStore',
        'Hotel',
        'Gym',
      ];
      const hasLocalSchema =
        onpage.schema_types?.some((t: string) => localBizTypes.includes(t)) ?? false;
      const gmbInHtml =
        /maps\.google\.com|business\.google\.com|g\.page\/|goo\.gl\/maps/i.test(html);
      const hasNAPSignals =
        /\+44\s*\d{4}|\b0[0-9]{3,4}[\s\-]\d{3,4}\b|\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i.test(
          html
        );
      const local_grid = generateLocalGrid({
        nap_score: hasNAPSignals ? 65 : hasLocalSchema ? 45 : 20,
        gmb_present: gmbInHtml || hasLocalSchema,
        has_local_schema: hasLocalSchema,
        review_count: 0,
        average_rating: null,
        address:
          $('[itemprop="streetAddress"], [itemprop="addressLocality"]').first().text().trim() ||
          null,
      });

      // Security header issues
      if (security_headers.grade === 'F' || security_headers.grade === 'D') {
        issues.push({
          type: 'technical',
          severity: 'warning',
          title: `Security headers grade: ${security_headers.grade} (${security_headers.present.length}/6 set)`,
          description: `Your server is missing critical HTTP security headers: ${security_headers.missing.join(', ')}. These protect users from XSS, clickjacking, and data leaks.`,
          fix_suggestion: `Add the missing headers in your server/CDN config or .htaccess. Missing: ${security_headers.missing.join(', ')}.`,
        });
      } else if (security_headers.missing.length > 0) {
        issues.push({
          type: 'technical',
          severity: 'info',
          title: `${security_headers.missing.length} security header${security_headers.missing.length > 1 ? 's' : ''} missing (grade ${security_headers.grade})`,
          description: `Missing: ${security_headers.missing.join(', ')}. These HTTP headers harden your site against browser-based attacks.`,
          fix_suggestion: `Add ${security_headers.missing.join(', ')} to your server response headers.`,
        });
      }

      // Broken links
      if (brokenLinks.length > 0) {
        issues.push({
          type: 'technical',
          severity: 'warning',
          title: `${brokenLinks.length} broken internal link${brokenLinks.length > 1 ? 's' : ''} detected`,
          description: `Found 404/410 responses on internal links: ${brokenLinks.slice(0, 2).join(', ')}. Broken links harm crawlability, UX, and PageRank flow.`,
          fix_suggestion: 'Fix or redirect the broken URLs. Use 301 redirects if pages have moved.',
        });
      }

      // No WebP images
      if ((onpage.images?.total ?? 0) > 3 && (onpage.webp_images ?? 0) === 0) {
        issues.push({
          type: 'technical',
          severity: 'info',
          title: 'No WebP images detected',
          description: `None of your ${onpage.images.total} images use the WebP format. WebP files are 25–35% smaller than JPEG/PNG, directly improving Core Web Vitals and page speed.`,
          fix_suggestion:
            'Convert images to WebP format and serve them using <picture> elements with JPEG/PNG fallbacks.',
        });
      }

      // High third-party script load
      if ((onpage.third_party_scripts ?? 0) > 10) {
        issues.push({
          type: 'technical',
          severity: 'warning',
          title: `${onpage.third_party_scripts} third-party scripts loading`,
          description:
            'Excessive third-party scripts (analytics, chat widgets, ad tags, fonts) are one of the biggest causes of slow Largest Contentful Paint and Total Blocking Time.',
          fix_suggestion:
            'Audit your third-party scripts. Defer or lazy-load non-critical ones. Remove any that are no longer used.',
        });
      } else if ((onpage.third_party_scripts ?? 0) > 5) {
        issues.push({
          type: 'technical',
          severity: 'info',
          title: `${onpage.third_party_scripts} third-party scripts — monitor page speed impact`,
          description:
            'Third-party scripts add render-blocking time. Each external request adds latency that hurts Core Web Vitals.',
          fix_suggestion:
            'Use the Performance tab in Chrome DevTools to see which scripts are blocking rendering and defer them.',
        });
      }

      // Spell check issues
      if (spell_check.error_count > 0) {
        issues.push({
          type: 'content',
          severity: spell_check.error_count >= 5 ? 'warning' : 'info',
          title: `${spell_check.error_count} spelling error${spell_check.error_count > 1 ? 's' : ''} detected`,
          description: `Found misspelled words: ${spell_check.errors
            .slice(0, 3)
            .map((e) => `"${e.word}" → "${e.suggestion}"`)
            .join(', ')}. Spelling errors damage credibility and can affect user trust and rankings.`,
          fix_suggestion:
            'Run a spell check on all page content and correct errors. Consider using tools like Grammarly or Hemingway Editor before publishing.',
        });
      }

      // Local rank issue
      if (local_rank?.pack_present && !local_rank.in_local_pack) {
        issues.push({
          type: 'technical',
          severity: 'warning',
          title: 'Not appearing in Google local pack',
          description: `Google is showing a local 3-pack for "${local_rank.search_query}" but your business was not detected in it. Competitors are capturing high-intent local traffic you are missing.`,
          fix_suggestion:
            'Claim/optimise your Google Business Profile, build local citations, add LocalBusiness schema, and collect more reviews.',
        });
      }

      const scored = this.scoreAll(technical, onpage, content);

      console.log(
        `Audit ${this.domain}: overall=${scored.overall_score} tech=${scored.technical_score} onpage=${scored.onpage_score} content=${scored.content_score}`,
        {
          response_time_ms: technical.response_time_ms,
          page_size_bytes: technical.page_size_bytes,
          request_count: technical.request_count,
          title_len: onpage.title.length,
          h1: onpage.h1,
          alt_coverage: onpage.images.alt_coverage_pct,
          og: onpage.open_graph,
          schema: onpage.structured_data,
          words: content.word_count,
          issues: issues.length,
        }
      );

      return {
        ...scored,
        competitor_score: 0,
        technical,
        onpage,
        content,
        issues,
        ppc_signals,
        spell_check,
        local_grid,
        local_rank,
        security_headers,
        technical_deep,
      };
    } catch (error) {
      console.error('Audit error:', error);
      throw new Error(
        `Failed to run audit: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /** Recalculate scores after PageSpeed (or other) metrics are merged into result.technical */
  recalculateScores(result: AuditResult): AuditResult {
    const scored = this.scoreAll(result.technical, result.onpage, result.content);
    return {
      ...result,
      ...scored,
    };
  }

  private scoreAll(technical: any, onpage: any, content: any) {
    const technical_score = this.calculateTechnicalScore(technical);
    const onpage_score = this.calculateOnPageScore(onpage);
    const content_score = this.calculateContentScore(content);
    const categories = this.calculateCategoryScores(technical, onpage, content);
    const overall_score = Math.round(
      categories.basic_seo * 0.3 +
        categories.advanced_seo * 0.25 +
        categories.performance * 0.25 +
        categories.security * 0.2
    );

    return {
      overall_score: Math.max(0, Math.min(100, overall_score)),
      technical_score,
      onpage_score,
      content_score,
      categories,
    };
  }

  private async fetchPage(): Promise<FetchResult> {
    const urls = [`https://${this.domain}`, `http://${this.domain}`];

    for (const url of urls) {
      try {
        const start = Date.now();
        const response = await axios.get(url, {
          timeout: 20000,
          responseType: 'text',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          maxRedirects: 10,
          validateStatus: (status) =>
            (status >= 200 && status < 300) ||
            (status >= 300 && status < 400) ||
            status === 404,
        });

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Site returned access denied (401/403). The site may require authentication.'
          );
        }

        const responseTimeMs = Date.now() - start;
        const html = typeof response.data === 'string' ? response.data : String(response.data ?? '');
        const pageSizeBytes =
          Number(response.headers['content-length']) || Buffer.byteLength(html, 'utf8');
        const finalUrl =
          (response.request as { res?: { responseUrl?: string } })?.res?.responseUrl || url;

        this.baseUrl = url.startsWith('https') ? `https://${this.domain}` : `http://${this.domain}`;
        try {
          const parsed = new URL(finalUrl);
          this.baseUrl = `${parsed.protocol}//${parsed.host}`;
        } catch {
          /* keep */
        }

        // Capture response headers for security analysis
        this.responseHeaders = response.headers as Record<string, string | string[]>;

        return {
          html,
          responseTimeMs,
          pageSizeBytes,
          statusCode: response.status,
          finalUrl,
        };
      } catch (error: any) {
        if (url === urls[urls.length - 1]) {
          const errorMsg =
            error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT'
              ? 'Connection timeout or reset. The site may be down or blocking requests.'
              : error.message || 'Unknown error';
          throw new Error(`Failed to fetch page: ${errorMsg}`);
        }
        continue;
      }
    }

    throw new Error('Failed to fetch page: Unable to connect via HTTPS or HTTP');
  }

  private countHtmlResources($: any): number {
    const scripts = $('script[src]').length;
    const styles = $('link[rel="stylesheet"]').length;
    const images = $('img[src]').length;
    const iframes = $('iframe[src]').length;
    const fonts = $('link[rel="preload"][as="font"], link[href*="font"]').length;
    // +1 for the HTML document itself
    return 1 + scripts + styles + images + iframes + fonts;
  }

  private async checkTechnical($: any, fetchResult: FetchResult): Promise<AuditResult['technical']> {
    const url = new URL(this.baseUrl);
    const https = url.protocol === 'https:';

    let robots = false;
    try {
      const robotsRes = await axios.get(`${url.origin}/robots.txt`, {
        timeout: 5000,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      robots =
        typeof robotsRes.data === 'string' &&
        robotsRes.data.length > 0 &&
        !/^\s*<(!DOCTYPE|html)/i.test(robotsRes.data);
    } catch {
      robots = false;
    }

    let sitemap = false;
    try {
      const sitemapRes = await axios.get(`${url.origin}/sitemap.xml`, {
        timeout: 5000,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      const body = typeof sitemapRes.data === 'string' ? sitemapRes.data : '';
      sitemap = /<urlset|<sitemapindex/i.test(body);
    } catch {
      sitemap = false;
    }

    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const mobile = /width\s*=\s*device-width|width/i.test(viewport);

    const request_count = this.countHtmlResources($);

    return {
      https,
      mobile,
      robots,
      sitemap,
      ssl_grade: https ? 'A' : 'F',
      response_time_ms: fetchResult.responseTimeMs,
      page_size_bytes: fetchResult.pageSizeBytes,
      request_count,
      mixed_content_count: 0,
      redirect_chain_length: 0,
      lcp: undefined,
      fcp: undefined,
      tti: undefined,
      cls: undefined,
    };
  }

  private checkOnPage($: any) {
    const title = $('title').first().text().trim();
    const titleLength = title.length;
    const titleOptimal = titleLength >= 30 && titleLength <= 60;

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const descLength = metaDesc.length;
    const descMissing = !metaDesc;
    const descTooLong = descLength > 160;
    const descTooShort = descLength > 0 && descLength < 120;

    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const hasOpenGraph = !!(ogTitle && ogDescription && ogImage);

    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const hasTwitterCard = !!twitterCard;

    const structuredData = $('script[type="application/ld+json"]').length;
    const hasStructuredData = structuredData > 0;

    const allLinks = $('a[href]');
    let externalLinks = 0;
    let internalLinks = 0;
    let externalNofollow = 0;
    allLinks.each((_: any, el: any) => {
      const href = $(el).attr('href') || '';
      const rel = ($(el).attr('rel') || '').toLowerCase();
      if (href.startsWith('http://') || href.startsWith('https://')) {
        if (!href.includes(this.domain)) {
          externalLinks++;
          if (rel.includes('nofollow')) externalNofollow++;
        } else {
          internalLinks++;
        }
      } else if (
        href.startsWith('/') ||
        href.startsWith('#') ||
        (!href.startsWith('mailto:') && !href.startsWith('tel:'))
      ) {
        internalLinks++;
      }
    });

    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    const images = $('img');
    const totalImages = images.length;
    let missingAlt = 0;
    let validAlt = 0;
    images.each((_: any, el: any) => {
      const alt = $(el).attr('alt');
      if (alt === undefined || alt === null || String(alt).trim() === '') {
        missingAlt++;
      } else {
        validAlt++;
      }
    });
    const alt_coverage_pct =
      totalImages === 0 ? 100 : Math.round((validAlt / totalImages) * 100);

    const canonical = $('link[rel="canonical"]').length > 0;
    const favicon = !!($('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '');
    const lang = !!($('html').attr('lang') || '');
    const charset = !!(
      $('meta[charset]').attr('charset') ||
      $('meta[http-equiv="Content-Type"]').attr('content') ||
      ''
    );

    // --- Noindex detection ---
    const robotsMeta = $('meta[name="robots"], meta[name="googlebot"]').attr('content') || '';
    const noindex = /noindex/i.test(robotsMeta);

    // --- H1 text quality ---
    const h1Text = $('h1').first().text().trim();

    // --- Heading hierarchy validation ---
    const headingOrder: string[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_: any, el: any) => {
      headingOrder.push($(el).prop('tagName').toLowerCase());
    });
    let headingHierarchyOk = true;
    let lastLevel = 0;
    for (const tag of headingOrder) {
      const lvl = parseInt(tag[1]);
      if (lvl - lastLevel > 1 && lastLevel > 0) {
        headingHierarchyOk = false;
        break;
      }
      lastLevel = lvl;
    }

    // --- Image optimisation signals ---
    let imagesLazy = 0;
    let imagesWithDimensions = 0;
    images.each((_: any, el: any) => {
      const loading = $(el).attr('loading') || '';
      const w = $(el).attr('width');
      const h = $(el).attr('height');
      if (loading === 'lazy') imagesLazy++;
      if (w && h) imagesWithDimensions++;
    });

    // --- Schema type extraction & basic validation ---
    const schemaTypes: string[] = [];
    $('script[type="application/ld+json"]').each((_: any, el: any) => {
      try {
        const parsed = JSON.parse($(el).html() || '{}');
        const schemas = Array.isArray(parsed)
          ? parsed
          : parsed['@graph']
            ? parsed['@graph']
            : [parsed];
        schemas.forEach((s: any) => {
          if (s['@type'])
            schemaTypes.push(Array.isArray(s['@type']) ? s['@type'][0] : s['@type']);
        });
      } catch {
        /* invalid JSON-LD */
      }
    });

    // --- Generic anchor text ---
    const genericPhrases = new Set([
      'click here',
      'here',
      'read more',
      'learn more',
      'more',
      'this',
      'link',
      'website',
      'page',
    ]);
    let genericAnchors = 0;
    allLinks.each((_: any, el: any) => {
      const text = ($(el).text() || '').trim().toLowerCase();
      if (genericPhrases.has(text)) genericAnchors++;
    });

    // --- Keyword in title (real check vs top body keyword) ---
    const bodyWords = ($('body').text() || '').toLowerCase();
    const wordFreqMap: Record<string, number> = {};
    const bodyWordsList = bodyWords.match(/\b[a-z]{4,}\b/g) || [];
    bodyWordsList.forEach((w: string) => {
      wordFreqMap[w] = (wordFreqMap[w] || 0) + 1;
    });
    const topBodyKeyword =
      Object.entries(wordFreqMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    const titleKeywordPresent =
      topBodyKeyword.length > 3 && title.toLowerCase().includes(topBodyKeyword);

    // --- Third-party script count ---
    let thirdPartyScripts = 0;
    $('script[src]').each((_: any, el: any) => {
      const src = $(el).attr('src') || '';
      if (
        (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) &&
        !src.includes(this.domain)
      ) {
        thirdPartyScripts++;
      }
    });

    // --- WebP image usage ---
    let webpImages = 0;
    images.each((_: any, el: any) => {
      const src = ($(el).attr('src') || '').toLowerCase();
      const srcset = ($(el).attr('srcset') || '').toLowerCase();
      if (src.includes('.webp') || srcset.includes('.webp')) webpImages++;
    });

    // --- Hreflang tags ---
    const hreflangCount = $('link[rel="alternate"][hreflang]').length;

    // --- Social media presence (detect links in HTML) ---
    const socialPresence = {
      facebook: $('a[href*="facebook.com"]').length > 0,
      instagram: $('a[href*="instagram.com"]').length > 0,
      linkedin: $('a[href*="linkedin.com"]').length > 0,
      twitter: $('a[href*="twitter.com"], a[href*="x.com"]').length > 0,
      youtube: $('a[href*="youtube.com"]').length > 0,
    };

    // --- GDPR / privacy compliance signals ---
    const rawHtml = $.html() || '';
    const hasPrivacyPolicy =
      $('a[href*="privacy"]').length > 0 || /privacy[-_]?policy|\/privacy\b/i.test(rawHtml);
    const hasCookieConsent =
      /cookieyes|onetrust|cookiebot|cookie.*consent|accept.*cookie|cookie.*banner|gdpr.*consent/i.test(
        rawHtml
      );

    // --- CMS / technology detection ---
    let cmsDetected = '';
    const cmsChecks: Array<{ name: string; pattern: RegExp }> = [
      { name: 'WordPress', pattern: /wp-content|wp-includes/i },
      { name: 'Shopify', pattern: /cdn\.shopify|myshopify\.com/i },
      { name: 'Squarespace', pattern: /squarespace\.com/i },
      { name: 'Wix', pattern: /wix\.com|wixsite\.com/i },
      { name: 'Webflow', pattern: /\.webflow\./i },
      { name: 'HubSpot', pattern: /hs-analytics|hubspot\.com\/hs/i },
      { name: 'Drupal', pattern: /sites\/default\/files|drupal\.js/i },
      { name: 'Joomla', pattern: /\/media\/jui\/|joomla/i },
    ];
    for (const { name, pattern } of cmsChecks) {
      if (pattern.test(rawHtml)) {
        cmsDetected = name;
        break;
      }
    }
    if (!cmsDetected) {
      const generatorContent = $('meta[name="generator"]').attr('content') || '';
      if (generatorContent) cmsDetected = generatorContent.split(' ')[0];
    }

    // --- Accessibility quick score ---
    const hasMainLandmark = $('main').length > 0;
    const ariaLabelCount = $('[aria-label]').length;
    let accessibilityScore = 0;
    if (lang) accessibilityScore += 35;
    if (hasMainLandmark) accessibilityScore += 30;
    if (ariaLabelCount >= 3) accessibilityScore += 25;
    if (missingAlt === 0 && totalImages > 0) accessibilityScore += 10;

    return {
      title: {
        length: titleLength,
        keyword: titleKeywordPresent,
        optimal: titleOptimal,
        text: title.slice(0, 200),
      },
      description: {
        missing: descMissing,
        tooLong: descTooLong,
        tooShort: descTooShort,
        length: descLength,
      },
      h1: h1Count,
      h2: h2Count,
      h3: h3Count,
      images: {
        total: totalImages,
        missing: missingAlt,
        valid: validAlt,
        alt_coverage_pct,
      },
      canonical,
      robots: false,
      sitemap: false,
      open_graph: hasOpenGraph,
      twitter_card: hasTwitterCard,
      structured_data: hasStructuredData,
      favicon,
      lang,
      charset,
      links: {
        internal: internalLinks,
        external: externalLinks,
        external_nofollow: externalNofollow,
        total: internalLinks + externalLinks,
      },
      noindex,
      heading_hierarchy_ok: headingHierarchyOk,
      h1_text: h1Text,
      images_lazy: imagesLazy,
      images_with_dimensions: imagesWithDimensions,
      schema_types: schemaTypes,
      generic_anchors: genericAnchors,
      social_presence: socialPresence,
      has_privacy_policy: hasPrivacyPolicy,
      has_cookie_consent: hasCookieConsent,
      cms_detected: cmsDetected || undefined,
      accessibility_score: accessibilityScore,
      third_party_scripts: thirdPartyScripts,
      webp_images: webpImages,
      hreflang_count: hreflangCount,
    };
  }

  private checkContent($: any) {
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const headingsText = $('h1, h2, h3, h4, h5, h6')
      .map((_: any, el: any) => $(el).text())
      .get()
      .join(' ')
      .toLowerCase();

    const wordCount = bodyText.split(/\s+/).filter((w: string) => w.length > 0).length;

    const sentences = bodyText.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
    const avgCharsPerWord = wordCount > 0 ? bodyText.length / wordCount : 0;
    const readability = Math.max(
      0,
      Math.min(100, 100 - avgWordsPerSentence * 1.5 - avgCharsPerWord * 0.5)
    );

    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'have', 'will', 'your', 'they', 'them', 'their',
      'there', 'these', 'those', 'what', 'when', 'where', 'which', 'would', 'could',
      'should', 'about', 'after', 'before', 'during', 'while', 'until', 'since',
      'chunks', 'static', 'null', 'undefined', 'function', 'return', 'const', 'let',
      'var', 'class', 'extends', 'import', 'export', 'default', 'async', 'await',
      'promise', 'object', 'array', 'string', 'number', 'boolean', 'type', 'interface',
      'module', 'require', 'window', 'document', 'element', 'query', 'selector',
      'click', 'event', 'handler', 'callback', 'props', 'state', 'component', 'render',
      'meta', 'content', 'name', 'property', 'charset', 'http', 'equiv', 'viewport',
      'stylesheet', 'script', 'link', 'href', 'src', 'alt', 'title', 'id',
      'div', 'span', 'body', 'head', 'html', 'style', 'data', 'attr', 'value',
      'text', 'button', 'input', 'form', 'label', 'select', 'option',
    ]);

    const allText = bodyText.toLowerCase();
    const words = (allText.match(/\b[a-z]{4,}\b/g) || []).filter(
      (word: string) => !stopWords.has(word) && word.length >= 4
    );

    const wordFreq: Record<string, number> = {};
    words.forEach((word: string) => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const headingWords = (headingsText.match(/\b[a-z]{4,}\b/g) || []) as string[];
    headingWords.forEach((word: string) => {
      if (!stopWords.has(word) && word.length >= 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 2;
      }
    });

    const totalWords = words.length;
    const keywordDensity = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .filter(([term]: [string, number]) => term.length >= 4 && !/^\d+$/.test(term))
      .slice(0, 5)
      .map(([term, count]: [string, number]) => ({
        term,
        pct: totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(2)) : 0,
      }));

    // Duplicate detection is not cross-page; do not award free points
    const duplicate = false;

    const suggestions: string[] = [];
    if (wordCount < 300) suggestions.push('Add more content to improve SEO');
    if (readability < 50) suggestions.push('Improve content readability');
    if (keywordDensity.length === 0) suggestions.push('Add relevant keywords naturally');

    return {
      readability: Math.round(readability),
      word_count: wordCount,
      keyword_density: keywordDensity,
      duplicate,
      suggestions,
    };
  }

  private calculateTechnicalScore(technical: any): number {
    let score = 0;
    if (technical.https) score += 20;
    if (technical.mobile) score += 12;
    if (technical.robots) score += 10;
    if (technical.sitemap) score += 10;

    const rt = technical.response_time_ms;
    if (rt != null) {
      if (rt < 600) score += 15;
      else if (rt < 1200) score += 8;
      else if (rt < 2500) score += 3;
    }

    const size = technical.page_size_bytes;
    if (size != null) {
      if (size < 500_000) score += 10;
      else if (size < 1_500_000) score += 6;
      else if (size < 3_000_000) score += 2;
    }

    const req = technical.request_count;
    if (req != null) {
      if (req <= 40) score += 10;
      else if (req <= 70) score += 5;
      else if (req <= 100) score += 2;
    }

    if ((technical.mixed_content_count ?? 0) === 0 && technical.https) score += 8;
    if ((technical.redirect_chain_length ?? 0) <= 2) score += 5;

    if (technical.lcp != null && technical.lcp < 2.5) score += 5;
    if (technical.fcp != null && technical.fcp < 1.8) score += 5;

    return Math.min(100, Math.round(score));
  }

  private calculateOnPageScore(onpage: any): number {
    let score = 0;
    if (onpage.title.length > 0) score += 12;
    if (onpage.title.optimal) score += 8;
    if (!onpage.description.missing) score += 12;
    if (!onpage.description.missing && !onpage.description.tooLong && !onpage.description.tooShort) {
      score += 8;
    }
    if (onpage.h1 === 1) score += 12;
    else if (onpage.h1 > 1) score += 4;
    if (onpage.h2 > 0) score += 8;

    const altPct = onpage.images?.alt_coverage_pct ?? 0;
    if (onpage.images?.total === 0) score += 10;
    else score += Math.round((altPct / 100) * 15);

    if (onpage.canonical) score += 8;
    if (onpage.open_graph) score += 7;
    if (onpage.twitter_card) score += 5;
    if (onpage.structured_data) score += 5;

    return Math.min(100, Math.round(score));
  }

  private calculateContentScore(content: any): number {
    let score = 0;
    const wc = content.word_count || 0;
    if (wc >= 800) score += 40;
    else if (wc >= 500) score += 30;
    else if (wc >= 300) score += 20;
    else if (wc >= 150) score += 10;
    else if (wc > 0) score += 3;

    const read = content.readability || 0;
    if (read >= 70) score += 30;
    else if (read >= 50) score += 20;
    else if (read >= 35) score += 10;

    const dens = content.keyword_density || [];
    if (dens.length >= 3) {
      const top = dens[0]?.pct ?? 0;
      if (top > 0 && top <= 3.5) score += 30;
      else if (top > 3.5 && top <= 5) score += 15;
      else if (top > 0) score += 5;
    } else if (dens.length > 0) {
      score += 10;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateCategoryScores(technical: any, onpage: any, content: any) {
    // Basic SEO — titles, meta, headings, alt text
    let basic = 0;
    if (onpage.title.length > 0) basic += 20;
    if (onpage.title.optimal) basic += 15;
    if (!onpage.description.missing) basic += 20;
    if (!onpage.description.missing && !onpage.description.tooLong && !onpage.description.tooShort) {
      basic += 10;
    }
    if (onpage.h1 === 1) basic += 20;
    else if (onpage.h1 > 0) basic += 5;
    if (onpage.h2 > 0) basic += 10;
    const altPct = onpage.images?.alt_coverage_pct ?? 100;
    basic += Math.round((altPct / 100) * 5);
    basic = Math.min(100, basic);

    // Advanced SEO — canonical, OG, Twitter, schema, robots, sitemap, content depth
    let advanced = 0;
    if (onpage.canonical) advanced += 20;
    if (onpage.open_graph) advanced += 20;
    if (onpage.twitter_card) advanced += 10;
    if (onpage.structured_data) advanced += 20;
    if (technical.robots) advanced += 10;
    if (technical.sitemap) advanced += 10;
    if ((content.word_count || 0) >= 300) advanced += 10;
    advanced = Math.min(100, advanced);

    // Performance — response time, size, requests, CWV
    let performance = 0;
    const rt = technical.response_time_ms;
    if (rt != null) {
      if (rt < 400) performance += 30;
      else if (rt < 600) performance += 22;
      else if (rt < 1200) performance += 12;
      else if (rt < 2500) performance += 5;
    }
    const size = technical.page_size_bytes;
    if (size != null) {
      if (size < 300_000) performance += 25;
      else if (size < 800_000) performance += 18;
      else if (size < 1_500_000) performance += 10;
      else if (size < 3_000_000) performance += 4;
    }
    const req = technical.request_count;
    if (req != null) {
      if (req <= 30) performance += 25;
      else if (req <= 50) performance += 18;
      else if (req <= 80) performance += 10;
      else if (req <= 120) performance += 4;
    }
    if (technical.lcp != null) {
      if (technical.lcp < 2.5) performance += 10;
      else if (technical.lcp < 4) performance += 4;
    } else if (technical.fcp != null && technical.fcp < 1.8) {
      performance += 5;
    }
    if ((technical.redirect_chain_length ?? 0) <= 1) performance += 10;
    else if ((technical.redirect_chain_length ?? 0) <= 2) performance += 5;
    performance = Math.min(100, performance);

    // Security — HTTPS, mixed content, SSL signal
    let security = 0;
    if (technical.https) security += 60;
    if ((technical.mixed_content_count ?? 0) === 0) security += 25;
    else if ((technical.mixed_content_count ?? 0) < 3) security += 10;
    if (technical.ssl_grade === 'A' || technical.https) security += 15;
    security = Math.min(100, security);

    return {
      basic_seo: Math.round(basic),
      advanced_seo: Math.round(advanced),
      performance: Math.round(performance),
      security: Math.round(security),
    };
  }

  private generateIssues(technical: any, onpage: any, content: any) {
    const issues: AuditResult['issues'] = [];

    if (!technical.https) {
      issues.push({
        type: 'technical',
        severity: 'critical',
        title: 'HTTPS not enabled',
        description: 'Your site is not using HTTPS, which is required for security and SEO.',
        fix_suggestion: 'Install an SSL certificate and redirect all HTTP traffic to HTTPS.',
      });
    }

    if (!technical.mobile) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'Missing mobile viewport meta tag',
        description: 'Your site may not display correctly on mobile devices.',
        fix_suggestion:
          'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your <head>.',
      });
    }

    if (!technical.robots) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'No robots.txt found',
        description: 'A robots.txt file helps search engines crawl your site.',
        fix_suggestion: 'Create a robots.txt file in your root directory.',
      });
    }

    if (!technical.sitemap) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'No sitemap.xml found',
        description: 'A sitemap helps search engines discover all your pages.',
        fix_suggestion: 'Create a sitemap.xml file and submit it to Google Search Console.',
      });
    }

    const rt = technical.response_time_ms;
    if (rt != null && rt >= 600) {
      issues.push({
        type: 'technical',
        severity: rt >= 2000 ? 'critical' : 'warning',
        title: 'Slow server response time',
        description: `Initial HTML response took ~${rt}ms. Target is under 600ms.`,
        fix_suggestion: 'Improve hosting, enable caching/CDN, and optimize server-side rendering.',
      });
    }

    const size = technical.page_size_bytes;
    if (size != null && size > 1_500_000) {
      issues.push({
        type: 'technical',
        severity: size > 3_000_000 ? 'critical' : 'warning',
        title: 'Large page weight',
        description: `HTML document is ~${(size / 1024).toFixed(0)} KB. Heavy pages hurt load speed.`,
        fix_suggestion: 'Minify HTML, defer non-critical scripts, and compress assets.',
      });
    }

    const req = technical.request_count;
    if (req != null && req > 70) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'High number of page resources',
        description: `Detected ~${req} resources (scripts, styles, images, iframes) in the HTML.`,
        fix_suggestion: 'Combine/minify assets, lazy-load images, and remove unused scripts.',
      });
    }

    if (onpage.title.length === 0) {
      issues.push({
        type: 'onpage',
        severity: 'critical',
        title: 'Missing page title',
        description: 'Your page has no title tag.',
        fix_suggestion: 'Add a descriptive title tag between 30-60 characters.',
      });
    } else if (!onpage.title.optimal) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Title tag length not optimal',
        description: `Your title is ${onpage.title.length} characters. Optimal length is 30-60 characters.`,
        fix_suggestion: 'Adjust your title tag to be between 30-60 characters.',
      });
    }

    if (onpage.description.missing) {
      issues.push({
        type: 'onpage',
        severity: 'critical',
        title: 'Missing meta description',
        description: 'Your page has no meta description.',
        fix_suggestion: 'Add a compelling meta description between 120-160 characters.',
      });
    } else if (onpage.description.tooLong || onpage.description.tooShort) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Meta description length not optimal',
        description: `Your meta description is ${onpage.description.length} characters. Optimal length is 120-160 characters.`,
        fix_suggestion: 'Adjust your meta description to be between 120-160 characters.',
      });
    }

    if (onpage.h1 === 0) {
      issues.push({
        type: 'onpage',
        severity: 'critical',
        title: 'Missing H1 tag',
        description: 'Your page has no H1 heading.',
        fix_suggestion: 'Add a single H1 tag with your main keyword.',
      });
    } else if (onpage.h1 > 1) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Multiple H1 tags found',
        description: `Your page has ${onpage.h1} H1 tags. There should be only one.`,
        fix_suggestion: 'Use only one H1 tag per page for better SEO.',
      });
    }

    if (onpage.images.missing > 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: `${onpage.images.missing} images missing alt text`,
        description: `Alt text coverage is ${onpage.images.alt_coverage_pct}% (${onpage.images.valid}/${onpage.images.total}).`,
        fix_suggestion: 'Add descriptive alt text to all images.',
      });
    }

    if (!onpage.canonical) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'No canonical URL found',
        description: 'A canonical URL helps prevent duplicate content issues.',
        fix_suggestion: 'Add a canonical link tag pointing to the preferred version of the page.',
      });
    }

    if (!onpage.open_graph) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Incomplete Open Graph tags',
        description: 'Missing one or more of og:title, og:description, or og:image.',
        fix_suggestion: 'Add complete Open Graph tags to improve social sharing previews.',
      });
    }

    if (!onpage.twitter_card) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Missing Twitter Card tags',
        description: 'Twitter Cards improve how your content appears when shared on X/Twitter.',
        fix_suggestion: 'Add twitter:card and related meta tags.',
      });
    }

    if (!onpage.structured_data) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'No structured data found',
        description: 'Structured data (JSON-LD) helps search engines understand your content.',
        fix_suggestion: 'Add JSON-LD structured data for rich results.',
      });
    }

    // Noindex detection — critical
    if (onpage.noindex) {
      issues.push({
        type: 'technical',
        severity: 'critical',
        title: 'Page is set to noindex — blocked from Google',
        description:
          'Your robots meta tag includes "noindex", which tells search engines not to index this page. It will not appear in search results.',
        fix_suggestion:
          'Remove the noindex directive from your robots meta tag unless you intentionally want to hide this page from search engines.',
      });
    }

    // Heading hierarchy
    if (onpage.heading_hierarchy_ok === false) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Heading hierarchy is broken',
        description:
          'Your headings skip levels (e.g. H1 directly to H3, or H2 before H1). This confuses both users and search engine crawlers.',
        fix_suggestion:
          'Ensure headings follow a logical order: H1 → H2 → H3 without skipping levels.',
      });
    }

    // H1 text too short
    if (onpage.h1_text && onpage.h1_text.length < 10 && onpage.h1 === 1) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'H1 heading is too short',
        description: `Your H1 is "${onpage.h1_text}" (${onpage.h1_text.length} characters). A descriptive H1 with your target keyword significantly improves relevance signals.`,
        fix_suggestion:
          'Rewrite your H1 to be 20–70 characters and include your primary keyword naturally.',
      });
    }

    // Keyword not in title
    if (onpage.title.length > 0 && !onpage.title.keyword) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Target keyword missing from page title',
        description:
          'Your page title does not appear to contain the most prominent keyword found in your content. Google heavily weights the title tag for keyword relevance.',
        fix_suggestion:
          'Include your primary keyword naturally in the first half of your title tag.',
      });
    }

    // Image lazy loading
    if (
      onpage.images &&
      onpage.images.total > 3 &&
      (onpage.images_lazy ?? 0) / onpage.images.total < 0.5
    ) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Images not using lazy loading',
        description: `Only ${onpage.images_lazy ?? 0} of ${onpage.images.total} images have loading="lazy". Lazy loading defers offscreen images, improving page speed and Core Web Vitals.`,
        fix_suggestion:
          'Add loading="lazy" to all <img> tags that are not in the initial viewport.',
      });
    }

    // Image dimensions missing
    if (
      onpage.images &&
      onpage.images.total > 3 &&
      (onpage.images_with_dimensions ?? 0) / onpage.images.total < 0.5
    ) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Images missing width/height attributes',
        description: `Only ${onpage.images_with_dimensions ?? 0} of ${onpage.images.total} images specify width and height. Missing dimensions cause Cumulative Layout Shift (CLS), harming your Core Web Vitals score.`,
        fix_suggestion:
          'Add explicit width and height attributes to all <img> tags to prevent layout shifts.',
      });
    }

    // Generic anchor text
    if ((onpage.generic_anchors ?? 0) > 2) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: `${onpage.generic_anchors} links use generic anchor text`,
        description:
          'Links with anchor text like "click here", "read more", or "here" provide no keyword context to search engines and miss an opportunity to pass relevance signals.',
        fix_suggestion:
          'Replace generic anchor text with descriptive keywords that describe the destination page.',
      });
    }

    // Schema type validation — has JSON-LD but no recognised @type
    if (onpage.structured_data && onpage.schema_types && onpage.schema_types.length === 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Structured data found but no valid @type detected',
        description:
          'JSON-LD was found but no schema @type could be parsed. Invalid or empty schema data will not generate rich results in Google.',
        fix_suggestion:
          "Ensure your JSON-LD includes a valid @type (e.g. Organization, LocalBusiness, Article, FAQPage) and passes Google's Rich Results Test.",
      });
    }

    if (onpage.links && onpage.links.external > 0) {
      const externalRatio =
        onpage.links.total > 0 ? onpage.links.external / onpage.links.total : 0;
      if (externalRatio > 0.5) {
        issues.push({
          type: 'onpage',
          severity: 'warning',
          title: 'Too many external links',
          description: `Your page has ${onpage.links.external} external links out of ${onpage.links.total} total.`,
          fix_suggestion: 'Reduce external links or add rel="nofollow" where appropriate.',
        });
      }
    }

    if (onpage.links && onpage.links.internal < 3) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Few internal links found',
        description: `Your page has only ${onpage.links.internal} internal links.`,
        fix_suggestion: 'Add more internal links to related pages.',
      });
    }

    if (content.word_count < 300) {
      issues.push({
        type: 'content',
        severity: 'warning',
        title: 'Low word count',
        description: `Your page has only ${content.word_count} words. Aim for at least 300 words.`,
        fix_suggestion: 'Add more valuable content to improve SEO and user engagement.',
      });
    }

    if (content.readability < 50) {
      issues.push({
        type: 'content',
        severity: 'info',
        title: 'Content readability could be improved',
        description: 'Your content may be difficult for some users to read.',
        fix_suggestion: 'Use shorter sentences and simpler words to improve readability.',
      });
    }

    if (!onpage.favicon) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Missing favicon',
        description: 'A favicon helps with brand recognition and user experience.',
        fix_suggestion: 'Add a favicon and link it in your <head>.',
      });
    }

    if (!onpage.lang) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Missing language attribute',
        description: 'The lang attribute helps search engines understand your content language.',
        fix_suggestion: 'Add lang="en" (or appropriate language) to your <html> tag.',
      });
    }

    if (!onpage.charset) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'Missing charset declaration',
        description: 'Charset declaration ensures proper character encoding.',
        fix_suggestion: 'Add <meta charset="UTF-8"> as the first tag in your <head>.',
      });
    }

    if (onpage.h2 === 0 && onpage.h3 === 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'No H2 or H3 headings found',
        description: 'Subheadings help structure content and improve readability.',
        fix_suggestion: 'Add H2 and H3 headings to organize your content.',
      });
    }

    if (content.keyword_density?.length > 0) {
      const topKeyword = content.keyword_density[0];
      if (topKeyword.pct > 5) {
        issues.push({
          type: 'content',
          severity: 'warning',
          title: 'Potential keyword stuffing detected',
          description: `Your top keyword "${topKeyword.term}" appears ${topKeyword.pct}% of the time.`,
          fix_suggestion: 'Reduce keyword density to 1-3% and use natural language variations.',
        });
      }
    }

    if (technical.lcp && technical.lcp > 2.5) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'Slow Largest Contentful Paint (LCP)',
        description: `Your LCP is ${technical.lcp.toFixed(2)}s. Target is under 2.5s.`,
        fix_suggestion:
          'Optimize images, reduce server response time, and eliminate render-blocking resources.',
      });
    }

    if (technical.fcp && technical.fcp > 1.8) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Slow First Contentful Paint (FCP)',
        description: `Your FCP is ${technical.fcp.toFixed(2)}s. Target is under 1.8s.`,
        fix_suggestion: 'Minify CSS and reduce render-blocking resources.',
      });
    }

    if (technical.cls && technical.cls > 0.1) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'High Cumulative Layout Shift (CLS)',
        description: `Your CLS is ${technical.cls.toFixed(3)}. Target is under 0.1.`,
        fix_suggestion:
          'Add size attributes to images and videos; avoid inserting content above existing content.',
      });
    }

    // Privacy policy — UK GDPR legal requirement
    if (onpage.has_privacy_policy === false) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'No privacy policy detected',
        description:
          'UK GDPR and ICO regulations require businesses to have a clearly accessible privacy policy. None was detected on your site.',
        fix_suggestion:
          'Add a privacy policy page and link it in your footer. Include how you collect, store, and use personal data.',
      });
    }

    // Cookie consent — UK GDPR requirement
    if (onpage.has_cookie_consent === false) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'No cookie consent mechanism found',
        description:
          'UK GDPR requires informed consent before setting non-essential cookies. No cookie consent banner or script was detected on your site.',
        fix_suggestion:
          'Install a cookie consent tool (CookieYes, OneTrust, or Cookiebot) and configure it for UK/GDPR compliance.',
      });
    }

    // Social media presence
    const socialCount = Object.values(onpage.social_presence ?? {}).filter(Boolean).length;
    if (socialCount === 0) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'No social media profile links found',
        description:
          'Social signals contribute to brand authority and local SEO rankings. No Facebook, Instagram, LinkedIn, Twitter/X, or YouTube links were detected on your homepage.',
        fix_suggestion:
          'Add links to your social media profiles in your site header or footer to build brand signals.',
      });
    }

    // Accessibility — missing lang attribute
    if (onpage.lang === false) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'Missing language attribute on <html>',
        description:
          'The lang attribute tells browsers and screen readers what language your content is in. Required for WCAG 2.1 accessibility compliance and used by Google for language detection.',
        fix_suggestion:
          'Add lang="en" (or your content\'s primary language) to your opening <html> tag.',
      });
    }

    // Low accessibility score
    if ((onpage.accessibility_score ?? 100) < 40) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Accessibility signals are weak',
        description:
          'Your page is missing key accessibility markers: semantic landmarks (<main>), ARIA labels, and language declarations. This affects both users and screen readers.',
        fix_suggestion:
          'Add <main> landmark element, include aria-label attributes on interactive elements, and ensure all images have descriptive alt text.',
      });
    }

    return issues;
  }

  async getPageSpeedInsights(): Promise<any> {
    try {
      const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
      if (!apiKey) {
        console.log('PageSpeed Insights: No API key found in environment variables');
        return null;
      }

      console.log(`PageSpeed Insights: Fetching metrics for ${this.baseUrl}`);

      const response = await axios.get(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`,
        {
          params: {
            url: this.baseUrl,
            key: apiKey,
            strategy: 'mobile',
            category: ['performance'],
          },
          timeout: 35000,
        }
      );

      if (!response.data?.lighthouseResult) {
        console.error('PageSpeed Insights: Invalid response structure');
        return null;
      }

      const lighthouse = response.data.lighthouseResult;
      const audits = lighthouse.audits;

      const fidAudit =
        audits['max-potential-fid'] || audits['experimental-interaction-to-next-paint'];
      const metrics = {
        lcp: audits['largest-contentful-paint']?.numericValue
          ? audits['largest-contentful-paint'].numericValue / 1000
          : null,
        fcp: audits['first-contentful-paint']?.numericValue
          ? audits['first-contentful-paint'].numericValue / 1000
          : null,
        tti: audits['interactive']?.numericValue
          ? audits['interactive'].numericValue / 1000
          : null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,
        fid: fidAudit?.numericValue ? fidAudit.numericValue : null,
      };

      console.log('PageSpeed Insights: Successfully fetched metrics', metrics);
      return metrics;
    } catch (error: any) {
      if (error.response) {
        console.error('PageSpeed Insights API error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      } else if (error.request) {
        console.error('PageSpeed Insights: No response received', error.message);
      } else {
        console.error('PageSpeed Insights error:', error.message);
      }
      return null;
    }
  }
}
