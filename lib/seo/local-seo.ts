import axios from 'axios';

export interface LocalSEOData {
  business_name: string | null;
  address: string | null;
  phone: string | null;
  gmb_present: boolean;
  gmb_url: string | null;
  review_count: number;
  average_rating: number | null;
  nap_consistency_score: number;
  local_rank: number | null;
  // Extended signals
  has_local_schema: boolean;
  has_maps_embed: boolean;
  has_contact_page: boolean;
  schema_phone: string | null;
  schema_address: string | null;
}

export class LocalSEOChecker {
  async checkLocalSEO(domain: string, businessName?: string): Promise<LocalSEOData> {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `https://${normalizedDomain}`;

    // Fetch homepage HTML
    let html = '';
    try {
      const res = await axios.get(baseUrl, {
        timeout: 12000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOInForce/1.0)' },
        maxRedirects: 5,
      });
      html = typeof res.data === 'string' ? res.data : '';
    } catch {
      // Try contact page if homepage fails
    }

    // Also try contact page for richer NAP data
    let contactHtml = '';
    try {
      const contactRes = await axios.get(`${baseUrl}/contact`, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SEOInForce/1.0)' },
        maxRedirects: 3,
      });
      contactHtml = typeof contactRes.data === 'string' ? contactRes.data : '';
    } catch {
      // Non-critical
    }

    const combinedHtml = html + ' ' + contactHtml;

    // --- Extract structured data ---
    const schemaData = this.extractSchemaData(combinedHtml);

    // --- Extract NAP from HTML ---
    const napData = this.extractNAP(combinedHtml, schemaData);

    // --- Check for GMB signals ---
    const gmbData = this.detectGMBSignals(combinedHtml, schemaData);

    // --- Resolve business name ---
    const resolvedName = businessName
      || schemaData.name
      || this.extractTitleBrand(html)
      || null;

    // --- NAP consistency score ---
    const napScore = this.calculateNAPScore(napData, schemaData, gmbData);

    // --- Contact page detection ---
    const hasContactPage = /href="[^"]*\/contact[^"]*"/i.test(html) || contactHtml.length > 200;

    return {
      business_name: resolvedName,
      address: napData.address || schemaData.address,
      phone: napData.phone || schemaData.phone,
      gmb_present: gmbData.present,
      gmb_url: gmbData.url,
      review_count: schemaData.review_count,
      average_rating: schemaData.average_rating,
      nap_consistency_score: napScore,
      local_rank: null, // Requires SERP API — not available without SERPAPI_KEY
      has_local_schema: schemaData.has_local_schema,
      has_maps_embed: gmbData.has_maps_embed,
      has_contact_page: hasContactPage,
      schema_phone: schemaData.phone,
      schema_address: schemaData.address,
    };
  }

  private extractSchemaData(html: string): {
    name: string | null;
    address: string | null;
    phone: string | null;
    review_count: number;
    average_rating: number | null;
    has_local_schema: boolean;
    latitude: number | null;
    longitude: number | null;
    same_as: string[];
  } {
    const result = {
      name: null as string | null,
      address: null as string | null,
      phone: null as string | null,
      review_count: 0,
      average_rating: null as number | null,
      has_local_schema: false,
      latitude: null as number | null,
      longitude: null as number | null,
      same_as: [] as string[],
    };

    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        const schemas: any[] = Array.isArray(parsed)
          ? parsed
          : parsed['@graph']
          ? parsed['@graph']
          : [parsed];

        for (const schema of schemas) {
          const type = (schema['@type'] || '').toLowerCase();
          const isLocal =
            type.includes('localbusiness') ||
            type.includes('restaurant') ||
            type.includes('store') ||
            type.includes('organization') ||
            type.includes('corporation') ||
            type.includes('professionalservice') ||
            type.includes('medicalorganization');

          if (isLocal) {
            result.has_local_schema = true;

            if (!result.name && schema.name) result.name = schema.name;

            // Address
            if (!result.address && schema.address) {
              const addr = schema.address;
              if (typeof addr === 'string') {
                result.address = addr;
              } else if (addr['@type'] === 'PostalAddress') {
                const parts = [
                  addr.streetAddress,
                  addr.addressLocality,
                  addr.addressRegion,
                  addr.postalCode,
                  addr.addressCountry,
                ].filter(Boolean);
                result.address = parts.join(', ');
              }
            }

            // Phone
            if (!result.phone && schema.telephone) {
              result.phone = schema.telephone;
            }

            // Geo
            if (!result.latitude && schema.geo) {
              result.latitude = schema.geo.latitude || null;
              result.longitude = schema.geo.longitude || null;
            }

            // SameAs
            if (Array.isArray(schema.sameAs)) {
              result.same_as = schema.sameAs;
            }
          }

          // Aggregate rating (can be on any schema type)
          if (schema.aggregateRating && !result.average_rating) {
            result.average_rating = parseFloat(schema.aggregateRating.ratingValue) || null;
            result.review_count = parseInt(schema.aggregateRating.reviewCount || schema.aggregateRating.ratingCount || '0') || 0;
          }
        }
      } catch {
        // Skip invalid JSON
      }
    }

    return result;
  }

  private extractNAP(html: string, schema: { address: string | null; phone: string | null }): {
    address: string | null;
    phone: string | null;
  } {
    // UK phone patterns (covers +44, 07xxx, 01xxx, 02xxx, 03xxx, 08xxx)
    const ukPhoneRegex = /(?:\+44\s?|0)(?:\d\s?){9,10}/g;
    // US/international
    const intlPhoneRegex = /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;

    let phone = schema.phone || null;
    if (!phone) {
      const ukMatch = ukPhoneRegex.exec(html);
      const intlMatch = intlPhoneRegex.exec(html);
      phone = (ukMatch?.[0] || intlMatch?.[0] || null)?.trim() || null;
    }

    // Address: look for postal code patterns as anchors
    let address = schema.address || null;
    if (!address) {
      // UK postcode
      const ukPostcodeMatch = html.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
      if (ukPostcodeMatch) {
        // Try to grab surrounding text (roughly 80 chars before the postcode as address)
        const idx = html.indexOf(ukPostcodeMatch[0]);
        const rawAround = html.slice(Math.max(0, idx - 100), idx + ukPostcodeMatch[0].length + 10);
        address = rawAround.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
      }
    }

    return { address, phone };
  }

  private detectGMBSignals(html: string, schema: { same_as: string[]; latitude: number | null }): {
    present: boolean;
    url: string | null;
    has_maps_embed: boolean;
  } {
    // Maps embed detection
    const hasMapsEmbed =
      /maps\.google\.com/i.test(html) ||
      /maps\.app\.goo\.gl/i.test(html) ||
      /google\.com\/maps/i.test(html) ||
      /src="[^"]*maps\.google/i.test(html);

    // GMB URL in sameAs or in page links
    const gmbPatterns = [
      /business\.google\.com\/[^"'\s<>]+/i,
      /g\.page\/[^"'\s<>]+/i,
      /maps\.app\.goo\.gl\/[^"'\s<>]+/i,
    ];

    let gmbUrl: string | null = null;

    // Check sameAs array
    for (const link of schema.same_as) {
      if (/business\.google\.com|g\.page/i.test(link)) {
        gmbUrl = link;
        break;
      }
    }

    // Check raw HTML
    if (!gmbUrl) {
      for (const pattern of gmbPatterns) {
        const m = html.match(pattern);
        if (m) {
          gmbUrl = `https://${m[0]}`;
          break;
        }
      }
    }

    // If we found a maps embed or GMB URL, mark as present
    // Also consider geo coordinates in schema as a strong GMB signal
    const present = hasMapsEmbed || !!gmbUrl || !!schema.latitude;

    return { present, url: gmbUrl, has_maps_embed: hasMapsEmbed };
  }

  private calculateNAPScore(
    nap: { address: string | null; phone: string | null },
    schema: { has_local_schema: boolean; address: string | null; phone: string | null; review_count: number },
    gmb: { present: boolean }
  ): number {
    let score = 0;

    // Name available: 20pts
    if (schema.has_local_schema) score += 20;

    // Address found (any method): 20pts
    if (nap.address || schema.address) score += 20;

    // Phone found: 20pts
    if (nap.phone || schema.phone) score += 20;

    // Schema-sourced (higher consistency): extra 15pts
    if (schema.address && schema.phone) score += 15;

    // GMB present: 15pts
    if (gmb.present) score += 15;

    // Reviews: 10pts
    if (schema.review_count > 0) score += 10;

    return Math.min(100, score);
  }

  private extractTitleBrand(html: string): string | null {
    const ogSite = html.match(/<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i)?.[1];
    if (ogSite) return ogSite.trim();
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
    if (title) return title.split(/[|–\-,]/)[0].trim();
    return null;
  }
}
