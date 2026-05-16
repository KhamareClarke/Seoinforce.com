import axios from 'axios';

/** Returns LCP (seconds) from PageSpeed Insights when API key is set. */
export async function fetchPageLoadSeconds(url: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: {
        url,
        key: apiKey,
        strategy: 'mobile',
        category: 'performance',
      },
      timeout: 35000,
    });

    const audits = res.data?.lighthouseResult?.audits;
    const lcp = audits?.['largest-contentful-paint']?.numericValue;
    if (typeof lcp === 'number') return Math.round((lcp / 1000) * 10) / 10;

    const fcp = audits?.['first-contentful-paint']?.numericValue;
    if (typeof fcp === 'number') return Math.round((fcp / 1000) * 10) / 10;

    return null;
  } catch {
    return null;
  }
}
