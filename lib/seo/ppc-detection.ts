export interface PPCSignals {
  google_ads: boolean;
  facebook_pixel: boolean;
  microsoft_ads: boolean;
  linkedin_ads: boolean;
  tiktok_pixel: boolean;
  total_platforms: number;
  spend_estimate: string;
  activity_level: 'none' | 'light' | 'active' | 'heavy';
  platforms_found: string[];
}

export function detectPPCSignals(html: string): PPCSignals {
  // Many sites load pixels via GTM — if GTM is present, treat as indirect PPC signal
  const hasGTM = /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]{4,}/i.test(html);

  const google_ads =
    /gtag\(\s*['"]config['"]\s*,\s*['"]AW-|googleads\.g\.doubleclick\.net|pagead2\.googlesyndication|\/pagead\/js\/adsbygoogle|google_conversion_id|gads\.js|conversion\.js.*google/i.test(html) || hasGTM;

  const facebook_pixel =
    /fbq\(\s*['"]init['"]|connect\.facebook\.net[^"']*fbevents\.js|_fbp=|facebook\.com\/tr\?|fbq\.queue/i.test(html);

  const microsoft_ads =
    /uetq\.push|bat\.bing\.com/i.test(html);

  const linkedin_ads =
    /linkedin\.com\/px\/|_linkedin_data_partner_id|lnkd\.in\/insight/i.test(html);

  const tiktok_pixel =
    /analytics\.tiktok\.com|ttq\.load\(|tiktok\.com\/i18n\/pixel/i.test(html);

  const platforms_found: string[] = [];
  if (google_ads) platforms_found.push('Google Ads');
  if (facebook_pixel) platforms_found.push('Meta / Facebook');
  if (microsoft_ads) platforms_found.push('Microsoft Ads');
  if (linkedin_ads) platforms_found.push('LinkedIn Ads');
  if (tiktok_pixel) platforms_found.push('TikTok Ads');

  const total_platforms = platforms_found.length;

  let activity_level: PPCSignals['activity_level'];
  let spend_estimate: string;

  if (total_platforms === 0) {
    activity_level = 'none';
    spend_estimate = '£0 — no PPC activity detected';
  } else if (total_platforms === 1) {
    activity_level = 'light';
    spend_estimate = '£500–£3,000/mo (estimated)';
  } else if (total_platforms === 2) {
    activity_level = 'active';
    spend_estimate = '£3,000–£12,000/mo (estimated)';
  } else {
    activity_level = 'heavy';
    spend_estimate = '£12,000+/mo (estimated)';
  }

  return {
    google_ads,
    facebook_pixel,
    microsoft_ads,
    linkedin_ads,
    tiktok_pixel,
    total_platforms,
    spend_estimate,
    activity_level,
    platforms_found,
  };
}
