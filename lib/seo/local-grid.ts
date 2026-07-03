export interface LocalGridCell {
  row: number;
  col: number;
  rank: number | null; // null = not ranking in top 20
  is_center: boolean;
}

export interface LocalGridResult {
  grid: LocalGridCell[];
  grid_size: number; // always 5 for 5x5
  center_rank: number | null;
  avg_rank: number | null;
  cells_ranking: number; // how many of the 25 cells have a rank
  coverage_score: number; // 0-100 — how widely the business ranks locally
  basis: 'gmb' | 'schema' | 'estimated';
  location_hint: string | null; // city/town from schema/NAP if found
}

// Generate a 5x5 local ranking grid estimated from local SEO signals.
// Inputs are the signals we already compute in local-seo.ts and audit-engine.ts.
export function generateLocalGrid(options: {
  nap_score: number;           // 0-100 from LocalSEOChecker
  gmb_present: boolean;
  has_local_schema: boolean;
  review_count: number;
  average_rating: number | null;
  address: string | null;
}): LocalGridResult {
  const { nap_score, gmb_present, has_local_schema, review_count, average_rating, address } = options;

  // Calculate a base centre rank (1–20, null = not ranking)
  // Strong signals → low rank number (better position)
  let centerRank: number | null;

  if (!gmb_present && !has_local_schema && nap_score < 30) {
    // No local signals at all — business is likely not ranking locally
    centerRank = null;
  } else {
    // Start from a base derived from NAP + GMB + reviews
    let base = 20; // worst case
    if (gmb_present) base -= 8;
    if (has_local_schema) base -= 4;
    if (nap_score > 60) base -= 3;
    if (review_count > 10) base -= 2;
    if ((average_rating ?? 0) >= 4.0) base -= 1;
    if (nap_score > 80) base -= 1;
    centerRank = Math.max(1, base);
  }

  // Build 5x5 grid — rank degrades as distance from centre increases
  const grid: LocalGridCell[] = [];
  const SIZE = 5;
  const CENTER = 2; // 0-indexed centre (row 2, col 2)

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const is_center = row === CENTER && col === CENTER;
      const dist = Math.max(Math.abs(row - CENTER), Math.abs(col - CENTER));

      let rank: number | null;
      if (centerRank === null) {
        // No local presence — only first ring might show on a good day
        rank = dist === 0 ? null : null;
      } else {
        // Rank degrades by distance; strong signal = smaller degradation
        const degradation = gmb_present ? 3 : 5;
        const estimated = centerRank + dist * degradation;
        rank = estimated <= 20 ? estimated : null;
      }

      grid.push({ row, col, rank, is_center });
    }
  }

  const ranking_cells = grid.filter(c => c.rank !== null);
  const cells_ranking = ranking_cells.length;
  const avg_rank = cells_ranking > 0
    ? Math.round(ranking_cells.reduce((s, c) => s + (c.rank ?? 0), 0) / cells_ranking)
    : null;

  const coverage_score = Math.round((cells_ranking / (SIZE * SIZE)) * 100);

  const basis: LocalGridResult['basis'] = gmb_present ? 'gmb' : has_local_schema ? 'schema' : 'estimated';

  // Extract city from address for display
  let location_hint: string | null = null;
  if (address) {
    // Try to get last meaningful part of address (usually city)
    const parts = address.split(/[,\n]/).map(p => p.trim()).filter(Boolean);
    const city = parts.find(p => /^[A-Z][a-zA-Z\s]+$/.test(p) && p.length > 2 && p.length < 30);
    location_hint = city ?? parts[parts.length - 1] ?? null;
  }

  return {
    grid,
    grid_size: SIZE,
    center_rank: centerRank,
    avg_rank,
    cells_ranking,
    coverage_score,
    basis,
    location_hint,
  };
}
