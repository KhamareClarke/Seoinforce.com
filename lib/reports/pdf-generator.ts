import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

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

/** SEOInForce website theme */
const THEME = {
  black: '#0a0a0c',
  ink: '#111111',
  muted: '#6b7280',
  silver: '#C0C0C0',
  light: '#f7f7f8',
  white: '#ffffff',
  border: '#e5e7eb',
  gold: '#FFD700',
  goldDark: '#b8860b',
  goldSoft: '#fff8dc',
  pass: '#16a34a',
  passBg: '#dcfce7',
  warn: '#d97706',
  warnBg: '#fef3c7',
  critical: '#dc2626',
  criticalBg: '#fee2e2',
  info: '#2563eb',
  infoBg: '#dbeafe',
};

const PAGE_BOTTOM = 780; // keep content above footer; A4 height ≈ 841

function scoreTone(score: number) {
  if (score >= 80) return { fg: THEME.pass, bg: THEME.passBg, label: 'Strong' };
  if (score >= 60) return { fg: THEME.warn, bg: THEME.warnBg, label: 'Needs work' };
  return { fg: THEME.critical, bg: THEME.criticalBg, label: 'Critical' };
}

function severityTone(severity: string) {
  if (severity === 'critical') return { fg: THEME.critical, bg: THEME.criticalBg, label: 'CRITICAL' };
  if (severity === 'warning') return { fg: THEME.warn, bg: THEME.warnBg, label: 'WARNING' };
  if (severity === 'good') return { fg: THEME.pass, bg: THEME.passBg, label: 'PASSED' };
  return { fg: THEME.info, bg: THEME.infoBg, label: 'INFO' };
}

