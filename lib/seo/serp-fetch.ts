import axios from 'axios';

export type SerpOrganicResult = {
  position: number;
  link?: string;
  title?: string;
};

export type SerpFetchResult = {
  keyword: string;
  device: 'desktop' | 'mobile';
  organic: SerpOrganicResult[];
  featuredSnippet: boolean;
  knowledgePanel: boolean;
  peopleAlsoAsk: boolean;
  localPack: boolean;
  imagePack: boolean;
  videoPack: boolean;
  newsPack: boolean;
  domainRank: number | null;
  rawAvailable: boolean;
};

function cleanDomain(d: string) {
  return d.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
}

export async function fetchSerpForKeyword(args: {
  keyword: string;
  domain: string;
  device?: 'desktop' | 'mobile';
  location?: string;
}): Promise<SerpFetchResult> {
  const device = args.device ?? 'desktop';
  const domainClean = cleanDomain(args.domain);
  const empty: SerpFetchResult = {
    keyword: args.keyword,
    device,
    organic: [],
    featuredSnippet: false,
    knowledgePanel: false,
    peopleAlsoAsk: false,
    localPack: false,
    imagePack: false,
    videoPack: false,
    newsPack: false,
    domainRank: null,
    rawAvailable: false,
  };

  const serpKey = process.env.SERPAPI_KEY?.trim();
  if (!serpKey) return empty;

  try {
    const res = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: serpKey,
        q: args.keyword,
        location: args.location ?? 'United Kingdom',
        device: device === 'mobile' ? 'mobile' : 'desktop',
        num: 20,
      },
      timeout: 28000,
    });

    const data = res.data as Record<string, unknown>;
    const organic = ((data.organic_results as Array<Record<string, unknown>>) || []).map((r, i) => ({
      position: (r.position as number) ?? i + 1,
      link: r.link as string | undefined,
      title: r.title as string | undefined,
    }));

    let domainRank: number | null = null;
    for (const r of organic) {
      const link = (r.link || '').toLowerCase();
      if (link.includes(domainClean)) {
        domainRank = r.position;
        break;
      }
    }

    return {
      keyword: args.keyword,
      device,
      organic,
      featuredSnippet: Boolean(data.featured_snippet),
      knowledgePanel: Boolean(data.knowledge_graph),
      peopleAlsoAsk: Boolean((data.related_questions as unknown[])?.length),
      localPack: Boolean(data.local_results),
      imagePack: Boolean((data.inline_images as unknown[])?.length),
      videoPack: Boolean((data.video_results as unknown[])?.length),
      newsPack: Boolean((data.news_results as unknown[])?.length),
      domainRank,
      rawAvailable: true,
    };
  } catch {
    return empty;
  }
}
