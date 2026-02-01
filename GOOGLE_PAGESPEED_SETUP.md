# How to Get Google PageSpeed Insights API Key

## Step-by-Step Guide

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create or Select a Project
1. Click the project dropdown at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Enter project name: `SEOInForce` (or any name you like)
4. Click **"Create"**
5. Wait a few seconds, then select your new project from the dropdown

### Step 3: Enable PageSpeed Insights API
1. Go to: https://console.cloud.google.com/apis/library
2. In the search bar, type: **"PageSpeed Insights API"**
3. Click on **"PageSpeed Insights API"** from the results
4. Click the **"Enable"** button
5. Wait for it to enable (takes a few seconds)

### Step 4: Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created and displayed
5. **Copy the API key immediately** (you won't be able to see it again!)

### Step 5: (Optional) Restrict the API Key
For security, you can restrict the key:
1. Click **"Restrict key"** (or edit the key later)
2. Under **"API restrictions"**, select **"Restrict key"**
3. Check **"PageSpeed Insights API"**
4. Click **"Save"**

### Step 6: Add to Your Project
1. Open your `.env.local` file in the project root
2. Add this line:
   ```env
   GOOGLE_PAGESPEED_API_KEY=your_actual_api_key_here
   ```
3. Replace `your_actual_api_key_here` with the key you copied
4. Save the file

### Step 7: Restart Dev Server
1. Stop your dev server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Free Tier Limits
- **Free tier**: 25,000 requests per day
- **Per request**: 1 API call
- This is more than enough for development and small-scale use

## What This Enables
Once configured, your audits will show:
- ✅ **LCP** (Largest Contentful Paint) - Real values
- ✅ **FCP** (First Contentful Paint) - Real values  
- ✅ **TTI** (Time to Interactive) - Real values
- ✅ **CLS** (Cumulative Layout Shift) - Real values

Instead of showing `0.0s`, you'll see actual performance metrics!

## Troubleshooting

### "API key not valid"
- Make sure you copied the entire key (it's long!)
- Check for extra spaces before/after the key
- Verify the API is enabled in Google Cloud Console

### "Quota exceeded"
- You've hit the free tier limit (25,000/day)
- Wait 24 hours or upgrade to a paid plan

### "API key not found"
- Make sure it's in `.env.local` (not `.env`)
- Restart your dev server after adding it
- Check the file is in the project root

## Quick Copy-Paste Format

After getting your key, add this to `.env.local`:

```env
# Google PageSpeed Insights API (for Core Web Vitals)
GOOGLE_PAGESPEED_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Replace the X's with your actual API key!

---

**Note**: The API key is free and gives you 25,000 requests per day - plenty for testing and development! 🚀