function resolveLogoPath(whiteLabelLogo?: string): string | null {
  const candidates = [
    whiteLabelLogo,
    path.join(process.cwd(), 'public', 'logo-report.png'),
    path.join(process.cwd(), 'public', 'logo.png'),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      if (p.startsWith('http')) continue;
      const local = p.startsWith('/')
        ? path.join(process.cwd(), 'public', p.replace(/^\//, ''))
        : p;
      if (fs.existsSync(local)) return local;
    } catch {
      /* skip */
    }
  }
  return null;
}

export class PDFReportGenerator {
  private logoPath: string | null = null;

  async generateReport(data: ReportData): Promise<Buffer> {
    this.logoPath = resolveLogoPath(data.whiteLabel?.logo);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          bufferPages: true,
          autoFirstPage: true,
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

        // Prevent accidental auto pages from flow layout
        let allowAutoPage = false;
        doc.on('pageAdded', () => {
          if (!allowAutoPage) {
            // Content should only add pages via explicit doc.addPage()
          }
        });

        const addPage = () => {
          allowAutoPage = true;
          doc.addPage();
          allowAutoPage = false;
        };

        this.addCoverPage(doc, data);
        addPage();
        this.addCategoryBreakdown(doc, data);
        addPage();
        this.addIssuesPage(doc, data, addPage);
        addPage();
        this.addChecklistPage(doc, data, addPage);
        addPage();
        this.addRecommendationsPage(doc, data);

        this.applyFooters(doc, data);
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
    return data.whiteLabel?.colors?.primary || THEME.gold;
  }

  /** Absolute text that never triggers PDFKit page breaks */
  private t(
    doc: any,
    str: string,
    x: number,
    y: number,
    opts: {
      width?: number;
      align?: 'left' | 'center' | 'right' | 'justify';
      fontSize?: number;
      color?: string;
      bold?: boolean;
      characterSpacing?: number;
    } = {}
  ) {
    doc
      .font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(opts.fontSize ?? 10)
      .fillColor(opts.color ?? THEME.ink)
      .text(String(str ?? ''), x, y, {
        width: opts.width,
        align: opts.align,
        characterSpacing: opts.characterSpacing,
        lineBreak: false,
        continued: false,
      });
  }

  /** Single-line clipped text — never triggers PDFKit page breaks */
  private tw(
    doc: any,
    str: string,
    x: number,
    y: number,
    width: number,
    _height: number,
    opts: { fontSize?: number; color?: string; bold?: boolean } = {}
  ) {
    const fontSize = opts.fontSize ?? 9;
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    const raw = String(str ?? '').replace(/\s+/g, ' ').trim();
    // Manually truncate so we never need wrapping (wrapping causes blank pages)
    let text = raw;
    while (text.length > 3 && doc.widthOfString(text) > width) {
      text = text.slice(0, -2);
    }
    if (text !== raw && text.length > 3) text = `${text.slice(0, -1)}…`;
    doc.fillColor(opts.color ?? THEME.muted).text(text, x, y, {
      width,
      lineBreak: false,
      continued: false,
    });
  }

  private drawLogoMark(doc: any, x: number, y: number, size = 28) {
    if (this.logoPath) {
      try {
        doc.image(this.logoPath, x, y, { width: size, height: size, fit: [size, size] });
        return;
      } catch {
        /* vector fallback */
      }
    }
    doc.save();
    doc.roundedRect(x, y, size, size, 6).fill(THEME.gold);
    doc.restore();
    this.t(doc, 'S', x, y + size * 0.28, {
      width: size,
      align: 'center',
      fontSize: size * 0.4,
      bold: true,
      color: THEME.black,
    });
  }

  private drawHeaderBar(doc: any, data: ReportData, subtitle: string) {
    const pageW = doc.page.width;
    const primary = this.primary(data);
    doc.save();
    doc.rect(0, 0, pageW, 52).fill(THEME.black);
    doc.rect(0, 52, pageW, 3).fill(primary);
    doc.restore();
    this.drawLogoMark(doc, 48, 12, 28);
    this.t(doc, this.brandName(data), 86, 14, {
      fontSize: 12,
      bold: true,
      color: THEME.white,
    });
    this.t(doc, subtitle, 86, 30, { fontSize: 9, color: THEME.gold });
  }

  private applyFooters(doc: any, data: ReportData) {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const pageW = doc.page.width;
      const pageH = doc.page.height;
      const footerY = pageH - 36;

      doc.save();
      doc.moveTo(48, pageH - 48).lineTo(pageW - 48, pageH - 48).strokeColor(THEME.border).lineWidth(0.7).stroke();
      doc.restore();

      this.t(doc, this.brandName(data), 48, footerY, {
        width: 150,
        fontSize: 8,
        color: THEME.muted,
      });
      this.t(doc, data.domain, 48, footerY, {
        width: pageW - 96,
        align: 'center',
        fontSize: 8,
        color: THEME.muted,
      });
      this.t(doc, `Page ${i + 1} of ${range.count}`, 48, footerY, {
        width: pageW - 96,
        align: 'right',
        fontSize: 8,
        color: THEME.muted,
      });
    }
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
      {
        name: 'Advanced SEO',
        short: 'Advanced',
        score: Math.round((data.onpage_score + data.technical_score) / 2),
      },
      { name: 'Performance', short: 'Perf', score: data.technical_score },
      { name: 'Security', short: 'Security', score: data.technical?.https ? 85 : 40 },
    ];
  }

  private clientIssues(data: ReportData) {
    return (data.issues || []).filter((i) => {
      const blob = `${i.title} ${i.description} ${i.fix_suggestion}`.toLowerCase();
      if (blob.includes('google_pagespeed_api_key')) return false;
      if (blob.includes('not measured')) return false;
      if (blob.includes('pagespeed') && blob.includes('set')) return false;
      return true;
    });
  }

  private addCoverPage(doc: any, data: ReportData) {
    const pageW = doc.page.width;
    const primary = this.primary(data);
    const tone = scoreTone(data.overall_score);
    const issues = this.clientIssues(data);

    doc.save();
    doc.rect(0, 0, pageW, 200).fill(THEME.black);
    doc.rect(0, 197, pageW, 5).fill(primary);
    doc.restore();

    this.drawLogoMark(doc, 48, 32, 36);
    this.t(doc, 'SEO AUDIT REPORT', 96, 36, {
      fontSize: 10,
      color: THEME.gold,
      characterSpacing: 1.2,
    });
    this.t(doc, this.brandName(data), 96, 54, {
      fontSize: 22,
      bold: true,
      color: THEME.white,
    });

    if (data.whiteLabel?.clientName || data.whiteLabel?.agencyName) {
      this.t(
        doc,
        [
          data.whiteLabel.clientName ? `Prepared for ${data.whiteLabel.clientName}` : null,
          data.whiteLabel.agencyName ? `by ${data.whiteLabel.agencyName}` : null,
        ]
          .filter(Boolean)
          .join(' '),
        48,
        105,
        { fontSize: 10, color: THEME.silver, width: pageW - 96 }
      );
    }

    this.t(doc, data.domain, 48, 130, {
      fontSize: 16,
      bold: true,
      color: THEME.white,
      width: pageW - 96,
    });
    this.t(
      doc,
      `Generated ${new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`,
      48,
      156,
      { fontSize: 10, color: THEME.silver }
    );

    const cardY = 230;
    doc.save();
    doc.roundedRect(48, cardY, pageW - 96, 145, 12).fill(THEME.white);
    doc.roundedRect(48, cardY, pageW - 96, 145, 12).strokeColor(THEME.border).lineWidth(1).stroke();
    doc.circle(118, cardY + 72, 46).fill(tone.bg);
    doc.circle(118, cardY + 72, 46).strokeColor(tone.fg).lineWidth(3).stroke();
    doc.restore();

    this.t(doc, String(data.overall_score), 86, cardY + 50, {
      width: 64,
      align: 'center',
      fontSize: 30,
      bold: true,
      color: tone.fg,
    });
    this.t(doc, '/ 100', 86, cardY + 86, {
      width: 64,
      align: 'center',
      fontSize: 9,
      color: tone.fg,
    });
    this.t(doc, 'Overall SEO Score', 185, cardY + 30, {
      fontSize: 14,
      bold: true,
      color: THEME.ink,
    });
    this.tw(
      doc,
      `Status: ${tone.label}. Based on live homepage HTML, metadata, structure, performance, and security checks.`,
      185,
      cardY + 52,
      pageW - 270,
      36,
      { fontSize: 10, color: THEME.muted }
    );

    let pillX = 185;
    this.resolveCategories(data).forEach((cat) => {
      const t = scoreTone(cat.score);
      doc.save();
      doc.roundedRect(pillX, cardY + 105, 70, 20, 5).fill(t.bg);
      doc.restore();
      this.t(doc, `${cat.short} ${cat.score}`, pillX, cardY + 110, {
        width: 70,
        align: 'center',
        fontSize: 8,
        bold: true,
        color: t.fg,
      });
      pillX += 78;
    });

    const stripY = 400;
    this.t(doc, 'Findings at a glance', 48, stripY, {
      fontSize: 13,
      bold: true,
      color: THEME.ink,
    });

    const critical = issues.filter((i) => i.severity === 'critical').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const info = issues.filter((i) => i.severity === 'info' || !i.severity).length;
    [
      { label: 'Critical', count: critical, fg: THEME.critical, bg: THEME.criticalBg },
      { label: 'Warnings', count: warnings, fg: THEME.warn, bg: THEME.warnBg },
      { label: 'Opportunities', count: info, fg: THEME.info, bg: THEME.infoBg },
      { label: 'Total', count: issues.length, fg: THEME.goldDark, bg: THEME.goldSoft },
    ].forEach((b, i) => {
      const x = 48 + i * 128;
      const y = stripY + 24;
      doc.save();
      doc.roundedRect(x, y, 116, 60, 10).fill(b.bg);
      doc.restore();
      this.t(doc, String(b.count), x, y + 10, {
        width: 116,
        align: 'center',
        fontSize: 20,
        bold: true,
        color: b.fg,
      });
      this.t(doc, b.label, x, y + 36, {
        width: 116,
        align: 'center',
        fontSize: 9,
        color: THEME.ink,
      });
    });

    this.tw(
      doc,
      'Checks include title & meta length, headings, image alt coverage, canonical, robots.txt, sitemap, schema, Open Graph, page weight, resource count, and response time.',
      48,
      520,
      pageW - 96,
      40,
      { fontSize: 9, color: THEME.muted }
    );
  }

  private addCategoryBreakdown(doc: any, data: ReportData) {
    this.drawHeaderBar(doc, data, 'Score breakdown');
    const pageW = doc.page.width;
    let y = 70;

    this.t(doc, 'Score Breakdown by Category', 48, y, {
      fontSize: 18,
      bold: true,
      color: THEME.ink,
    });
    y += 26;
    this.t(doc, 'Each category is scored from live page data.', 48, y, {
      fontSize: 10,
      color: THEME.muted,
      width: pageW - 96,
    });
    y += 28;

    this.resolveCategories(data).forEach((cat) => {
      const tone = scoreTone(cat.score);
      doc.save();
      doc.roundedRect(48, y, pageW - 96, 66, 10).fill(THEME.light);
      doc.restore();
      this.t(doc, cat.name, 64, y + 12, { fontSize: 13, bold: true });
      this.t(doc, String(cat.score), pageW - 120, y + 10, {
        width: 50,
        align: 'right',
        fontSize: 18,
        bold: true,
        color: tone.fg,
      });
      this.t(doc, tone.label, pageW - 120, y + 34, {
        width: 50,
        align: 'right',
        fontSize: 8,
        color: tone.fg,
      });
      const barW = pageW - 220;
      doc.save();
      doc.roundedRect(64, y + 44, barW, 8, 4).fill(THEME.border);
      doc.roundedRect(64, y + 44, Math.max(4, (cat.score / 100) * barW), 8, 4).fill(tone.fg);
      doc.restore();
      y += 78;
    });

    y += 6;
    this.t(doc, 'Supporting scores', 48, y, { fontSize: 12, bold: true });
    y += 22;
    [
      { name: 'Technical', score: data.technical_score },
      { name: 'On-Page', score: data.onpage_score },
      { name: 'Content', score: data.content_score },
    ].forEach((item, i) => {
      const x = 48 + i * 165;
      const tone = scoreTone(item.score);
      doc.save();
      doc.roundedRect(x, y, 150, 50, 8).strokeColor(THEME.border).lineWidth(1).stroke();
      doc.restore();
      this.t(doc, item.name, x + 12, y + 10, { fontSize: 9, color: THEME.muted });
      this.t(doc, `${item.score}/100`, x + 12, y + 26, {
        fontSize: 16,
        bold: true,
        color: tone.fg,
      });
    });
  }

  private addIssuesPage(
    doc: any,
    data: ReportData,
    addPage: () => void
  ) {
    this.drawHeaderBar(doc, data, 'Issues & opportunities');
    const pageW = doc.page.width;
    const issues = this.clientIssues(data);
    let y = 70;

    this.t(doc, 'Issues & Opportunities', 48, y, { fontSize: 18, bold: true });
    y += 24;
    this.t(doc, 'Color-coded by severity. Critical items should be fixed first.', 48, y, {
      fontSize: 10,
      color: THEME.muted,
      width: pageW - 96,
    });
    y += 28;

    if (!issues.length) {
      this.t(doc, 'No issues found. Strong foundation.', 48, y, {
        fontSize: 12,
        color: THEME.pass,
      });
      return;
    }

    const boxH = 68;
    for (const sev of ['critical', 'warning', 'info', 'good'] as const) {
      const items = issues.filter((i) => (i.severity || 'info') === sev);
      if (!items.length) continue;
      const tone = severityTone(sev);

      if (y + 30 > PAGE_BOTTOM) {
        addPage();
        this.drawHeaderBar(doc, data, 'Issues & opportunities');
        y = 70;
      }

      doc.save();
      doc.roundedRect(48, y, 100, 18, 5).fill(tone.bg);
      doc.restore();
      this.t(doc, tone.label, 48, y + 4, {
        width: 100,
        align: 'center',
        fontSize: 8,
        bold: true,
        color: tone.fg,
      });
      this.t(doc, `${items.length} item${items.length === 1 ? '' : 's'}`, 160, y + 3, {
        fontSize: 10,
      });
      y += 28;

      for (const issue of items.slice(0, 14)) {
        if (y + boxH > PAGE_BOTTOM) {
          addPage();
          this.drawHeaderBar(doc, data, 'Issues & opportunities');
          y = 70;
        }

        doc.save();
        doc.roundedRect(48, y, pageW - 96, boxH, 8).fill(THEME.white);
        doc.roundedRect(48, y, 4, boxH, 2).fill(tone.fg);
        doc.roundedRect(48, y, pageW - 96, boxH, 8).strokeColor(THEME.border).lineWidth(0.8).stroke();
        doc.restore();

        this.t(doc, issue.title || 'Issue', 64, y + 8, {
          width: pageW - 130,
          fontSize: 11,
          bold: true,
        });
        this.tw(doc, issue.description || '', 64, y + 26, pageW - 130, 16, {
          fontSize: 9,
          color: THEME.muted,
        });
        if (issue.fix_suggestion) {
          this.tw(doc, `Fix: ${issue.fix_suggestion}`, 64, y + 44, pageW - 130, 16, {
            fontSize: 9,
            color: THEME.goldDark,
          });
        }
        y += boxH + 8;
      }
      y += 4;
    }
  }

  private addChecklistPage(
    doc: any,
    data: ReportData,
    addPage: () => void
  ) {
    this.drawHeaderBar(doc, data, 'Live site checklist');
    const pageW = doc.page.width;
    const t = data.technical || {};
    const o = data.onpage || {};
    const c = data.content || {};
    let y = 70;

    this.t(doc, 'Live Site Checklist', 48, y, { fontSize: 18, bold: true });
    y += 24;
    this.t(doc, 'Pass / fail based on data fetched from the live URL.', 48, y, {
      fontSize: 10,
      color: THEME.muted,
      width: pageW - 96,
    });
    y += 26;

    const fmtBytes = (n?: number | null) =>
      n == null
        ? '—'
        : n > 1024 * 1024
          ? `${(n / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.round(n / 1024)} KB`;

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

    let lastSection = '';
    for (const row of rows) {
      const need = row.section !== lastSection ? 48 : 28;
      if (y + need > PAGE_BOTTOM) {
        addPage();
        this.drawHeaderBar(doc, data, 'Live site checklist');
        y = 70;
        lastSection = '';
      }

      if (row.section !== lastSection) {
        lastSection = row.section;
        this.t(doc, row.section, 48, y, {
          fontSize: 11,
          bold: true,
          color: THEME.goldDark,
        });
        y += 18;
      }

      const passTone = row.pass
        ? { fg: THEME.pass, bg: THEME.passBg, label: 'PASS' }
        : { fg: THEME.critical, bg: THEME.criticalBg, label: 'FAIL' };

      doc.save();
      doc.roundedRect(48, y, pageW - 96, 24, 5).fill(THEME.light);
      doc.roundedRect(56, y + 4, 40, 16, 4).fill(passTone.bg);
      doc.restore();

      this.t(doc, passTone.label, 56, y + 7, {
        width: 40,
        align: 'center',
        fontSize: 7,
        bold: true,
        color: passTone.fg,
      });
      this.t(doc, row.label, 106, y + 6, { width: 220, fontSize: 9 });
      this.t(doc, row.value, 320, y + 6, {
        width: pageW - 380,
        align: 'right',
        fontSize: 9,
        color: THEME.muted,
      });
      y += 28;
    }
  }

  private addRecommendationsPage(doc: any, data: ReportData) {
    this.drawHeaderBar(doc, data, 'Next steps');
    const pageW = doc.page.width;
    const issues = this.clientIssues(data);
    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const tone = scoreTone(data.overall_score);
    let y = 70;

    this.t(doc, 'Recommendations & Next Steps', 48, y, { fontSize: 18, bold: true });
    y += 26;
    this.tw(
      doc,
      `Current overall score: ${data.overall_score}/100 (${tone.label}). Prioritize critical findings, then warnings, then opportunities.`,
      48,
      y,
      pageW - 96,
      32,
      { fontSize: 10, color: THEME.muted }
    );
    y += 40;

    const steps = [
      {
        title: '1. Resolve critical issues',
        body: `Address ${criticalCount} critical finding${criticalCount === 1 ? '' : 's'} that block search visibility or trust.`,
      },
      {
        title: '2. Clear warnings',
        body: `Fix ${warningCount} warning${warningCount === 1 ? '' : 's'} such as title/meta length, alt text, or structure gaps.`,
      },
      {
        title: '3. Strengthen advanced SEO',
        body: 'Keep Open Graph, Twitter Card, and JSON-LD schema complete for sharing and rich results.',
      },
      {
        title: '4. Re-audit after changes',
        body: 'Re-run this report after shipping fixes to confirm scores improve.',
      },
    ];

    steps.forEach((step) => {
      doc.save();
      doc.roundedRect(48, y, pageW - 96, 58, 10).fill(THEME.light);
      doc.restore();
      this.t(doc, step.title, 64, y + 10, { fontSize: 11, bold: true });
      this.tw(doc, step.body, 64, y + 30, pageW - 128, 20, {
        fontSize: 9,
        color: THEME.muted,
      });
      y += 68;
    });

    y += 8;
    doc.save();
    doc.roundedRect(48, y, pageW - 96, 88, 12).fill(THEME.black);
    doc.rect(48, y, 6, 88).fill(this.primary(data));
    doc.restore();

    if (!data.whiteLabel?.companyName || data.whiteLabel.companyName === 'SEOInForce') {
      this.t(doc, 'Need help implementing these fixes?', 70, y + 18, {
        fontSize: 13,
        bold: true,
        color: THEME.gold,
        width: pageW - 140,
      });
      this.tw(
        doc,
        'SEOInForce can turn this audit into a prioritized action plan — technical fixes, content upgrades, and ongoing ranking work.',
        70,
        y + 42,
        pageW - 140,
        36,
        { fontSize: 10, color: THEME.silver }
      );
    } else {
      this.t(doc, `Prepared by ${data.whiteLabel.companyName}`, 70, y + 24, {
        fontSize: 13,
        bold: true,
        color: THEME.gold,
        width: pageW - 140,
      });
      this.tw(
        doc,
        'Contact your agency to prioritize and implement the recommendations in this report.',
        70,
        y + 48,
        pageW - 140,
        28,
        { fontSize: 10, color: THEME.silver }
      );
    }
  }
}
