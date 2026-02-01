# SEOInforce Setup Guide

Complete setup instructions for the SEOInforce platform.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- (Optional) Google PageSpeed Insights API key
- (Optional) ScrapeOps or SerpAPI key for keyword tracking

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings → API to get your:
   - Project URL
   - Anon/public key
   - Service role key (keep this secret!)
3. Go to SQL Editor and run the schema from `supabase/schema.sql`
4. Enable Row Level Security (RLS) is already configured in the schema

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 4: Set Up Free APIs (Optional)

### Google PageSpeed Insights
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable PageSpeed Insights API
4. Create credentials (API Key)
5. Add to `.env.local`: `GOOGLE_PAGESPEED_API_KEY=your_key`

### Keyword Tracking (Choose one)

**Option 1: ScrapeOps (Recommended for free tier)**
1. Sign up at [scrapeops.io](https://scrapeops.io)
2. Get your API key (100 free requests/month)
3. Add to `.env.local`: `SCRAPEOPS_API_KEY=your_key`

**Option 2: SerpAPI**
1. Sign up at [serpapi.com](https://serpapi.com)
2. Get your API key (100 free requests/month)
3. Add to `.env.local`: `SERPAPI_KEY=your_key`

## Step 5: Run the Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your First Account

1. Go to `/sign-in`
2. Click "Create Account"
3. Enter your email and password
4. Check your email for confirmation (if email confirmation is enabled)
5. Sign in and start creating projects!

## Features Overview

### SEO Audit Engine
- Technical SEO checks (HTTPS, mobile, robots.txt, sitemap)
- On-page SEO analysis (title, meta, headings, images)
- Content quality scoring
- PageSpeed Insights integration (if API key provided)

### Keyword Rank Tracker
- Track up to 20 keywords (free plan)
- Daily rank updates
- Historical tracking
- Location and device targeting

### Competitor Analysis
- Compare your site with competitors
- Keyword gap analysis
- Missing keyword opportunities

### Backlink Checker
- Total backlink count
- Referring domains
- Anchor text analysis
- Historical tracking

### Local SEO
- Google My Business presence
- NAP consistency check
- Local ranking analysis

### PDF Reports
- White-label ready
- Comprehensive audit reports
- Shareable links
- Branded for agencies

## Database Schema

The database includes:
- `profiles` - User profiles and plan info
- `projects` - User's tracked websites
- `audits` - SEO audit results
- `audit_issues` - Individual issues found
- `keywords` - Tracked keywords
- `keyword_rankings` - Historical rankings
- `competitors` - Competitor domains
- `backlinks` - Backlink data
- `local_seo` - Local SEO data
- `reports` - Generated PDF reports

## API Routes

- `POST /api/audit` - Run SEO audit
- `GET /api/audit` - Get audit results
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `POST /api/keywords` - Add keyword
- `GET /api/keywords` - Get keywords
- `POST /api/keywords/update-ranks` - Update all rankings
- `POST /api/reports/generate` - Generate PDF report
- `GET /api/reports/generate?token=...` - Get shared report

## Free Tier Limits

- **Free Plan**: 20 keywords, 100 API credits/month
- **Starter Plan**: 100 keywords, 500 API credits/month
- **Growth Plan**: 1,000 keywords, 2,000 API credits/month
- **Empire Plan**: Unlimited keywords, 10,000 API credits/month

## Troubleshooting

### "Unauthorized" errors
- Check that your Supabase keys are correct
- Verify RLS policies are set up correctly
- Check that you're signed in

### API rate limits
- Free APIs have monthly limits
- Consider upgrading to paid plans for production
- Implement caching (coming soon)

### PDF generation fails
- Ensure `pdfkit` is installed: `npm install pdfkit`
- Check server logs for errors

## Next Steps

1. Customize branding in the dashboard
2. Set up email notifications
3. Configure white-label options
4. Add more API integrations
5. Set up monitoring and alerts

## Support

For issues or questions, check the documentation or contact support.
