import PDFDocument from 'pdfkit';

export interface ReportData {
  domain: string;
  overall_score: number;
  technical_score: number;
  onpage_score: number;
  content_score: number;
  categories?: {
    basic_seo: number;
    advanced_seo: number;
    performance: number;
    security: number;
  };
  technical: any;
  onpage: any;
  content: any;
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning' | 'info' | 'good';
    title: string;
    description: string;
    fix_suggestion: string;
  }>;
  whiteLabel?: {
    logo?: string;
    companyName?: string;
    clientName?: string;
    agencyName?: string;
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

const COLORS = {
  ink: '#0f172a',
  muted: '#64748b',
  light: '#f1f5f9',
  white: '#ffffff',
  border: '#e2e8f0',
  pass: '#16a34a',
  passBg: '#dcfce7',
  warn: '#d97706',
  warnBg: '#fef3c7',
  critical: '#dc2626',
  criticalBg: '#fee2e2',
  info: '#2563eb',
  infoBg: '#dbeafe',
  accent: '#0f766e',
  accentDark: '#134e4a',
  gold: '#b45309',
};

function scoreTone(score: number) {
  if (score >= 80) return { fg: COLORS.pass, bg: COLORS.passBg, label: 'Strong' };
  if (score >= 60) return { fg: COLORS.warn, bg: COLORS.warnBg, label: 'Needs work' };
  return { fg: COLORS.critical, bg: COLORS.criticalBg, label: 'Critical' };
}

function severityTone(severity: string) {
  if (severity === 'critical') return { fg: COLORS.critical, bg: COLORS.criticalBg, label: 'CRITICAL' };
  if (severity === 'warning') return { fg: COLORS.warn, bg: COLORS.warnBg, label: 'WARNING' };
  if (severity === 'good') return { fg: COLORS.pass, bg: COLORS.passBg, label: 'PASSED' };
  return { fg: COLORS.info, bg: COLORS.infoBg, label: 'INFO' };
}

export class PDFReportGenerator {
  async generateReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 48, bottom: 56, left: 48, right: 48 },
          info: {
            Title: `SEO Audit Report — ${data.domain}`,
            Author: data.whiteLabel?.companyName || 'SEOInForce',
            Subject: 'Website SEO Analysis',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.addCoverPage(doc, data);
        doc.addPage();
        this.addCategoryBreakdown(doc, data);
        doc.addPage();
        this.addIssuesPage(doc, data);
        doc.addPage();
        this.addChecklistPage(doc, data);
        doc.addPage();
        this.addRecommendationsPage(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private brandName(data: ReportData) {
    return data.whiteLabel?.companyName || 'SEOInForce';
  }

  private primary(data: ReportData) {
    return data.whiteLabel?.colors?.primary || COLORS.accent;
  }

  private ensureSpace(doc: any, needed = 80) {
    if (doc.y > doc.page.height - 56 - needed) {
      doc.addPage();
      this.drawPageChrome(doc, this._lastData!);
    }
  }

  private _lastData: ReportData | null = null;

  private drawPageChrome(doc: any, data: ReportData) {
    this._lastData = data;
    const primary = this.primary(data);
    // Top accent bar
    doc.save();
    doc.rect(0, 0, doc.page.width, 6).fill(primary);
    doc.restore();

    // Footer
    const footerY = doc.page.height - 36;
    doc.save();
    doc
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(this.brandName(data), 48, footerY, { continued: false, width: 200 });
    doc
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(data.domain, 48, footerY, { align: 'center', width: doc.page.width - 96 });
    doc
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`Page ${doc.bufferedPageRange().start + doc.bufferedPageRange().count}`, 48, footerY, {
        align: 'right',
        width: doc.page.width - 96,
      });
    doc.restore();
  }

  private addCoverPage(doc: any, data: ReportData) {
    this._lastData = data;
    const primary = this.primary(data);
    const tone = scoreTone(data.overall_score);
    const pageW = doc.page.width;
    const pageH = doc.page.height;

    // Full-bleed header band
    doc.save();
    doc.rect(0, 0, pageW, 220).fill(COLORS.accentDark);
    doc.rect(0, 214, pageW, 6).fill(primary);
    doc.restore();

    doc
      .fillColor(COLORS.white)
      .fontSize(11)
      .text('SEO AUDIT REPORT', 48, 40, { characterSpacing: 2 });

    doc
      .fontSize(26)
      .fillColor(COLORS.white)
      .text(this.brandName(data), 48, 62, { width: pageW - 96 });

    if (data.whiteLabel?.clientName || data.whiteLabel?.agencyName) {
      doc
        .fontSize(10)
        .fillColor('#99f6e4')
        .text(
          [
            data.whiteLabel.clientName ? `Prepared for ${data.whiteLabel.clientName}` : null,
            data.whiteLabel.agencyName ? `by ${data.whiteLabel.agencyName}` : null,
          ]
            .filter(Boolean)
            .join(' '),
          48,
          98,
          { width: pageW - 96 }
        );
    }

    doc
      .fontSize(18)
      .fillColor(COLORS.white)
      .text(data.domain, 48, 130, { width: pageW - 96 });

    doc
      .fontSize(10)
      .fillColor('#99f6e4')
      .text(`Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, 48, 160);

    // Score card
    const cardX = 48;
    const cardY = 250;
    const cardW = pageW - 96;
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, 160, 12).fill(COLORS.white);
    doc.roundedRect(cardX, cardY, cardW, 160, 12).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.restore();

    // Score circle (approx with filled rounded box)
    doc.save();
    doc.circle(cardX + 90, cardY + 80, 52).fill(tone.bg);
    doc.circle(cardX + 90, cardY + 80, 52).strokeColor(tone.fg).lineWidth(3).stroke();
    doc.restore();

    doc
      .fontSize(36)
      .fillColor(tone.fg)
      .text(String(data.overall_score), cardX + 58, cardY + 58, { width: 64, align: 'center' });
    doc
      .fontSize(9)
      .fillColor(tone.fg)
      .text('/ 100', cardX + 58, cardY + 98, { width: 64, align: 'center' });

    doc
      .fontSize(16)
      .fillColor(COLORS.ink)
      .text('Overall SEO Score', cardX + 170, cardY + 40);
    doc
      .fontSize(11)
      .fillColor(COLORS.muted)
      .text(
        `Status: ${tone.label}. This score reflects live checks against the homepage HTML, metadata, structure, performance signals, and security.`,
        cardX + 170,
        cardY + 68,
        { width: cardW - 200 }
      );

    // Mini category pills
    const cats = this.resolveCategories(data);
    const pillY = cardY + 120;
    let pillX = cardX + 170;
    cats.slice(0, 4).forEach((cat) => {
      const t = scoreTone(cat.score);
      doc.save();
      doc.roundedRect(pillX, pillY, 72, 22, 6).fill(t.bg);
      doc.restore();
      doc
        .fontSize(8)
        .fillColor(t.fg)
        .text(`${cat.short} ${cat.score}`, pillX, pillY + 6, { width: 72, align: 'center' });
      pillX += 80;
    });

    // Issue summary strip
    const critical = data.issues.filter((i) => i.severity === 'critical').length;
    const warnings = data.issues.filter((i) => i.severity === 'warning').length;
    const info = data.issues.filter((i) => i.severity === 'info' || !i.severity).length;
    const stripY = 440;

    doc.fontSize(13).fillColor(COLORS.ink).text('Findings at a glance', 48, stripY);
    const boxes = [
      { label: 'Critical', count: critical, fg: COLORS.critical, bg: COLORS.criticalBg },
      { label: 'Warnings', count: warnings, fg: COLORS.warn, bg: COLORS.warnBg },
      { label: 'Opportunities', count: info, fg: COLORS.info, bg: COLORS.infoBg },
      { label: 'Total checks', count: data.issues.length, fg: COLORS.accent, bg: '#ccfbf1' },
    ];
    boxes.forEach((b, i) => {
      const x = 48 + i * 128;
      const y = stripY + 28;
      doc.save();
      doc.roundedRect(x, y, 116, 72, 10).fill(b.bg);
      doc.restore();
      doc.fontSize(22).fillColor(b.fg).text(String(b.count), x, y + 14, { width: 116, align: 'center' });
      doc.fontSize(9).fillColor(COLORS.ink).text(b.label, x, y + 46, { width: 116, align: 'center' });
    });

    doc
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(
        'This report analyzes the live homepage response: title & meta length, headings, image alt coverage, canonical, robots.txt, sitemap, schema, Open Graph, page weight, resource count, and response time.',
        48,
        570,
        { width: pageW - 96, align: 'left' }
      );
  }

  private resolveCategories(data: ReportData) {
    if (data.categories) {
      return [
        { name: 'Basic SEO', short: 'Basic', score: data.categories.basic_seo },
        { name: 'Advanced SEO', short: 'Advanced', score: data.categories.advanced_seo },
        { name: 'Performance', short: 'Perf', score: data.categories.performance },
        { name: 'Security', short: 'Security', score: data.categories.security },
      ];
    }
    return [
      { name: 'Basic SEO', short: 'Basic', score: data.onpage_score },
      { name: 'Advanced SEO', short: 'Advanced', score: Math.round((data.onpage_score + data.technical_score) / 2) },
      { name: 'Performance', short: 'Perf', score: data.technical_score },
      { name: 'Security', short: 'Security', score: data.technical?.https ? 85 : 40 },
    ];
  }

  private addCategoryBreakdown(doc: any, data: ReportData) {
    this.drawPageChrome(doc, data);
    doc.y = 36;

    doc.fontSize(20).fillColor(COLORS.ink).text('Score Breakdown by Category', 48, 36);
    doc
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('Each category is scored from live page data. Lower scores highlight where to focus first.', 48, 64, {
        width: doc.page.width - 96,
      });

    const cats = this.resolveCategories(data);
    let y = 100;
    cats.forEach((cat) => {
      const tone = scoreTone(cat.score);
      doc.save();
      doc.roundedRect(48, y, doc.page.width - 96, 78, 10).fill(COLORS.light);
      doc.restore();

      doc.fontSize(14).fillColor(COLORS.ink).text(cat.name, 64, y + 16);
      doc.fontSize(20).fillColor(tone.fg).text(`${cat.score}`, doc.page.width - 120, y + 14, {
        width: 50,
        align: 'right',
      });
      doc.fontSize(9).fillColor(tone.fg).text(tone.label, doc.page.width - 120, y + 40, {
        width: 50,
        align: 'right',
      });

      // Progress bar
      const barX = 64;
      const barY = y + 48;
      const barW = doc.page.width - 220;
      doc.save();
      doc.roundedRect(barX, barY, barW, 10, 5).fill(COLORS.border);
      doc.roundedRect(barX, barY, Math.max(4, (cat.score / 100) * barW), 10, 5).fill(tone.fg);
      doc.restore();

      y += 92;
    });

    // Secondary scores
    y += 10;
    doc.fontSize(13).fillColor(COLORS.ink).text('Legacy category scores', 48, y);
    y += 24;
    const legacy = [
      { name: 'Technical', score: data.technical_score },
      { name: 'On-Page', score: data.onpage_score },
      { name: 'Content', score: data.content_score },
    ];
    legacy.forEach((item, i) => {
      const x = 48 + i * 165;
      const t = scoreTone(item.score);
      doc.save();
      doc.roundedRect(x, y, 150, 56, 8).strokeColor(COLORS.border).lineWidth(1).stroke();
      doc.restore();
      doc.fontSize(10).fillColor(COLORS.muted).text(item.name, x + 12, y + 12);
      doc.fontSize(18).fillColor(t.fg).text(`${item.score}/100`, x + 12, y + 28);
    });
  }

  private addIssuesPage(doc: any, data: ReportData) {
    this.drawPageChrome(doc, data);
    doc.y = 36;

    doc.fontSize(20).fillColor(COLORS.ink).text('Issues & Opportunities', 48, 36);
    doc
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('Color-coded by severity. Critical items should be fixed first.', 48, 64, {
        width: doc.page.width - 96,
      });

    if (!data.issues?.length) {
      doc.fontSize(12).fillColor(COLORS.pass).text('No issues found. Strong foundation.', 48, 100);
      return;
    }

    const order = ['critical', 'warning', 'info', 'good'] as const;
    let y = 96;

    for (const sev of order) {
      const items = data.issues.filter((i) => (i.severity || 'info') === sev);
      if (!items.length) continue;

      const tone = severityTone(sev);
      if (y > doc.page.height - 120) {
        doc.addPage();
        this.drawPageChrome(doc, data);
        y = 40;
      }

      doc.save();
      doc.roundedRect(48, y, 110, 22, 6).fill(tone.bg);
      doc.restore();
      doc.fontSize(9).fillColor(tone.fg).text(tone.label, 48, y + 6, { width: 110, align: 'center' });
      doc
        .fontSize(11)
        .fillColor(COLORS.ink)
        .text(`${items.length} item${items.length === 1 ? '' : 's'}`, 170, y + 5);
      y += 36;

      for (const issue of items.slice(0, 12)) {
        if (y > doc.page.height - 110) {
          doc.addPage();
          this.drawPageChrome(doc, data);
          y = 40;
        }

        doc.save();
        doc.roundedRect(48, y, doc.page.width - 96, 78, 8).fill(COLORS.white);
        doc.roundedRect(48, y, 5, 78, 2).fill(tone.fg);
        doc.roundedRect(48, y, doc.page.width - 96, 78, 8).strokeColor(COLORS.border).lineWidth(0.8).stroke();
        doc.restore();

        doc.fontSize(11).fillColor(COLORS.ink).text(issue.title || 'Issue', 64, y + 10, {
          width: doc.page.width - 130,
        });
        doc.fontSize(9).fillColor(COLORS.muted).text(issue.description || '', 64, y + 28, {
          width: doc.page.width - 130,
          height: 22,
          ellipsis: true,
        });
        if (issue.fix_suggestion) {
          doc
            .fontSize(9)
            .fillColor(COLORS.accent)
            .text(`Fix: ${issue.fix_suggestion}`, 64, y + 52, {
              width: doc.page.width - 130,
              height: 20,
              ellipsis: true,
            });
        }
        y += 88;
      }
      y += 8;
    }
  }

  private addChecklistPage(doc: any, data: ReportData) {
    this.drawPageChrome(doc, data);
    doc.y = 36;

    doc.fontSize(20).fillColor(COLORS.ink).text('Live Site Checklist', 48, 36);
    doc
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text('Pass / fail based on data fetched from the live URL.', 48, 64);

    const t = data.technical || {};
    const o = data.onpage || {};
    const c = data.content || {};

    const fmtBytes = (n?: number | null) =>
      n == null ? '—' : n > 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;

    const rows: Array<{ section: string; label: string; value: string; pass: boolean }> = [
      { section: 'Basic SEO', label: 'Title tag present', value: o.title?.length ? `${o.title.length} chars` : 'Missing', pass: (o.title?.length || 0) > 0 },
      { section: 'Basic SEO', label: 'Title length 30–60', value: `${o.title?.length || 0} chars`, pass: !!o.title?.optimal },
      { section: 'Basic SEO', label: 'Meta description', value: o.description?.missing ? 'Missing' : `${o.description?.length || 0} chars`, pass: !o.description?.missing },
      { section: 'Basic SEO', label: 'Meta length 120–160', value: `${o.description?.length || 0} chars`, pass: !o.description?.missing && !o.description?.tooLong && !o.description?.tooShort },
      { section: 'Basic SEO', label: 'Single H1', value: `${o.h1 ?? 0} found`, pass: o.h1 === 1 },
      { section: 'Basic SEO', label: 'H2 headings', value: `${o.h2 ?? 0} found`, pass: (o.h2 || 0) > 0 },
      { section: 'Basic SEO', label: 'Image alt coverage', value: `${o.images?.alt_coverage_pct ?? 0}% (${o.images?.valid ?? 0}/${o.images?.total ?? 0})`, pass: (o.images?.alt_coverage_pct ?? 100) >= 90 },
      { section: 'Advanced SEO', label: 'Canonical tag', value: o.canonical ? 'Present' : 'Missing', pass: !!o.canonical },
      { section: 'Advanced SEO', label: 'Open Graph tags', value: o.open_graph ? 'Complete' : 'Incomplete', pass: !!o.open_graph },
      { section: 'Advanced SEO', label: 'Twitter Card', value: o.twitter_card ? 'Present' : 'Missing', pass: !!o.twitter_card },
      { section: 'Advanced SEO', label: 'Schema (JSON-LD)', value: o.structured_data ? 'Present' : 'Missing', pass: !!o.structured_data },
      { section: 'Advanced SEO', label: 'robots.txt', value: t.robots ? 'Found' : 'Missing', pass: !!t.robots },
      { section: 'Advanced SEO', label: 'sitemap.xml', value: t.sitemap ? 'Found' : 'Missing', pass: !!t.sitemap },
      { section: 'Performance', label: 'Response time', value: t.response_time_ms != null ? `${t.response_time_ms} ms` : '—', pass: t.response_time_ms != null && t.response_time_ms < 600 },
      { section: 'Performance', label: 'Page size (HTML)', value: fmtBytes(t.page_size_bytes), pass: t.page_size_bytes != null && t.page_size_bytes < 1_500_000 },
      { section: 'Performance', label: 'Resource count', value: t.request_count != null ? String(t.request_count) : '—', pass: t.request_count != null && t.request_count <= 70 },
      { section: 'Performance', label: 'Word count', value: `${c.word_count ?? 0} words`, pass: (c.word_count || 0) >= 300 },
      { section: 'Security', label: 'HTTPS', value: t.https ? 'Enabled' : 'Not enabled', pass: !!t.https },
      { section: 'Security', label: 'Mixed content', value: `${t.mixed_content_count ?? 0} HTTP assets`, pass: (t.mixed_content_count ?? 0) === 0 },
      { section: 'Security', label: 'Mobile viewport', value: t.mobile ? 'Present' : 'Missing', pass: !!t.mobile },
    ];

    let y = 96;
    let lastSection = '';
    for (const row of rows) {
      if (y > doc.page.height - 80) {
        doc.addPage();
        this.drawPageChrome(doc, data);
        y = 40;
        lastSection = '';
      }
      if (row.section !== lastSection) {
        lastSection = row.section;
        doc.fontSize(12).fillColor(COLORS.accentDark).text(row.section, 48, y);
        y += 22;
      }

      const passTone = row.pass
        ? { fg: COLORS.pass, bg: COLORS.passBg, label: 'PASS' }
        : { fg: COLORS.critical, bg: COLORS.criticalBg, label: 'FAIL' };

      doc.save();
      doc.roundedRect(48, y, doc.page.width - 96, 28, 6).fill(COLORS.light);
      doc.restore();

      doc.save();
      doc.roundedRect(56, y + 6, 42, 16, 4).fill(passTone.bg);
      doc.restore();
      doc.fontSize(7).fillColor(passTone.fg).text(passTone.label, 56, y + 9, { width: 42, align: 'center' });

      doc.fontSize(10).fillColor(COLORS.ink).text(row.label, 108, y + 8, { width: 220 });
      doc.fontSize(9).fillColor(COLORS.muted).text(row.value, 340, y + 8, {
        width: doc.page.width - 400,
        align: 'right',
      });
      y += 34;
    }
  }

  private addRecommendationsPage(doc: any, data: ReportData) {
    this.drawPageChrome(doc, data);
    doc.y = 36;

    doc.fontSize(20).fillColor(COLORS.ink).text('Recommendations & Next Steps', 48, 36);

    const criticalCount = data.issues.filter((i) => i.severity === 'critical').length;
    const warningCount = data.issues.filter((i) => i.severity === 'warning').length;
    const tone = scoreTone(data.overall_score);

    doc
      .fontSize(11)
      .fillColor(COLORS.muted)
      .text(
        `Current overall score: ${data.overall_score}/100 (${tone.label}). Prioritize critical findings, then warnings, then opportunities.`,
        48,
        68,
        { width: doc.page.width - 96 }
      );

    const steps = [
      {
        title: '1. Resolve critical issues',
        body: `Address ${criticalCount} critical finding${criticalCount === 1 ? '' : 's'} that block search visibility or trust (HTTPS, missing title/meta/H1).`,
      },
      {
        title: '2. Clear warnings',
        body: `Fix ${warningCount} warning${warningCount === 1 ? '' : 's'} such as alt text gaps, slow response, or weak heading structure.`,
      },
      {
        title: '3. Strengthen advanced SEO',
        body: 'Complete Open Graph, Twitter Card, and JSON-LD schema so pages share well and become eligible for rich results.',
      },
      {
        title: '4. Re-audit after changes',
        body: 'Re-run this report after shipping fixes to confirm scores move and regressions are caught early.',
      },
    ];

    let y = 110;
    steps.forEach((step) => {
      doc.save();
      doc.roundedRect(48, y, doc.page.width - 96, 72, 10).fill(COLORS.light);
      doc.restore();
      doc.fontSize(12).fillColor(COLORS.ink).text(step.title, 64, y + 14);
      doc.fontSize(10).fillColor(COLORS.muted).text(step.body, 64, y + 36, {
        width: doc.page.width - 128,
      });
      y += 84;
    });

    y += 12;
    doc.save();
    doc.roundedRect(48, y, doc.page.width - 96, 100, 12).fill(COLORS.accentDark);
    doc.restore();

    if (!data.whiteLabel?.companyName || data.whiteLabel.companyName === 'SEOInForce') {
      doc
        .fontSize(14)
        .fillColor(COLORS.white)
        .text('Need help implementing these fixes?', 64, y + 24, {
          width: doc.page.width - 128,
        });
      doc
        .fontSize(11)
        .fillColor('#99f6e4')
        .text(
          'SEOInForce can turn this audit into a prioritized action plan — technical fixes, content upgrades, and ongoing ranking work.',
          64,
          y + 50,
          { width: doc.page.width - 128 }
        );
    } else {
      doc
        .fontSize(14)
        .fillColor(COLORS.white)
        .text(`Prepared by ${data.whiteLabel.companyName}`, 64, y + 30, {
          width: doc.page.width - 128,
        });
      doc
        .fontSize(11)
        .fillColor('#99f6e4')
        .text('Contact your agency to prioritize and implement the recommendations in this report.', 64, y + 56, {
          width: doc.page.width - 128,
        });
    }
  }
}
