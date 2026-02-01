import axios from 'axios';

// Dynamic import for cheerio to avoid build issues
let cheerioModule: any;
const loadCheerio = async () => {
  if (!cheerioModule) {
    const mod = await import('cheerio');
    cheerioModule = mod.default || mod;
  }
  return cheerioModule;
};

export interface BacklinkData {
  total_count: number;
  domain_count: number;
  anchor_text: Array<{ text: string; count: number }>;
  last_checked: Date;
}

export class BacklinkChecker {
  async getBacklinks(domain: string): Promise<BacklinkData> {
    // Try multiple sources in order of preference
    const sources = [
      () => this.getBacklinksAhrefsAPI(domain),
      () => this.getBacklinksDataForSEO(domain),
      () => this.getBacklinksBacklinkWatch(domain),
      () => this.getBacklinksSmallSEOTools(domain),
      () => this.getBacklinksOpenLinkProfiler(domain),
    ];

    for (const source of sources) {
      try {
        const result = await source();
        // Only return if we got actual data (not zeros)
        if (result.total_count > 0 || result.domain_count > 0) {
          return result;
        }
      } catch (error: any) {
        // Continue to next source
        console.log(`Backlink source failed, trying next: ${error.message}`);
        continue;
      }
    }

    // All sources failed, return basic fallback
    return await this.getBacklinksBasic(domain);
  }

  private async getBacklinksOpenLinkProfiler(domain: string): Promise<BacklinkData> {
    try {
      // OpenLinkProfiler.org doesn't have a public API, so we'll scrape
      // For production, consider using a paid service like Ahrefs API or Moz API
      // Clean domain: remove www, http, https, trailing slashes
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();
      
      console.log(`Attempting to fetch backlinks from OpenLinkProfiler for: ${cleanDomain}`);
      
      // OpenLinkProfiler uses format: https://www.openlinkprofiler.org/r/domain.com
      const url = `https://www.openlinkprofiler.org/r/${cleanDomain}`;
      
      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.openlinkprofiler.org/',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Accept all status codes except server errors
      });

      // Check if we got a 404 or error page
      if (response.status === 404 || response.data.includes('not found') || response.data.includes('404')) {
        console.log(`Domain ${cleanDomain} not found in OpenLinkProfiler database`);
        throw new Error('Domain not found in OpenLinkProfiler database');
      }

      const Cheerio = await loadCheerio();
      const $ = Cheerio.load(response.data);
      
      // OpenLinkProfiler page structure may vary, try multiple selectors
      let totalCount = 0;
      let domainCount = 0;
      
      // Try to find backlink count in various ways
      const bodyText = $('body').text();
      const htmlContent = $.html();
      
      // Look for patterns like "X backlinks" or "Total: X" in text
      const backlinkPatterns = [
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s*(?:total\s+)?backlinks?/gi,
        /backlinks?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /total[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s+links?/gi,
      ];
      
      for (const pattern of backlinkPatterns) {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          const numbers = matches[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/i);
          if (numbers) {
            let num = numbers[1].replace(/,/g, '');
            // Handle K/M suffixes
            if (num.toLowerCase().endsWith('k')) {
              totalCount = Math.floor(parseFloat(num) * 1000);
            } else if (num.toLowerCase().endsWith('m')) {
              totalCount = Math.floor(parseFloat(num) * 1000000);
            } else {
              totalCount = parseInt(num) || 0;
            }
            if (totalCount > 0) {
              console.log(`Found total backlinks: ${totalCount}`);
              break;
            }
          }
        }
      }
      
      // Look for referring domains
      const domainPatterns = [
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s*(?:referring\s+)?domains?/gi,
        /domains?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s+referring/gi,
      ];
      
