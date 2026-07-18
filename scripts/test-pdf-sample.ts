import { SEOAuditEngine } from '../lib/seo/audit-engine';
import { PDFReportGenerator } from '../lib/reports/pdf-generator';
import fs from 'fs';
import path from 'path';

async function main() {
  const engine = new SEOAuditEngine('example.com');
  const result = await engine.runAudit();
  const pdf = await new PDFReportGenerator().generateReport({
    domain: 'example.com',
    overall_score: result.overall_score,
    technical_score: result.technical_score,
    onpage_score: result.onpage_score,
    content_score: result.content_score,
    categories: result.categories,
    technical: result.technical,
    onpage: result.onpage,
    content: result.content,
    issues: result.issues,
  });
  const out = path.join(process.cwd(), 'tmp-audit-sample.pdf');
  fs.writeFileSync(out, pdf);
  console.log('PDF bytes', pdf.length);
  console.log('overall', result.overall_score);
  console.log('categories', JSON.stringify(result.categories));
  console.log('wrote', out);
}
main().catch((e) => { console.error(e); process.exit(1); });
