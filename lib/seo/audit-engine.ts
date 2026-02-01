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
  technical: {
    lcp?: number;
    fcp?: number;
    tti?: number;
    https: boolean;
    mobile: boolean;
    ssl_grade?: string;
  };
  onpage: {
    title: { length: number; keyword: boolean; optimal: boolean };
    description: { missing: boolean; tooLong: boolean; tooShort: boolean; length: number };
    h1: number;
    h2: number;
    h3: number;
    images: { total: number; missing: number; valid: number };
    canonical: boolean;
    robots: boolean;
    sitemap: boolean;
    open_graph: boolean;
    twitter_card: boolean;
    structured_data: boolean;
    links: { internal: number; external: number; total: number };
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
  backlinks?: {
    total_count: number;
    domain_count: number;
    anchor_text: Array<{ text: string; count: number }>;
    last_checked: Date;
  };
  local_seo?: {
    business_name: string | null;
    address: string | null;
    phone: string | null;
    gmb_present: boolean;
    gmb_url: string | null;
    review_count: number;
    average_rating: number | null;
    nap_consistency_score: number;
    local_rank: number | null;
  };
}

export class SEOAuditEngine {
  private domain: string;
  private baseUrl: string;

  constructor(domain: string) {
    this.domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Try to preserve original protocol, default to https
    const originalProtocol = domain.match(/^https?:\/\//)?.[0]?.replace('://', '') || 'https';
    this.baseUrl = `${originalProtocol}://${this.domain}`;
  }

  async runAudit(): Promise<AuditResult> {
    try {
      // Fetch page content
      const html = await this.fetchPage();
      
      // Validate we got meaningful content
      if (!html || html.length < 100) {
        throw new Error('Page returned empty or minimal content. The site may require authentication or block automated access.');
      }
      
      // Check for common bot-blocking patterns (but be less aggressive)
      // Only flag if multiple indicators are present or very clear blocking
      const botBlockPatterns = [
        /access denied.*bot|bot.*access denied/i,
        /you have been blocked/i,
        /cloudflare.*challenge|challenge.*cloudflare/i,
        /captcha.*required|required.*captcha/i,
        /please.*enable.*javascript.*to.*continue/i,
      ];
      
      const blockingScore = botBlockPatterns.filter(pattern => pattern.test(html)).length;
      // Only throw if we have strong evidence of blocking
      if (blockingScore >= 2 || html.includes('cf-browser-verification') || html.includes('challenge-platform')) {
        throw new Error('Site appears to be blocking automated access or requires authentication. Try a different website or ensure the site allows public access.');
      }
      
      const cheerioModule = await loadCheerio();
      const $ = cheerioModule.load(html);

      // Run all checks in parallel
      const [technical, onpage, content] = await Promise.all([
        this.checkTechnical($),
        this.checkOnPage($),
        this.checkContent($),
      ]);
      
      // Validate we extracted meaningful data
      const bodyText = $('body').text().trim();
      const hasTitle = onpage.title.length > 0;
      const hasContent = bodyText.length >= 50;
      const hasMeta = onpage.description.length > 0;
      
      // Only throw if we have NO meaningful data at all
      if (!hasTitle && !hasContent && !hasMeta) {
        throw new Error('Unable to extract meaningful content. The site may be JavaScript-heavy (SPA), require authentication, or block automated access. Our audit tool works best with traditional HTML websites that allow public access.');
      }
      
      // Warn but don't fail if content is minimal but we have some data
      if (!hasContent && hasTitle) {
        console.warn('Limited content extracted - site may be JavaScript-heavy');
      }

      // Calculate scores
      const technical_score = this.calculateTechnicalScore(technical);
      const onpage_score = this.calculateOnPageScore(onpage);
      const content_score = this.calculateContentScore(content);
      const overall_score = Math.round(
        (technical_score * 0.4 + onpage_score * 0.4 + content_score * 0.2)
      );

      // Generate issues
      const issues = this.generateIssues(technical, onpage, content);
      console.log(`Generated ${issues.length} issues for audit:`, issues.map(i => i.title));
      console.log('On-page data:', {
        open_graph: onpage.open_graph,
        twitter_card: onpage.twitter_card,
        structured_data: onpage.structured_data,
        links: onpage.links,
      });

      return {
        overall_score,
        technical_score,
        onpage_score,
        content_score,
        competitor_score: 0, // Will be calculated separately
        technical,
        onpage,
        content,
        issues,
      };
    } catch (error) {
      console.error('Audit error:', error);
      throw new Error(`Failed to run audit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchPage(): Promise<string> {
    // Try HTTPS first, then fall back to HTTP if it fails
    const urls = [
      `https://${this.domain}`,
      `http://${this.domain}`,
    ];

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          maxRedirects: 10,
          validateStatus: (status) => {
            // Accept 2xx, 3xx, and some 4xx (but not 401, 403 which are auth/blocked)
            return (status >= 200 && status < 300) || 
                   (status >= 300 && status < 400) ||
                   (status === 404); // 404 is OK, we can still analyze the error page structure
          },
        });
        
        // Check if we got redirected to a login/block page
        if (response.status === 401 || response.status === 403) {
          throw new Error('Site returned access denied (401/403). The site may require authentication.');
        }
        
        // Update baseUrl to the working protocol
        this.baseUrl = url;
        return response.data;
      } catch (error: any) {
        // If this is the last URL, throw the error
        if (url === urls[urls.length - 1]) {
          const errorMsg = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' 
            ? 'Connection timeout or reset. The site may be down or blocking requests.'
            : error.message || 'Unknown error';
          throw new Error(`Failed to fetch page: ${errorMsg}`);
        }
        // Otherwise, try the next URL (HTTP)
        continue;
      }
    }
    
    throw new Error('Failed to fetch page: Unable to connect via HTTPS or HTTP');
  }

  private async checkTechnical($: any) {
    // Check protocol from baseUrl (which was set during fetchPage)
    const url = new URL(this.baseUrl);
    const https = url.protocol === 'https:';

    // Check robots.txt
    let robots = false;
    try {
      const robotsUrl = `${url.origin}/robots.txt`;
      await axios.get(robotsUrl, { timeout: 5000 });
      robots = true;
    } catch {}

    // Check sitemap
    let sitemap = false;
    try {
      const sitemapUrl = `${url.origin}/sitemap.xml`;
      await axios.get(sitemapUrl, { timeout: 5000 });
      sitemap = true;
    } catch {}

    // Check mobile viewport
    const viewport = $('meta[name="viewport"]').attr('content') || '';
    const mobile = viewport.includes('width') || viewport.includes('device-width');

    return {
      https,
      mobile,
      robots,
      sitemap,
      ssl_grade: https ? 'A' : 'F',
    };
  }

  private checkOnPage($: any) {
    const title = $('title').text().trim();
    const titleLength = title.length;
    const titleOptimal = titleLength >= 30 && titleLength <= 60;
    const titleKeyword = title.length > 0; // Basic check

    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const descLength = metaDesc.length;
    const descMissing = !metaDesc;
    const descTooLong = descLength > 160;
    const descTooShort = descLength < 120 && descLength > 0;

    // Check for Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    const hasOpenGraph = !!(ogTitle || ogDescription || ogImage);

    // Check for Twitter Card tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
    const hasTwitterCard = !!twitterCard;

    // Check for structured data (JSON-LD)
    const structuredData = $('script[type="application/ld+json"]').length;
    const hasStructuredData = structuredData > 0;

    // Check for external links
    const allLinks = $('a[href]');
    let externalLinks = 0;
    let internalLinks = 0;
    allLinks.each((_: any, el: any) => {
      const href = $(el).attr('href') || '';
      if (href.startsWith('http://') || href.startsWith('https://')) {
        if (!href.includes(this.domain)) {
          externalLinks++;
        } else {
          internalLinks++;
        }
      } else if (href.startsWith('/') || href.startsWith('#') || (!href.startsWith('mailto:') && !href.startsWith('tel:'))) {
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

    images.each((_, el) => {
      const alt = $(el).attr('alt');
      if (!alt || alt.trim() === '') {
        missingAlt++;
      } else {
        validAlt++;
      }
    });

    const canonical = $('link[rel="canonical"]').length > 0;

    // Check for favicon
    const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '';
    const hasFavicon = !!favicon;

    // Check for language attribute
    const lang = $('html').attr('lang') || '';
    const hasLang = !!lang;

    // Check for charset
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content') || '';
    const hasCharset = !!charset;

    // Count external links with nofollow
    let externalNofollow = 0;
    allLinks.each((_: any, el: any) => {
      const href = $(el).attr('href') || '';
      const rel = $(el).attr('rel') || '';
      if ((href.startsWith('http://') || href.startsWith('https://')) && !href.includes(this.domain)) {
        if (rel.includes('nofollow')) {
          externalNofollow++;
        }
      }
    });

    return {
      title: {
        length: titleLength,
        keyword: titleKeyword,
        optimal: titleOptimal,
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
      },
      canonical,
      robots: true, // Checked separately
      sitemap: true, // Checked separately
      open_graph: hasOpenGraph,
      twitter_card: hasTwitterCard,
      structured_data: hasStructuredData,
      favicon: hasFavicon,
      lang: hasLang,
      charset: hasCharset,
      links: {
        internal: internalLinks,
        external: externalLinks,
        external_nofollow: externalNofollow,
        total: internalLinks + externalLinks,
      },
    };
  }

  private checkContent($: any) {
    // Get text from body, but prioritize headings and paragraphs
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Get headings text (more important for keywords)
    const headingsText = $('h1, h2, h3, h4, h5, h6').map((_: any, el: any) => $(el).text()).get().join(' ').toLowerCase();
    
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

    // Simple readability calculation (Flesch-like)
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
    const avgCharsPerWord = wordCount > 0 ? bodyText.length / wordCount : 0;
    const readability = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 1.5) - (avgCharsPerWord * 0.5)));

    // Extract keywords (simple frequency analysis)
    // Filter out common technical/stop words and JavaScript terms
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
      'stylesheet', 'script', 'link', 'href', 'src', 'alt', 'title', 'class', 'id',
      'div', 'span', 'body', 'head', 'html', 'style', 'data', 'attr', 'value',
      'classname', 'classname', 'children', 'child', 'parent', 'node', 'nodes',
      'text', 'textcontent', 'innerhtml', 'outerhtml', 'append', 'prepend',
      'remove', 'add', 'toggle', 'contains', 'matches', 'queryselector',
      'getelement', 'createelement', 'addeventlistener', 'removeeventlistener',
      'yellow', 'blue', 'red', 'green', 'black', 'white', 'orange', 'purple',
      'pink', 'gray', 'grey', 'brown', 'hover', 'active', 'focus', 'visited',
      'flex', 'grid', 'block', 'inline', 'absolute', 'relative', 'fixed',
      'margin', 'padding', 'border', 'background', 'color', 'font', 'size',
      'width', 'height', 'left', 'right', 'top', 'bottom', 'center', 'middle',
      'start', 'end', 'first', 'last', 'next', 'prev', 'previous', 'new', 'old',
      'big', 'small', 'large', 'tiny', 'huge', 'bold', 'italic', 'underline',
      'button', 'input', 'form', 'label', 'select', 'option', 'checkbox',
      'radio', 'submit', 'reset', 'hidden', 'disabled', 'enabled', 'visible'
    ]);
    
    // Extract words from all text sources
    const allText = bodyText.toLowerCase();
    const words = allText
      .match(/\b[a-z]{4,}\b/g) || []
      .filter(word => !stopWords.has(word) && word.length >= 4);
    
    const wordFreq: Record<string, number> = {};
    
    // Count words with weighting: headings are more important
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Boost words that appear in headings
    const headingWords = headingsText.match(/\b[a-z]{4,}\b/g) || [];
    headingWords.forEach(word => {
      if (!stopWords.has(word) && word.length >= 4) {
        wordFreq[word] = (wordFreq[word] || 0) + 2; // Double weight for heading words
      }
    });

    const totalWords = words.length;
    const keywordDensity = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15) // Get top 15, then filter more aggressively
      .filter(([term]) => {
        // Filter out single characters, numbers, and common technical patterns
        // Also filter out common HTML/JS/React terms that might leak into content
        const isTechnical = term.match(/^(api|url|http|https|www|com|org|net|html|css|js|json|xml|meta|content|name|type|data|attr|value|class|id|div|span|body|head|script|style|link|href|src|alt|title|text|children|classname|child|parent|node|nodes|textcontent|innerhtml|outerhtml|append|prepend|remove|add|toggle|contains|matches|queryselector|getelement|createelement|addeventlistener|removeeventlistener)$/i);
        const isGeneric = term.match(/^(text|blue|red|green|black|white|orange|purple|pink|gray|grey|brown|color|size|width|height|left|right|top|bottom|center|middle|start|end|first|last|next|prev|previous|new|old|big|small|large|tiny|huge|bold|italic|hover|active|focus|flex|grid|block|inline|absolute|relative|fixed|margin|padding|border|background|font|button|input|form|label|select|option|checkbox|radio|submit|reset|hidden|disabled|enabled|visible)$/i);
        return term.length >= 4 && 
               !/^\d+$/.test(term) && 
               !isTechnical &&
               !isGeneric &&
               !stopWords.has(term); // Double-check against stop words
      })
      .slice(0, 5) // Take top 5 after filtering
      .map(([term, count]) => ({
        term,
        pct: totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(2)) : 0,
      }));

    // Check for duplicate content (basic check)
    const duplicate = false; // Would need to compare with other pages

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
    if (technical.https) score += 30;
    if (technical.mobile) score += 20;
    if (technical.robots) score += 15;
    if (technical.sitemap) score += 15;
    // Add PageSpeed Insights scores if available
    if (technical.lcp && technical.lcp < 2.5) score += 10;
    if (technical.fcp && technical.fcp < 1.8) score += 10;
    return Math.min(100, score);
  }

  private calculateOnPageScore(onpage: any): number {
    let score = 0;
    if (onpage.title.length > 0) score += 20;
    if (onpage.title.optimal) score += 10;
    if (!onpage.description.missing) score += 20;
    if (!onpage.description.tooLong && !onpage.description.tooShort) score += 10;
    if (onpage.h1 === 1) score += 15;
    if (onpage.h2 > 0) score += 10;
    if (onpage.images.valid > 0) score += 10;
    if (onpage.canonical) score += 5;
    return Math.min(100, score);
  }

  private calculateContentScore(content: any): number {
    let score = 0;
    if (content.word_count > 300) score += 30;
    if (content.readability > 50) score += 30;
    if (content.keyword_density.length > 0) score += 20;
    if (!content.duplicate) score += 20;
    return Math.min(100, score);
  }

  private generateIssues(technical: any, onpage: any, content: any) {
    const issues: AuditResult['issues'] = [];

    // Technical issues
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
        fix_suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your <head>.',
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

    // On-page issues
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
        description: 'Images without alt text are not accessible and hurt SEO.',
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

    // Check for Open Graph tags
    if (!onpage.open_graph) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Missing Open Graph tags',
        description: 'Open Graph tags improve how your content appears when shared on social media.',
        fix_suggestion: 'Add og:title, og:description, and og:image meta tags to improve social sharing.',
      });
    }

    // Check for Twitter Card
    if (!onpage.twitter_card) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Missing Twitter Card tags',
        description: 'Twitter Cards improve how your content appears when shared on Twitter.',
        fix_suggestion: 'Add twitter:card and other Twitter Card meta tags.',
      });
    }

    // Check for structured data
    if (!onpage.structured_data) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'No structured data found',
        description: 'Structured data (JSON-LD) helps search engines understand your content better.',
        fix_suggestion: 'Add structured data using JSON-LD format to improve rich snippets in search results.',
      });
    }

    // Check for too many external links
    if (onpage.links && onpage.links.external > 0) {
      const externalRatio = onpage.links.total > 0 ? onpage.links.external / onpage.links.total : 0;
      if (externalRatio > 0.5) {
        issues.push({
          type: 'onpage',
          severity: 'warning',
          title: 'Too many external links',
          description: `Your page has ${onpage.links.external} external links out of ${onpage.links.total} total. Too many external links can hurt SEO.`,
          fix_suggestion: 'Reduce external links or add rel="nofollow" to external links that don\'t add value.',
        });
      }
    }

    // Check for too few internal links
    if (onpage.links && onpage.links.internal < 3) {
      issues.push({
        type: 'onpage',
        severity: 'info',
        title: 'Few internal links found',
        description: `Your page has only ${onpage.links.internal} internal links. Internal linking helps distribute page authority.`,
        fix_suggestion: 'Add more internal links to related pages to improve site structure and SEO.',
      });
    }

    // Content issues
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

    // Additional technical checks
    if (!onpage.favicon) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Missing favicon',
        description: 'A favicon helps with brand recognition and user experience.',
        fix_suggestion: 'Add a favicon.ico file and link it in your <head> with <link rel="icon" href="/favicon.ico">.',
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

    // Additional on-page checks
    if (onpage.h2 === 0 && onpage.h3 === 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'No H2 or H3 headings found',
        description: 'Subheadings help structure content and improve readability.',
        fix_suggestion: 'Add H2 and H3 headings to organize your content into logical sections.',
      });
    }

    if (onpage.images.total > 0 && onpage.images.total > 10 && onpage.images.missing > 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'Multiple images missing alt text',
        description: `${onpage.images.missing} out of ${onpage.images.total} images are missing alt text.`,
        fix_suggestion: 'Add descriptive alt text to all images for better accessibility and SEO.',
      });
    }

    if (onpage.links && onpage.links.total > 0 && onpage.links.internal === 0) {
      issues.push({
        type: 'onpage',
        severity: 'warning',
        title: 'No internal links found',
        description: 'Internal linking helps distribute page authority and improves site structure.',
        fix_suggestion: 'Add internal links to related pages on your site.',
      });
    }

    if (onpage.links && onpage.links.external > 0) {
      const nofollowCount = onpage.links.external - (onpage.links.external_nofollow || 0);
      if (nofollowCount > 3) {
        issues.push({
          type: 'onpage',
          severity: 'info',
          title: 'External links without nofollow',
          description: `You have ${nofollowCount} external links without rel="nofollow". Consider adding nofollow to links that don't add SEO value.`,
          fix_suggestion: 'Add rel="nofollow" to external links that don\'t need to pass link juice.',
        });
      }
    }

    // Content quality checks
    if (content.word_count > 0 && content.word_count < 500 && onpage.h2 === 0) {
      issues.push({
        type: 'content',
        severity: 'info',
        title: 'Content structure could be improved',
        description: 'Your content could benefit from better organization with headings.',
        fix_suggestion: 'Break up your content with H2 and H3 headings to improve readability and SEO.',
      });
    }

    if (content.keyword_density && content.keyword_density.length > 0) {
      const topKeyword = content.keyword_density[0];
      if (topKeyword.pct > 5) {
        issues.push({
          type: 'content',
          severity: 'warning',
          title: 'Potential keyword stuffing detected',
          description: `Your top keyword "${topKeyword.term}" appears ${topKeyword.pct}% of the time, which may be excessive.`,
          fix_suggestion: 'Reduce keyword density to 1-3% and use natural language variations.',
        });
      }
    }

    // Performance and UX checks
    if (technical.lcp && technical.lcp > 2.5) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'Slow Largest Contentful Paint (LCP)',
        description: `Your LCP is ${technical.lcp.toFixed(2)}s. Target is under 2.5s for good user experience.`,
        fix_suggestion: 'Optimize images, reduce server response time, and eliminate render-blocking resources.',
      });
    }

    if (technical.fcp && technical.fcp > 1.8) {
      issues.push({
        type: 'technical',
        severity: 'info',
        title: 'Slow First Contentful Paint (FCP)',
        description: `Your FCP is ${technical.fcp.toFixed(2)}s. Target is under 1.8s.`,
        fix_suggestion: 'Minify CSS, reduce render-blocking resources, and optimize critical rendering path.',
      });
    }

    if (technical.cls && technical.cls > 0.1) {
      issues.push({
        type: 'technical',
        severity: 'warning',
        title: 'High Cumulative Layout Shift (CLS)',
        description: `Your CLS is ${technical.cls.toFixed(3)}. Target is under 0.1 for good user experience.`,
        fix_suggestion: 'Add size attributes to images and videos, avoid inserting content above existing content.',
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
          timeout: 35000, // 35 second timeout for slow sites
        }
      );

      if (!response.data?.lighthouseResult) {
        console.error('PageSpeed Insights: Invalid response structure');
        return null;
      }

      const lighthouse = response.data.lighthouseResult;
      const audits = lighthouse.audits;
      
      const metrics = {
        lcp: audits['largest-contentful-paint']?.numericValue ? audits['largest-contentful-paint'].numericValue / 1000 : null,
        fcp: audits['first-contentful-paint']?.numericValue ? audits['first-contentful-paint'].numericValue / 1000 : null,
        tti: audits['interactive']?.numericValue ? audits['interactive'].numericValue / 1000 : null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,
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
