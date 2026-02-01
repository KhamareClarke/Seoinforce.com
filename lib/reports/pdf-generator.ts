import PDFDocument from 'pdfkit';

export interface ReportData {
  domain: string;
  overall_score: number;
  technical_score: number;
  onpage_score: number;
  content_score: number;
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
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export class PDFReportGenerator {
  async generateReport(data: ReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Page 1: Cover & Summary
        this.addCoverPage(doc, data);
        doc.addPage();

        // Page 2: Top Issues & Fixes
        this.addIssuesPage(doc, data);
        doc.addPage();

        // Page 3: Technical SEO
        this.addTechnicalPage(doc, data);
        doc.addPage();

        // Page 4: On-Page SEO
        this.addOnPagePage(doc, data);
        doc.addPage();

        // Page 5: Content Analysis
        this.addContentPage(doc, data);
        doc.addPage();

        // Final Page: Recommendations & CTA
        this.addRecommendationsPage(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private addCoverPage(doc: any, data: ReportData) {
    // Header
    if (data.whiteLabel?.companyName) {
      doc.fontSize(24).text(data.whiteLabel.companyName, { align: 'center' });
      doc.moveDown();
    } else {
      doc.fontSize(24).text('SEOInForce', { align: 'center' });
      doc.moveDown();
    }

    doc.fontSize(18).text('SEO Audit Report', { align: 'center' });
    doc.moveDown(2);

    // Domain
    doc.fontSize(16).text(`Domain: ${data.domain}`, { align: 'center' });
    doc.moveDown(3);

    // Overall Score
    const scoreColor = data.overall_score >= 80 ? '#00FF00' : data.overall_score >= 60 ? '#FFA500' : '#FF0000';
    doc.fontSize(72)
      .fillColor(scoreColor)
      .text(`${data.overall_score}`, { align: 'center' });
    
    doc.fontSize(24)
      .fillColor('#000000')
      .text('Overall SEO Score', { align: 'center' });
    doc.moveDown(2);

    // Category Scores
    doc.fontSize(14).text('Category Scores:', { align: 'left' });
    doc.moveDown(0.5);

    const categories = [
      { name: 'Technical SEO', score: data.technical_score },
      { name: 'On-Page SEO', score: data.onpage_score },
      { name: 'Content Quality', score: data.content_score },
    ];

    categories.forEach((cat) => {
      const barWidth = (cat.score / 100) * 400;
      doc.rect(100, doc.y, 400, 20).stroke();
      doc.rect(100, doc.y, barWidth, 20).fill(cat.score >= 80 ? '#00FF00' : cat.score >= 60 ? '#FFA500' : '#FF0000');
      doc.fontSize(12).text(`${cat.name}: ${cat.score}/100`, 520, doc.y + 2);
      doc.moveDown(1.5);
    });

    // Footer
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50, { align: 'left' });
  }

  private addIssuesPage(doc: any, data: ReportData) {
    doc.fontSize(20).text('Top Issues & Fixes', { align: 'center' });
    doc.moveDown();

    if (!data.issues || data.issues.length === 0) {
      doc.fontSize(12).fillColor('#666666').text('No issues found. Your site is performing well!', { align: 'center' });
      doc.fillColor('#000000');
      return;
    }

    const criticalIssues = data.issues.filter((i: any) => i.severity === 'critical');
    const warningIssues = data.issues.filter((i: any) => i.severity === 'warning');
    const infoIssues = data.issues.filter((i: any) => i.severity === 'info' || !i.severity);

    if (criticalIssues.length > 0) {
      doc.fontSize(16).fillColor('#FF0000').text(`Critical Issues (${criticalIssues.length})`, { underline: true });
      doc.fillColor('#000000');
      doc.moveDown(0.5);

      criticalIssues.slice(0, 10).forEach((issue: any, index: number) => {
        doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${issue.title || 'Untitled Issue'}`, { continued: false });
        if (issue.description) {
          doc.fontSize(10).fillColor('#666666').text(issue.description);
        }
        doc.fillColor('#000000');
        if (issue.fix_suggestion) {
          doc.fontSize(10).fillColor('#0066CC').text(`Fix: ${issue.fix_suggestion}`);
        }
        doc.fillColor('#000000');
        doc.moveDown(0.8);
      });
    }

    if (warningIssues.length > 0) {
      if (criticalIssues.length > 0) {
        doc.moveDown();
      }
      doc.fontSize(16).fillColor('#FFA500').text(`Warnings (${warningIssues.length})`, { underline: true });
      doc.fillColor('#000000');
      doc.moveDown(0.5);

      warningIssues.slice(0, 10).forEach((issue: any, index: number) => {
        doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${issue.title || 'Untitled Issue'}`, { continued: false });
        if (issue.description) {
          doc.fontSize(10).fillColor('#666666').text(issue.description);
        }
        doc.fillColor('#000000');
        if (issue.fix_suggestion) {
          doc.fontSize(10).fillColor('#0066CC').text(`Fix: ${issue.fix_suggestion}`);
        }
        doc.fillColor('#000000');
        doc.moveDown(0.8);
      });
    }

    // Also show info issues if there are no critical or warning issues
    if (criticalIssues.length === 0 && warningIssues.length === 0 && infoIssues.length > 0) {
      doc.fontSize(16).fillColor('#0066CC').text(`Optimization Opportunities (${infoIssues.length})`, { underline: true });
      doc.fillColor('#000000');
      doc.moveDown(0.5);

      infoIssues.slice(0, 10).forEach((issue: any, index: number) => {
        doc.fontSize(12).fillColor('#000000').text(`${index + 1}. ${issue.title || 'Untitled Issue'}`, { continued: false });
        if (issue.description) {
          doc.fontSize(10).fillColor('#666666').text(issue.description);
        }
        doc.fillColor('#000000');
        if (issue.fix_suggestion) {
          doc.fontSize(10).fillColor('#0066CC').text(`Fix: ${issue.fix_suggestion}`);
        }
        doc.fillColor('#000000');
        doc.moveDown(0.8);
      });
    }

    // If still no issues displayed, show a message
    if (criticalIssues.length === 0 && warningIssues.length === 0 && infoIssues.length === 0) {
      doc.fontSize(12).fillColor('#666666').text('No issues found. Your site is performing well!', { align: 'center' });
      doc.fillColor('#000000');
    }
  }

  private addTechnicalPage(doc: any, data: ReportData) {
    doc.fontSize(20).text('Technical SEO Analysis', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text('Security & Performance:', { underline: true });
    doc.moveDown(0.5);

    const technicalItems = [
      { label: 'HTTPS Enabled', value: data.technical.https ? 'Yes ✓' : 'No ✗' },
      { label: 'Mobile Responsive', value: data.technical.mobile ? 'Yes ✓' : 'No ✗' },
      { label: 'Robots.txt', value: data.technical.robots ? 'Found ✓' : 'Missing ✗' },
      { label: 'Sitemap.xml', value: data.technical.sitemap ? 'Found ✓' : 'Missing ✗' },
    ];

    if (data.technical.lcp) {
      technicalItems.push({ label: 'LCP (Largest Contentful Paint)', value: `${data.technical.lcp.toFixed(2)}s` });
    }
    if (data.technical.fcp) {
      technicalItems.push({ label: 'FCP (First Contentful Paint)', value: `${data.technical.fcp.toFixed(2)}s` });
    }

    technicalItems.forEach((item) => {
      doc.fontSize(12).text(`${item.label}: ${item.value}`);
      doc.moveDown(0.3);
    });
  }

  private addOnPagePage(doc: any, data: ReportData) {
    doc.fontSize(20).text('On-Page SEO Analysis', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text('Meta Tags:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Title Length: ${data.onpage.title.length} characters ${data.onpage.title.optimal ? '✓' : '✗'}`);
    doc.fontSize(12).text(`Meta Description: ${data.onpage.description.missing ? 'Missing ✗' : `${data.onpage.description.length} characters ${data.onpage.description.tooLong || data.onpage.description.tooShort ? '✗' : '✓'}`}`);
    doc.moveDown();

    doc.fontSize(14).text('Content Structure:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`H1 Tags: ${data.onpage.h1} ${data.onpage.h1 === 1 ? '✓' : '✗'}`);
    doc.fontSize(12).text(`H2 Tags: ${data.onpage.h2}`);
    doc.fontSize(12).text(`H3 Tags: ${data.onpage.h3}`);
    doc.moveDown();

    doc.fontSize(14).text('Images:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Images: ${data.onpage.images.total}`);
    doc.fontSize(12).text(`Images with Alt Text: ${data.onpage.images.valid} ✓`);
    doc.fontSize(12).text(`Images Missing Alt Text: ${data.onpage.images.missing} ${data.onpage.images.missing === 0 ? '✓' : '✗'}`);
  }

  private addContentPage(doc: any, data: ReportData) {
    doc.fontSize(20).text('Content Quality Analysis', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text('Content Metrics:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Word Count: ${data.content.word_count}`);
    doc.fontSize(12).text(`Readability Score: ${data.content.readability}/100`);
    doc.moveDown();

    if (data.content.keyword_density.length > 0) {
      doc.fontSize(14).text('Top Keywords:', { underline: true });
      doc.moveDown(0.5);
      data.content.keyword_density.slice(0, 5).forEach((kw) => {
        doc.fontSize(12).text(`${kw.term}: ${kw.pct}%`);
      });
    }

    if (data.content.suggestions.length > 0) {
      doc.moveDown();
      doc.fontSize(14).text('Content Suggestions:', { underline: true });
      doc.moveDown(0.5);
      data.content.suggestions.forEach((suggestion) => {
        doc.fontSize(11).fillColor('#666666').text(`• ${suggestion}`);
        doc.fillColor('#000000');
        doc.moveDown(0.3);
      });
    }
  }

  private addRecommendationsPage(doc: any, data: ReportData) {
    doc.fontSize(20).text('Recommendations & Next Steps', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(14).text('Priority Actions:', { underline: true });
    doc.moveDown(0.5);

    const criticalCount = data.issues.filter(i => i.severity === 'critical').length;
    const warningCount = data.issues.filter(i => i.severity === 'warning').length;

    doc.fontSize(12).text(`1. Fix ${criticalCount} critical issue(s) to improve your SEO score`);
    doc.moveDown();
    doc.fontSize(12).text(`2. Address ${warningCount} warning(s) to optimize performance`);
    doc.moveDown();
    doc.fontSize(12).text('3. Monitor your rankings and track improvements over time');
    doc.moveDown(2);

    doc.fontSize(14).text('Expected Impact:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#0066CC').text('By implementing these fixes, you can expect:');
    doc.fillColor('#000000');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#666666').text('• Improved search engine rankings');
    doc.fontSize(11).fillColor('#666666').text('• Better user experience');
    doc.fontSize(11).fillColor('#666666').text('• Increased organic traffic');
    doc.fillColor('#000000');
    doc.moveDown(2);

    if (!data.whiteLabel) {
      doc.fontSize(12).text('Need help implementing these fixes?', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#0066CC').text('Contact SEOInForce Task Force for done-for-you SEO services', { align: 'center', link: 'https://seoinforce.com' });
      doc.fillColor('#000000');
    }
  }
}
