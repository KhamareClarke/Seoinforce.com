export type ChecklistItemStatus = 'completed' | 'needs_work' | 'not_done';

export type ChecklistItem = {
  id: string;
  label: string;
  status: ChecklistItemStatus;
  detail?: string;
  action?: string;
};

export type ContentChecklistResult = {
  completed: ChecklistItem[];
  needsWork: ChecklistItem[];
  notDone: ChecklistItem[];
  score: number;
  maxScore: number;
  priority: string;
};

export type ChecklistInput = {
  targetKeyword: string;
  wordCount: number;
  keywordDensityPercent: number;
  keywordInTitle: boolean;
  keywordInH1: boolean;
  keywordInFirst100Words: boolean;
  keywordVariationsCount: number;
  fleschReadingEase: number;
  internalLinks: number;
  externalLinks: number;
  imageCount: number;
  imagesWithAlt: number;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  listCount: number;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  hasViewport: boolean;
  hasSchema: boolean;
  pageLoadSeconds: number | null;
};

function item(
  id: string,
  label: string,
  pass: boolean,
  warn: boolean,
  detail: string,
  action?: string
): ChecklistItem {
  if (pass) {
    return { id, label, status: 'completed', detail };
  }
  if (warn) {
    return { id, label, status: 'needs_work', detail, action };
  }
  return { id, label, status: 'not_done', detail, action };
}