      for (const pattern of domainPatterns) {
        const matches = bodyText.match(pattern);
        if (matches && matches.length > 0) {
          const numbers = matches[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/i);
          if (numbers) {
            let num = numbers[1].replace(/,/g, '');
            // Handle K/M suffixes
            if (num.toLowerCase().endsWith('k')) {
              domainCount = Math.floor(parseFloat(num) * 1000);
            } else if (num.toLowerCase().endsWith('m')) {
              domainCount = Math.floor(parseFloat(num) * 1000000);
            } else {
              domainCount = parseInt(num) || 0;
            }
            if (domainCount > 0) {
              console.log(`Found referring domains: ${domainCount}`);
              break;
            }
          }
        }
      }

      // If we couldn't extract data, the page might not have data for this domain
      if (totalCount === 0 && domainCount === 0) {
        console.log('Could not extract backlink data from OpenLinkProfiler page');
        throw new Error('No backlink data found on OpenLinkProfiler page');
      }

      return {
        total_count: totalCount,
        domain_count: domainCount,
        anchor_text: [], // Would need more parsing
        last_checked: new Date(),
      };
    } catch (error: any) {
      // If it's a 404, the domain might not be in OpenLinkProfiler's database
      if (error.response?.status === 404 || error.message?.includes('not found') || error.message?.includes('No backlink data')) {
        console.log(`OpenLinkProfiler: Domain ${domain} not available (404 or no data)`);
        throw error; // Re-throw to trigger fallback
      } else {
        console.error('OpenLinkProfiler error:', error.message || error);
        throw error;
      }
    }
  }

  // Ahrefs API (paid, requires API key)
  private async getBacklinksAhrefsAPI(domain: string): Promise<BacklinkData> {
    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) {
      throw new Error('Ahrefs API key not configured');
    }

    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();

      const response = await axios.get('https://apiv2.ahrefs.com', {
        params: {
          token: apiKey,
          from: 'backlinks',
          target: cleanDomain,
          output: 'json',
          mode: 'domain',
          limit: 0, // Just get summary
        },
        timeout: 15000,
      });

      if (response.data?.metrics) {
        return {
          total_count: response.data.metrics.backlinks || 0,
          domain_count: response.data.metrics.refdomains || 0,
          anchor_text: [],
          last_checked: new Date(),
        };
      }
      throw new Error('Invalid Ahrefs API response');
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('Ahrefs API: Invalid API key or insufficient permissions');
      }
      throw error;
    }
  }

  // DataForSEO Backlinks API (paid, requires API key)
  private async getBacklinksDataForSEO(domain: string): Promise<BacklinkData> {
    const login = process.env.DATAFORSEO_LOGIN;
    const password = process.env.DATAFORSEO_PASSWORD;
    if (!login || !password) {
      throw new Error('DataForSEO credentials not configured');
    }

    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();

      // First, get summary
      const response = await axios.post(
        'https://api.dataforseo.com/v3/backlinks/summary/live',
        [{
          target: cleanDomain,
        }],
        {
          auth: {
            username: login,
            password: password,
          },
          timeout: 20000,
        }
      );

      if (response.data?.tasks?.[0]?.result?.[0]?.metrics) {
        const metrics = response.data.tasks[0].result[0].metrics;
        return {
          total_count: metrics.backlinks || 0,
          domain_count: metrics.referring_domains || 0,
          anchor_text: [],
          last_checked: new Date(),
        };
      }
      throw new Error('Invalid DataForSEO API response');
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('DataForSEO API: Invalid credentials or insufficient permissions');
      }
      throw error;
    }
  }

  // BacklinkWatch (free, scraping)
  private async getBacklinksBacklinkWatch(domain: string): Promise<BacklinkData> {
    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();

      const url = `https://www.backlinkwatch.com/index.php?domain=${encodeURIComponent(cleanDomain)}`;

      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 5,
      });

      const Cheerio = await loadCheerio();
      const $ = Cheerio.load(response.data);
      const bodyText = $('body').text();

      let totalCount = 0;
      let domainCount = 0;

      // Look for patterns in BacklinkWatch format
      const patterns = [
        /Total\s+Backlinks?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s+total\s+backlinks?/gi,
        /Backlinks?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
      ];

      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const numStr = match[1]?.replace(/,/g, '') || match[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/i)?.[1]?.replace(/,/g, '');
          if (numStr) {
            if (numStr.toLowerCase().endsWith('k')) {
              totalCount = Math.floor(parseFloat(numStr) * 1000);
            } else if (numStr.toLowerCase().endsWith('m')) {
              totalCount = Math.floor(parseFloat(numStr) * 1000000);
            } else {
              totalCount = parseInt(numStr) || 0;
            }
            if (totalCount > 0) break;
          }
        }
      }

      // Look for referring domains
      const domainPatterns = [
        /Referring\s+Domains?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s+referring\s+domains?/gi,
      ];

      for (const pattern of domainPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const numStr = match[1]?.replace(/,/g, '') || match[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/i)?.[1]?.replace(/,/g, '');
          if (numStr) {
            if (numStr.toLowerCase().endsWith('k')) {
              domainCount = Math.floor(parseFloat(numStr) * 1000);
            } else if (numStr.toLowerCase().endsWith('m')) {
              domainCount = Math.floor(parseFloat(numStr) * 1000000);
            } else {
              domainCount = parseInt(numStr) || 0;
            }
            if (domainCount > 0) break;
          }
        }
      }

      if (totalCount === 0 && domainCount === 0) {
        throw new Error('No backlink data found on BacklinkWatch');
      }

      return {
        total_count: totalCount,
        domain_count: domainCount,
        anchor_text: [],
        last_checked: new Date(),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`BacklinkWatch: Domain ${domain} not found`);
      }
      throw error;
    }
  }

  // SmallSEOTools (free, scraping)
  private async getBacklinksSmallSEOTools(domain: string): Promise<BacklinkData> {
    try {
      const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/$/, '')
        .toLowerCase();

      const url = `https://smallseotools.com/backlink-checker/`;

      // SmallSEOTools uses a form submission, so we'll try to scrape results
      // This is a simplified approach - may need adjustment based on their actual structure
      const response = await axios.post(
        url,
        `url=${encodeURIComponent(cleanDomain)}`,
        {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          maxRedirects: 5,
        }
      );

      const Cheerio = await loadCheerio();
      const $ = Cheerio.load(response.data);
      const bodyText = $('body').text();

      let totalCount = 0;
      let domainCount = 0;

      // Look for common patterns
      const patterns = [
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)\s+backlinks?/gi,
        /backlinks?[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
        /total[:\s]+(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/gi,
      ];

      for (const pattern of patterns) {
        const matches = bodyText.match(pattern);
        if (matches) {
          const numStr = matches[0].match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?[km]?)/i)?.[1]?.replace(/,/g, '');
          if (numStr) {
            if (numStr.toLowerCase().endsWith('k')) {
              totalCount = Math.floor(parseFloat(numStr) * 1000);
            } else if (numStr.toLowerCase().endsWith('m')) {
              totalCount = Math.floor(parseFloat(numStr) * 1000000);
            } else {
              totalCount = parseInt(numStr) || 0;
            }
            if (totalCount > 0) break;
          }
        }
      }

      if (totalCount === 0 && domainCount === 0) {
        throw new Error('No backlink data found on SmallSEOTools');
      }

      return {
        total_count: totalCount,
        domain_count: domainCount,
        anchor_text: [],
        last_checked: new Date(),
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`SmallSEOTools: Domain ${domain} not found`);
      }
      throw error;
    }
  }

  private async getBacklinksBasic(domain: string): Promise<BacklinkData> {
    // Basic fallback - in production, use a proper backlink API
    console.warn('All backlink sources failed. Consider adding API keys for Ahrefs or DataForSEO.');
    
    return {
      total_count: 0,
      domain_count: 0,
      anchor_text: [],
      last_checked: new Date(),
    };
  }

  async getBacklinkHistory(domain: string, days: number = 30): Promise<Array<{
    date: Date;
    total_count: number;
    domain_count: number;
    gained: number;
    lost: number;
  }>> {
    // This would track backlink changes over time
    // For now, return empty array - would need database integration
    return [];
  }
}
