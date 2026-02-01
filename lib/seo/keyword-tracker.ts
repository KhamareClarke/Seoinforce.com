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

export interface KeywordRanking {
  keyword: string;
  rank: number | null;
  url: string | null;
  title: string | null;
  date: Date;
}

export class KeywordTracker {
  private apiKey: string | null;

  constructor() {
    // Use ScrapeOps or SerpAPI - both have free tiers
    // Check environment variables directly (works in both client and server)
    this.apiKey = process.env.SCRAPEOPS_API_KEY || process.env.SERPAPI_KEY || null;
    
    // Log for debugging (only in development)
    if (process.env.NODE_ENV === 'development' && !this.apiKey) {
      console.warn('No keyword ranking API key found. Add SCRAPEOPS_API_KEY or SERPAPI_KEY to .env.local');
    }
  }

  async getRanking(keyword: string, domain: string, location: string = 'United Kingdom'): Promise<KeywordRanking> {
    if (!this.apiKey) {
      // Fallback: return mock data for development
      console.warn('No API key configured. Returning mock data.');
      return {
        keyword,
        rank: Math.floor(Math.random() * 50) + 1,
        url: `https://${domain}`,
        title: 'Mock Result',
        date: new Date(),
      };
    }

    try {
      // Try ScrapeOps first (free tier: 100 requests/month)
      const scrapeOpsKey = process.env.SCRAPEOPS_API_KEY;
      if (scrapeOpsKey) {
        console.log('Using ScrapeOps API for ranking...');
        return await this.getRankingScrapeOps(keyword, domain, location);
      }

      // Fallback to SerpAPI
      const serpApiKey = process.env.SERPAPI_KEY;
      if (serpApiKey) {
        console.log('Using SerpAPI for ranking...');
        return await this.getRankingSerpAPI(keyword, domain, location);
      }
    } catch (error) {
      console.error('Keyword ranking error:', error);
      throw new Error(`Failed to get ranking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    throw new Error('No API key configured');
  }

  private async getRankingScrapeOps(keyword: string, domain: string, location: string): Promise<KeywordRanking> {
    const response = await axios.get('https://api.scrapeops.io/v1/serp', {
      params: {
        api_key: process.env.SCRAPEOPS_API_KEY,
        query: keyword,
        location: location,
        num_results: 100,
      },
      timeout: 30000,
    });

    const results = response.data.results?.organic || [];
    const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const resultUrl = result.url?.toLowerCase() || '';
      
      if (resultUrl.includes(domainLower)) {
        return {
          keyword,
          rank: i + 1,
          url: result.url,
          title: result.title,
          date: new Date(),
        };
      }
    }

    return {
      keyword,
      rank: null,
      url: null,
      title: null,
      date: new Date(),
    };
  }

  private async getRankingSerpAPI(keyword: string, domain: string, location: string): Promise<KeywordRanking> {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: process.env.SERPAPI_KEY,
        q: keyword,
        location: location,
        num: 100,
      },
      timeout: 30000,
    });

    const results = response.data.organic_results || [];
    const domainLower = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const resultUrl = result.link?.toLowerCase() || '';
      
      if (resultUrl.includes(domainLower)) {
        return {
          keyword,
          rank: i + 1,
          url: result.link,
          title: result.title,
          date: new Date(),
        };
      }
    }

    return {
      keyword,
      rank: null,
      url: null,
      title: null,
      date: new Date(),
    };
  }

  async getCompetitorKeywords(competitorDomain: string, limit: number = 50): Promise<Array<{
    keyword: string;
    rank: number;
    search_volume?: number;
    difficulty?: number;
    url: string;
  }>> {
    try {
      // Step 1: Scrape competitor's homepage to extract real keywords
      const keywords = await this.extractKeywordsFromDomain(competitorDomain, limit);
      
      if (keywords.length === 0) {
        console.warn(`No keywords extracted from ${competitorDomain}`);
        return [];
      }

      // Step 2: Get real rankings for extracted keywords
      const keywordRankings = await Promise.all(
        keywords.slice(0, limit).map(async (keyword) => {
          try {
            const ranking = await this.getRanking(keyword, competitorDomain, 'United Kingdom');
            return {
              keyword,
              rank: ranking.rank || 0,
              search_volume: undefined, // Not available from free APIs
              difficulty: undefined, // Not available from free APIs
              url: ranking.url || `https://${competitorDomain}`,
            };
          } catch (error) {
            // If ranking fails, still return the keyword with rank 0
            return {
              keyword,
              rank: 0,
              search_volume: undefined,
              difficulty: undefined,
              url: `https://${competitorDomain}`,
            };
          }
        })
      );

      // Filter out keywords with no rank or rank 0, sort by rank
      return keywordRankings
        .filter(kw => kw.rank > 0)
        .sort((a, b) => a.rank - b.rank)
        .slice(0, limit);
    } catch (error) {
      console.error(`Error getting competitor keywords for ${competitorDomain}:`, error);
      return [];
    }
  }

  async extractKeywordsFromDomain(domain: string, limit: number = 50): Promise<string[]> {
    try {
      // Fetch the competitor's homepage
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        timeout: 15000,
        maxRedirects: 5,
      });

      const html = response.data;
      
      // Use Cheerio to parse HTML (dynamic import to avoid build issues)
      const Cheerio = await loadCheerio();
      const $ = Cheerio.load(html);

      // Extract text content
      const title = $('title').text() || '';
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      const headings = $('h1, h2, h3').map((_, el) => $(el).text()).get().join(' ');
      const bodyText = $('body').text() || '';
      
      // Combine all text
      const allText = `${title} ${metaDescription} ${headings} ${bodyText}`.toLowerCase();

      // Stop words to filter out
      const stopWords = new Set([
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
        'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him',
        'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
        'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
        'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having', 'do', 'does',
        'did', 'doing', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'shall', 'can', 'cannot', 'more', 'most', 'very', 'much',
        'many', 'some', 'any', 'all', 'each', 'every', 'few', 'little', 'other', 'another', 'such', 'same', 'different', 'own', 'next', 'last',
        'click', 'here', 'read', 'more', 'learn', 'about', 'contact', 'us', 'home', 'page', 'site', 'website', 'web', 'page', 'link', 'links',
        'menu', 'navigation', 'header', 'footer', 'content', 'section', 'div', 'span', 'class', 'id', 'href', 'src', 'alt', 'title', 'meta',
        'html', 'body', 'head', 'script', 'style', 'css', 'javascript', 'js', 'json', 'xml', 'http', 'https', 'www', 'com', 'org', 'net', 'io',
        'classname', 'children', 'child', 'parent', 'node', 'nodes', 'text', 'textcontent', 'innerhtml', 'outerhtml', 'append', 'prepend',
        'remove', 'add', 'toggle', 'contains', 'matches', 'queryselector', 'getelement', 'createelement', 'addeventlistener', 'removeeventlistener',
        'yellow', 'blue', 'red', 'green', 'black', 'white', 'orange', 'purple', 'pink', 'gray', 'grey', 'brown', 'hover', 'active', 'focus', 'visited',
        'flex', 'grid', 'block', 'inline', 'absolute', 'relative', 'fixed', 'margin', 'padding', 'border', 'background', 'color', 'font', 'size',
        'width', 'height', 'left', 'right', 'top', 'bottom', 'center', 'middle', 'start', 'end', 'first', 'last', 'next', 'prev', 'previous', 'new', 'old',
        'big', 'small', 'large', 'tiny', 'huge', 'bold', 'italic', 'underline', 'button', 'input', 'form', 'label', 'select', 'option', 'checkbox',
        'radio', 'submit', 'reset', 'hidden', 'disabled', 'enabled', 'visible', 'null', 'undefined', 'true', 'false', 'function', 'var', 'let', 'const',
        'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super',
        'extends', 'import', 'export', 'default', 'from', 'as', 'async', 'await', 'promise', 'resolve', 'reject', 'then', 'catch', 'finally',
        'array', 'object', 'string', 'number', 'boolean', 'date', 'math', 'json', 'parse', 'stringify', 'keys', 'values', 'entries', 'length',
        'push', 'pop', 'shift', 'unshift', 'splice', 'slice', 'concat', 'join', 'split', 'reverse', 'sort', 'filter', 'map', 'reduce', 'foreach',
        'indexof', 'lastindexof', 'includes', 'find', 'findindex', 'some', 'every', 'fill', 'copywithin', 'flat', 'flatmap', 'from', 'of', 'isarray',
        'tostring', 'tolocalestring', 'valueof', 'hasownproperty', 'propertyisenumerable', 'isprototypeof', 'tostring', 'constructor', 'prototype',
        'get', 'set', 'defineproperty', 'defineproperties', 'getownpropertydescriptor', 'getownpropertynames', 'getownpropertysymbols', 'getprototypeof',
        'setprototypeof', 'preventextensions', 'isextensible', 'seal', 'isfrozen', 'freeze', 'assign', 'create', 'keys', 'values', 'entries', 'fromentries',
        'hasown', 'getownpropertydescriptors', 'getownpropertynames', 'getownpropertysymbols', 'getprototypeof', 'setprototypeof', 'preventextensions',
        'isextensible', 'seal', 'isfrozen', 'freeze', 'assign', 'create', 'keys', 'values', 'entries', 'fromentries', 'hasown', 'getownpropertydescriptors'
      ]);

      // Extract meaningful words (4+ characters, not stop words)
      const words = allText
        .match(/\b[a-z]{4,}\b/g) || []
        .filter(word => !stopWords.has(word) && word.length >= 4);

      // Count word frequency
      const wordFreq: Record<string, number> = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      // Boost words that appear in headings
      const headingWords = headings.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      headingWords.forEach(word => {
        if (!stopWords.has(word) && word.length >= 4) {
          wordFreq[word] = (wordFreq[word] || 0) + 2; // Double weight for heading words
        }
      });

      // Sort by frequency and return top keywords
      return Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([keyword]) => keyword);
    } catch (error) {
      console.error(`Error extracting keywords from ${domain}:`, error);
      // Fallback: return domain name as keyword
      return [domain.replace(/^https?:\/\//, '').replace(/\/$/, '').split('.')[0]];
    }
  }
}
