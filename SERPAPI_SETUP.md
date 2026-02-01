# How to Get SerpAPI Key (Alternative to ScrapeOps)

## Why SerpAPI?
If ScrapeOps isn't working, SerpAPI is a great alternative with similar free tier limits.

## Step-by-Step Guide

### Step 1: Sign Up for SerpAPI
1. Go to: **https://serpapi.com/users/sign_up**
2. Sign up with your email (free account)
3. Verify your email address

### Step 2: Get Your API Key
1. After signing in, go to: **https://serpapi.com/dashboard**
2. You'll see your **API Key** displayed on the dashboard
3. **Copy the API key** (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### Step 3: Add to Your Project
1. Open `.env.local` in your project root
2. Add this line:
   ```env
   SERPAPI_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the key you copied
4. Save the file

### Step 4: Restart Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

## Free Tier Limits
- **100 searches/month** (free tier)
- Each competitor analysis uses ~10-50 API calls
- Perfect for testing and small projects

## Using Both APIs
You can have both in `.env.local` - the system will use ScrapeOps first, then fall back to SerpAPI:

```env
SCRAPEOPS_API_KEY=14855503-d92a-4ce3-94ae-b43337990579
SERPAPI_KEY=your_serpapi_key_here
```

## Troubleshooting

### "Invalid API key"
- Make sure you copied the entire key (no spaces)
- Check for typos
- Verify the key is active in your SerpAPI dashboard

### "Quota exceeded"
- You've used your 100 free searches
- Wait for monthly reset or upgrade plan
- Keywords will still be extracted (just no rankings)

### Still not working?
1. Make sure `.env.local` is in project root
2. Restart the dev server after adding the key
3. Check the terminal - should NOT show "No API key configured"

---

**Note**: SerpAPI and ScrapeOps work the same way - both provide Google SERP data. The code automatically uses whichever API key is available.
