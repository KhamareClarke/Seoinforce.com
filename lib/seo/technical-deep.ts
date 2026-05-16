import axios from 'axios';
import * as cheerio from 'cheerio';

export type TechnicalDeepResult = {
  redirectChainLength: number;
  finalUrl: string;
  mixedContentCount: number;
  serverResponseMs: number | null;
  internalLinksFound: number;
  uniqueInternalPaths: number;
  estimatedCrawlablePages: number;
  hasRenderHeavyJs: boolean;
  fidMs: number | null;
  cls: number | null;
  lcp: number | null;
  checks: Array<{
    id: string;
    label: string;
    pass: boolean;
    severity: 'critical' | 'warning' | 'info';
    detail: string;
    fix?: string;
  }>;
};

export async function analyzeTechnicalDeep(args: {
  baseUrl: string;
  html: string;
  pagespeed?: { lcp?: number | null; fcp?: number | null; cls?: number | null; fid?: number | null };
}): Promise<TechnicalDeepResult> {
  const origin = new URL(args.baseUrl.startsWith('http') ? args.baseUrl : `https://${args.baseUrl}`);
  const isHttps = origin.protocol === 'https:';

  let redirectChainLength = 0;
  let finalUrl = origin.href;
  let serverResponseMs: number | null = null;

  try {
    const start = Date.now();
    const res = await axios.get(origin.href, {
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 SEOInForce AuditBot' },
    });
    serverResponseMs = Date.now() - start;

    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      let next = res.headers.location;
      redirectChainLength = 1;
      for (let i = 0; i < 8; i++) {
        const r = await axios.get(next.startsWith('http') ? next : `${origin.origin}${next}`, {
          maxRedirects: 0,
          validateStatus: () => true,
          timeout: 10000,
        });
        if (r.status >= 300 && r.status < 400 && r.headers.location) {
          redirectChainLength += 1;
          next = r.headers.location;
        } else {
          finalUrl = r.request?.res?.responseUrl || next;
          break;
        }
      }
    }
  } catch {
    /* use defaults */
  }

  const $ = cheerio.load(args.html);
  let mixedContentCount = 0;
  if (isHttps) {
    $('img[src^="http:"], script[src^="http:"], link[href^="http:"], iframe[src^="http:"]').each(() => {
      mixedContentCount += 1;
    });
  }

  const internalHrefs = new Set<string>();
  $('a[href]').each((_, el) => {
    const href = String($(el).attr('href') || '');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const u = new URL(href, origin.href);
      if (u.hostname.replace(/^www\./, '') === origin.hostname.replace(/^www\./, '')) {
        internalHrefs.add(u.pathname);
      }
    } catch {
      /* skip */
    }
  });

  const scriptCount = $('script').length;
  const bodyTextLen = $('body').text().replace(/\s+/g, ' ').trim().length;
  const hasRenderHeavyJs = scriptCount > 15 && bodyTextLen < 500;

  const lcp = args.pagespeed?.lcp ?? null;
  const cls = args.pagespeed?.cls ?? null;
  const fidMs = args.pagespeed?.fid ?? null;

  const checks: TechnicalDeepResult['checks'] = [];

  checks.push({
    id: 'redirect_chain',
    label: 'Redirect chain (≤2 hops)',
    pass: redirectChainLength <= 2,
    severity: redirectChainLength > 4 ? 'critical' : 'warning',
    detail: `${redirectChainLength} redirect(s) detected`,
    fix: redirectChainLength > 2 ? 'Reduce redirect chains; link directly to final URLs' : undefined,
  });

  checks.push({
    id: 'mixed_content',
    label: 'No mixed HTTP content on HTTPS',
    pass: mixedContentCount === 0,
    severity: 'warning',
    detail: mixedContentCount ? `${mixedContentCount} HTTP asset(s) on HTTPS page` : 'No mixed content',
    fix: mixedContentCount ? 'Serve all assets over HTTPS' : undefined,
  });

  checks.push({
    id: 'lcp',
    label: 'LCP < 2.5s',
    pass: lcp != null && lcp < 2.5,
    severity: 'warning',
    detail: lcp != null ? `LCP ${lcp}s` : 'Set GOOGLE_PAGESPEED_API_KEY for Core Web Vitals',
    fix: lcp != null && lcp >= 2.5 ? 'Optimize images and server response time' : undefined,
  });

  checks.push({
    id: 'cls',
    label: 'CLS < 0.1',
    pass: cls != null && cls < 0.1,
    severity: 'warning',
    detail: cls != null ? `CLS ${cls}` : 'CLS not measured',
    fix: cls != null && cls >= 0.1 ? 'Reserve space for images/ads to prevent layout shift' : undefined,
  });

  checks.push({
    id: 'fid',
    label: 'FID < 100ms',
    pass: fidMs != null && fidMs < 100,
    severity: 'info',
    detail: fidMs != null ? `FID ${fidMs}ms` : 'FID not measured',
    fix: fidMs != null && fidMs >= 100 ? 'Reduce main-thread JavaScript' : undefined,
  });

  checks.push({
    id: 'response_time',
    label: 'Server response < 600ms',
    pass: serverResponseMs != null && serverResponseMs < 600,
    severity: 'warning',
    detail: serverResponseMs != null ? `TTFB ~${serverResponseMs}ms` : 'Could not measure',
    fix: serverResponseMs != null && serverResponseMs >= 600 ? 'Improve hosting, caching, or CDN' : undefined,
  });

  checks.push({
    id: 'js_rendering',
    label: 'Content visible without heavy JS',
    pass: !hasRenderHeavyJs,
    severity: 'info',
    detail: hasRenderHeavyJs ? 'Many scripts, little static HTML — may need SSR/prerender' : 'HTML content looks crawlable',
    fix: hasRenderHeavyJs ? 'Add SSR or static rendering for key pages' : undefined,
  });

  return {
    redirectChainLength,
    finalUrl,
    mixedContentCount,
    serverResponseMs,
    internalLinksFound: $('a[href]').length,
    uniqueInternalPaths: internalHrefs.size,
    estimatedCrawlablePages: Math.min(500, internalHrefs.size + 1),
    hasRenderHeavyJs,
    fidMs,
    cls,
    lcp,
    checks,
  };
}
