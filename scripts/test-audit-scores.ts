/**
 * Smoke-test live SEO audit scoring against multiple domains.
 * Usage: npx tsx scripts/test-audit-scores.ts
 */
import { SEOAuditEngine } from '../lib/seo/audit-engine';

const domains =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['example.com', 'wikipedia.org', 'httpbin.org', 'info.cern.ch'];

async function main() {
  const rows: Array<Record<string, unknown>> = [];

  for (const domain of domains) {
    process.stdout.write(`Auditing ${domain}...\n`);
    try {
      const engine = new SEOAuditEngine(domain);
      const result = await engine.runAudit();
      rows.push({
        domain,
        overall: result.overall_score,
        tech: result.technical_score,
        onpage: result.onpage_score,
        content: result.content_score,
        basic: result.categories?.basic_seo,
        advanced: result.categories?.advanced_seo,
        perf: result.categories?.performance,
        security: result.categories?.security,
        titleLen: result.onpage.title.length,
        h1: result.onpage.h1,
        altPct: result.onpage.images.alt_coverage_pct,
        words: result.content.word_count,
        rtMs: result.technical.response_time_ms,
        sizeKB: result.technical.page_size_bytes
          ? Math.round(result.technical.page_size_bytes / 1024)
          : null,
        reqs: result.technical.request_count,
        og: result.onpage.open_graph,
        schema: result.onpage.structured_data,
        issues: result.issues.length,
      });
    } catch (e) {
      rows.push({
        domain,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  console.log('\n=== AUDIT SCORE COMPARISON ===\n');
  console.table(rows);

  const scores = rows
    .map((r) => r.overall)
    .filter((s): s is number => typeof s === 'number');

  if (scores.length >= 2) {
    const unique = new Set(scores);
    const spread = Math.max(...scores) - Math.min(...scores);
    console.log(`Unique overall scores: ${unique.size}/${scores.length}`);
    console.log(`Score spread: ${spread} points`);
    if (unique.size === 1) {
      console.error('FAIL: All sites received the same overall score');
      process.exit(1);
    }
    if (spread < 5) {
      console.warn('WARN: Score spread is very small (<5).');
    } else {
      console.log('OK: Scores differ across sites.');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
