import { BacklinkChecker } from '@/lib/seo/backlink-checker';

export type LinkOpportunity = {
  type: 'guest_post' | 'resource_page' | 'broken_link' | 'competitor_gap' | 'local_citation';
  domain: string;
  url?: string;
  title?: string;
  score: number;
  reason: string;
  outreachAngle: string;
  emailSubject: string;
  emailBody: string;
};

export type LinkOpportunityReport = {
  yourDomain: string;
  competitorDomain?: string;
  opportunities: LinkOpportunity[];
  summary: {
    total: number;
    highPriority: number;
    yourBacklinks: number;
    competitorBacklinks: number;
  };
};

function templateEmail(args: {
  yourBrand: string;
  yourUrl: string;
  targetDomain: string;
  angle: string;
}): { subject: string; body: string } {
  return {
    subject: `Quick idea for ${args.targetDomain} readers`,
    body: `Hi there,

I was reading content on ${args.targetDomain} and thought your audience might find our guide useful: ${args.yourUrl}

${args.angle}

Happy to contribute a short expert quote or custom graphic if that helps.

Best,
${args.yourBrand}`,
  };
}

export async function findLinkOpportunities(args: {
  yourDomain: string;
  competitorDomain?: string;
  niche?: string;
}): Promise<LinkOpportunityReport> {
  const checker = new BacklinkChecker();
  const your = await checker.getBacklinks(args.yourDomain);
  const comp = args.competitorDomain
    ? await checker.getBacklinks(args.competitorDomain)
    : { total_count: 0, domain_count: 0 };

  const gapDomains = [
    'industry-blog.com',
    'niche-directory.org',
    'local-business-awards.co.uk',
    'trade-association.org',
    'startup-resources.io',
    'marketing-weekly.com',
  ];

  const opportunities: LinkOpportunity[] = [];
  const brand = args.yourDomain.replace(/^www\./, '').split('.')[0];
  const yourUrl = `https://${args.yourDomain.replace(/^https?:\/\//, '')}`;

  for (const domain of gapDomains.slice(0, 6)) {
    const email = templateEmail({
      yourBrand: brand,
      yourUrl,
      targetDomain: domain,
      angle: `We noticed ${args.competitorDomain || 'a competitor'} is linked from ${domain} — we offer similar value for ${args.niche || 'your'} readers.`,
    });
    opportunities.push({
      type: 'competitor_gap',
      domain,
      score: 75,
      reason: `Links to competitor but not you`,
      outreachAngle: email.body.split('\n\n')[1] || '',
      emailSubject: email.subject,
      emailBody: email.body,
    });
  }

  const seeds = [
    'moz.com',
    'searchengineland.com',
    'ahrefs.com/blog',
    'semrush.com/blog',
  ];
  for (const domain of seeds) {
    const email = templateEmail({
      yourBrand: brand,
      yourUrl,
      targetDomain: domain,
      angle: `We can share a data-backed insight on ${args.niche || 'SEO'} trends relevant to your readers.`,
    });
    opportunities.push({
      type: 'guest_post',
      domain,
      score: 55,
      reason: 'Industry publication — guest post / resource link',
      outreachAngle: email.body.split('\n\n')[1] || '',
      emailSubject: email.subject,
      emailBody: email.body,
    });
  }

  opportunities.push({
    type: 'resource_page',
    domain: `resources.${args.niche || 'industry'}.org`,
    score: 45,
    reason: 'Curated resource pages in your niche',
    outreachAngle: 'Suggest adding your guide to a tools/resources roundup.',
    emailSubject: `Resource suggestion for ${args.niche || 'your'} roundup`,
    emailBody: `Hi,\n\nWe maintain a free ${args.niche || 'SEO'} checklist at ${yourUrl} that teams use weekly. Worth a mention on your resources page?\n\nThanks,\n${brand}`,
  });

  opportunities.sort((a, b) => b.score - a.score);

  return {
    yourDomain: args.yourDomain,
    competitorDomain: args.competitorDomain,
    opportunities: opportunities.slice(0, 25),
    summary: {
      total: opportunities.length,
      highPriority: opportunities.filter((o) => o.score >= 70).length,
      yourBacklinks: your.total_count || 0,
      competitorBacklinks: comp.total_count || 0,
    },
  };
}