export function buildContentOptimizationChecklist(input: ChecklistInput): ContentChecklistResult {
  const items: ChecklistItem[] = [];

  items.push(
    item(
      'keyword_title',
      'Target keyword in title tag',
      input.keywordInTitle,
      false,
      input.keywordInTitle ? 'Present in title' : 'Missing from title tag',
      'Add keyword to <title>'
    )
  );

  items.push(
    item(
      'keyword_h1',
      'Target keyword in H1',
      input.keywordInH1,
      false,
      input.keywordInH1 ? 'Present in H1' : 'Missing from H1',
      'Include keyword in main H1'
    )
  );

  items.push(
    item(
      'keyword_first100',
      'Target keyword in first 100 words',
      input.keywordInFirst100Words,
      false,
      input.keywordInFirst100Words ? 'Found early in content' : 'Not in opening paragraph',
      'Use keyword in the first 100 words'
    )
  );

  const densityOk = input.keywordDensityPercent >= 1 && input.keywordDensityPercent <= 3;
  const densityLow = input.keywordDensityPercent > 0 && input.keywordDensityPercent < 1;
  items.push(
    item(
      'keyword_density',
      '1–3% keyword density',
      densityOk,
      densityLow || (input.keywordDensityPercent > 3 && input.keywordDensityPercent <= 4),
      `Current: ${input.keywordDensityPercent}%`,
      densityOk
        ? undefined
        : input.keywordDensityPercent < 1
          ? 'Add natural keyword mentions'
          : 'Reduce keyword stuffing'
    )
  );

  items.push(
    item(
      'keyword_variations',
      'Keyword variations used',
      input.keywordVariationsCount >= 1,
      false,
      input.keywordVariationsCount >= 1
        ? `${input.keywordVariationsCount} variation(s) found`
        : 'No variations detected',
      'Add synonyms and related phrases'
    )
  );

  items.push(
    item(
      'readability',
      'Readability 60+',
      input.fleschReadingEase >= 60,
      input.fleschReadingEase >= 50 && input.fleschReadingEase < 60,
      `Flesch score: ${input.fleschReadingEase}`,
      'Shorten sentences and simplify vocabulary'
    )
  );

  const wordsOk = input.wordCount >= 1000;
  const wordsClose = input.wordCount >= 800 && input.wordCount < 1000;
  items.push(
    item(
      'word_count',
      '1000+ words',
      wordsOk,
      wordsClose,
      `${input.wordCount} words`,
      wordsOk ? undefined : `Add ${Math.max(0, 1000 - input.wordCount)} words`
    )
  );

  items.push(
    item(
      'internal_links',
      'Internal links (minimum 5)',
      input.internalLinks >= 5,
      input.internalLinks >= 3 && input.internalLinks < 5,
      `${input.internalLinks} internal link(s)`,
      input.internalLinks >= 5 ? undefined : `Add ${5 - input.internalLinks} more internal links`
    )
  );

  items.push(
    item(
      'external_links',
      'External links (minimum 3)',
      input.externalLinks >= 3,
      input.externalLinks >= 1 && input.externalLinks < 3,
      `${input.externalLinks} external link(s)`,
      input.externalLinks >= 3 ? undefined : `Add ${3 - input.externalLinks} authoritative external links`
    )
  );

  const minImages = 5;
  const allAlt = input.imageCount > 0 && input.imagesWithAlt >= input.imageCount;
  const imagesOk = input.imageCount >= minImages && allAlt;
  const imagesPartial =
    input.imageCount >= 3 && (input.imageCount < minImages || !allAlt);
  items.push(
    item(
      'images_alt',
      'Images with alt text',
      imagesOk,
      imagesPartial,
      `${input.imagesWithAlt}/${input.imageCount} images with alt`,
      imagesOk
        ? undefined
        : input.imageCount < minImages
          ? `Add ${minImages - input.imageCount} images with descriptive alt text`
          : 'Add alt text to all images'
    )
  );

  const headersOk = input.h1Count === 1 && input.h2Count >= 1 && input.h3Count >= 1;
  const headersPartial = input.h1Count === 1 && input.h2Count >= 1;
  items.push(
    item(
      'headers',
      'Headers structure (H1, H2, H3)',
      headersOk,
      headersPartial,
      `H1: ${input.h1Count}, H2: ${input.h2Count}, H3: ${input.h3Count}`,
      headersOk ? undefined : 'Use one H1 and multiple H2/H3 sections'
    )
  );

  items.push(
    item(
      'lists',
      'Lists/bullets for readability',
      input.listCount >= 1,
      false,
      input.listCount >= 1 ? `${input.listCount} list(s)` : 'No lists found',
      'Add bullet or numbered lists'
    )
  );

  const speed = input.pageLoadSeconds;
  const speedOk = speed != null && speed <= 2;
  const speedWarn = speed != null && speed > 2 && speed <= 3;
  items.push(
    item(
      'page_speed',
      'Page speed 2s+ (LCP)',
      speedOk,
      speedWarn,
      speed != null ? `${speed}s load (LCP)` : 'PageSpeed API not configured',
      speedOk
        ? undefined
        : speed != null
          ? 'Optimize images, defer JS, enable caching'
          : 'Set GOOGLE_PAGESPEED_API_KEY for speed check'
    )
  );

  items.push(
    item(
      'mobile',
      'Mobile responsive',
      input.hasViewport,
      false,
      input.hasViewport ? 'Viewport meta present' : 'No viewport meta tag',
      'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
    )
  );

  const metaOk =
    input.hasMetaDescription &&
    input.metaDescriptionLength >= 120 &&
    input.metaDescriptionLength <= 160;
  const metaPartial = input.hasMetaDescription && !metaOk;
  items.push(
    item(
      'meta_description',
      'Meta description',
      metaOk,
      metaPartial,
      input.hasMetaDescription
        ? `${input.metaDescriptionLength} characters`
        : 'Missing meta description',
      metaOk
        ? undefined
        : input.hasMetaDescription
          ? 'Adjust to 120–160 characters'
          : 'Write a 120–160 character meta description'
    )
  );

  items.push(
    item(
      'schema',
      'Schema markup',
      input.hasSchema,
      false,
      input.hasSchema ? 'JSON-LD detected' : 'No structured data found',
      'Add Article or FAQ schema (JSON-LD)'
    )
  );

  const completed = items.filter((i) => i.status === 'completed');
  const needsWork = items.filter((i) => i.status === 'needs_work');
  const notDone = items.filter((i) => i.status === 'not_done');

  const score = completed.length;
  const maxScore = items.length;

  const priorityParts: string[] = [];
  for (const i of [...notDone, ...needsWork].slice(0, 4)) {
    if (i.action) priorityParts.push(i.action);
  }

  return {
    completed,
    needsWork,
    notDone,
    score,
    maxScore,
    priority:
      priorityParts.length > 0
        ? priorityParts.join('; ')
        : 'Content is well optimized — monitor rankings after publishing updates.',
  };
}
