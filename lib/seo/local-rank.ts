import axios from 'axios';

export interface LocalRankResult {
  position: number | null;          // 1-based position in local pack, null = not in top 20
  in_local_pack: boolean;           // appears in the 3-pack
  competitors: string[];            // names of businesses that outrank
  search_query: string;             // the query used
  location_detected: string | null; // town/city we searched for
  source: 'google' | 'estimated';
  pack_present: boolean;            // did Google even show a local pack?
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
};

export async function checkGoogleLocalRank(
  domain: string,
  businessName: string | null,
  address: string | null,
  schemaTypes: string[],
): Promise<LocalRankResult> {

  // Build location hint from address (take city/town part)
  let location: string | null = null;
  if (address) {
    const parts = address.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
    // UK postcode pattern at end — take part before it as city
    location = parts.find(p => /^[A-Za-z][a-zA-Z\s]{2,20}$/.test(p) && !/^\d/.test(p)) ?? parts[0] ?? null;
  }

  // Derive a search term from schema type or business name
  const typeMap: Record<string, string> = {
    Plumber: 'plumber', LegalService: 'solicitor', Attorney: 'solicitor',
    Dentist: 'dentist', Doctor: 'GP doctor', AccountingService: 'accountant',
    Restaurant: 'restaurant', Hotel: 'hotel', BeautySalon: 'beauty salon',
    AutoDealer: 'car dealer', GroceryStore: 'grocery store',
    HomeAndConstructionBusiness: 'builder', RealEstateAgent: 'estate agent',
    MedicalOrganization: 'medical clinic', LocalBusiness: 'business',
  };
  const schemaType = schemaTypes.find(t => typeMap[t]);
  const serviceKeyword = schemaType ? typeMap[schemaType] : (businessName ?? domain.split('.')[0].replace(/-/g, ' '));

  const searchQuery = location ? `${serviceKeyword} ${location}` : serviceKeyword;
  const url = `https://www.google.co.uk/search?q=${encodeURIComponent(searchQuery)}&gl=gb&hl=en&num=10`;

  try {
    const response = await axios.get(url, {
      headers: BROWSER_HEADERS,
      timeout: 9000,
      maxRedirects: 3,
      validateStatus: s => s < 400,
    });

    const html: string = typeof response.data === 'string' ? response.data : '';

    // Detect CAPTCHA / bot block
    if (/sorry\/index|captcha|recaptcha|unusual traffic/i.test(html)) {
      return fallbackEstimate(searchQuery, location);
    }

    // Detect presence of a local pack
    // Google local pack contains these stable identifiers
    const packPresent =
      /data-hveid|ludocid|\/maps\/place\//i.test(html) ||
      html.includes('lclud');

    if (!packPresent) {
      return {
        position: null,
        in_local_pack: false,
        competitors: [],
        search_query: searchQuery,
        location_detected: location,
        source: 'google',
        pack_present: false,
      };
    }

    // Extract local pack business names
    // Google uses <div class="dbg0pd"> or <span class="OSrXXb"> for business names in local pack
    // Also extract via aria-labels on result links
    const namePatterns = [
      /<div class="[^"]*dbg0pd[^"]*"[^>]*>\s*<span[^>]*>([^<]{3,60})<\/span>/g,
      /<h3[^>]*class="[^"]*"[^>]*>\s*([^<]{3,60})\s*<\/h3>/g,
      /aria-label="([^"]{3,60})"/g,
    ];

    const rawNames: string[] = [];
    for (const pattern of namePatterns) {
      let m: RegExpExecArray | null;
      const re = new RegExp(pattern.source, pattern.flags);
      while ((m = re.exec(html)) !== null && rawNames.length < 20) {
        const name = m[1].trim();
        if (name.length > 3 && name.length < 60 && !/^\d+$/.test(name)) {
          rawNames.push(name);
        }
      }
    }

    // Check if domain or business name appears in the result HTML
    const domainClean = domain.replace(/^www\./, '');
    const domainInResults = html.toLowerCase().includes(domainClean.toLowerCase());
    const nameInResults = businessName
      ? html.toLowerCase().includes(businessName.toLowerCase())
      : false;

    const inLocalPack = domainInResults || nameInResults;

    // Rough position detection: find where domain first appears relative to pack entries
    let position: number | null = null;
    if (inLocalPack) {
      // Very rough: count how many competitor names appear before our domain
      const domainIdx = html.toLowerCase().indexOf(domainClean.toLowerCase());
      const before = html.substring(0, domainIdx);
      // Count ludocid appearances before our domain (each = one local result)
      const before_results = (before.match(/ludocid/g) || []).length;
      position = Math.min(before_results + 1, 20);
    }

    // Get up to 3 competitor names (first entries in pack that aren't ours)
    const competitors = rawNames
      .filter(n => !businessName || !n.toLowerCase().includes(businessName.toLowerCase().split(' ')[0]))
      .slice(0, 3);

    return {
      position,
      in_local_pack: inLocalPack,
      competitors,
      search_query: searchQuery,
      location_detected: location,
      source: 'google',
      pack_present: packPresent,
    };

  } catch {
    return fallbackEstimate(searchQuery, location);
  }
}

function fallbackEstimate(query: string, location: string | null): LocalRankResult {
  return {
    position: null,
    in_local_pack: false,
    competitors: [],
    search_query: query,
    location_detected: location,
    source: 'estimated',
    pack_present: false,
  };
}
