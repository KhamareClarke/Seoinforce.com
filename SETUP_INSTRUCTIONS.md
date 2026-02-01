# Quick Setup Instructions

## ✅ Step 1: Environment Variables (DONE)
Your `.env.local` file has been created with your Supabase credentials.

## 📋 Step 2: Set Up Database Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/uzdwfirklszwrsqknmvl
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open the file `supabase/schema.sql` in your project
5. Copy the entire contents
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

This will create all the necessary tables, indexes, and security policies.

## 🧪 Step 3: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/sign-in

3. Try creating an account - it should automatically create a profile in the database

## 🎯 Step 4: Optional API Keys

### For Keyword Tracking (Choose one):

**ScrapeOps** (Recommended - easier free tier):
1. Sign up at https://scrapeops.io
2. Get your API key
3. Add to `.env.local`: `SCRAPEOPS_API_KEY=your_key`

**OR SerpAPI**:
1. Sign up at https://serpapi.com
2. Get your API key
3. Add to `.env.local`: `SERPAPI_KEY=your_key`

### For Core Web Vitals:
1. Go to https://console.cloud.google.com
2. Create/select project
3. Enable "PageSpeed Insights API"
4. Create API key
5. Add to `.env.local`: `GOOGLE_PAGESPEED_API_KEY=your_key`

## 🚀 Step 5: Start Using the Platform

1. **Create Account**: Go to `/sign-in` and sign up
2. **Create Project**: Use the API or dashboard to add a domain
3. **Run Audit**: POST to `/api/audit` with your domain
4. **Track Keywords**: Add keywords via `/api/keywords`
5. **Generate Reports**: Create PDF reports via `/api/reports/generate`

## 📝 Next Steps

1. **Connect Dashboard**: The dashboard at `/audit/dashboard` needs to be connected to real API data
2. **Test APIs**: Use Postman or curl to test the endpoints
3. **Set Up Email**: Configure Gmail app password for email notifications

## 🔍 Verify Database Setup

After running the schema, verify these tables exist:
- `profiles`
- `projects`
- `audits`
- `audit_issues`
- `keywords`
- `keyword_rankings`
- `competitors`
- `backlinks`
- `local_seo`
- `reports`
- `api_usage`

You can check in Supabase Dashboard → Table Editor.

## ⚠️ Important Notes

- **Service Role Key**: Keep this secret! Never commit it to git.
- **Rate Limits**: Free APIs have monthly limits - implement caching for production
- **RLS Policies**: All tables have Row Level Security enabled for data protection

## 🐛 Troubleshooting

**"Unauthorized" errors:**
- Check that your Supabase keys are correct in `.env.local`
- Restart your dev server after changing env vars
- Verify RLS policies were created correctly

**Database errors:**
- Make sure you ran the schema.sql file
- Check that all tables exist in Table Editor
- Verify RLS is enabled on all tables

**API errors:**
- Check browser console for errors
- Check server logs in terminal
- Verify API keys are set correctly

---

Your platform is now configured! 🎉
