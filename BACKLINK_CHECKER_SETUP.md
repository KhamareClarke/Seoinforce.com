# Backlink Checker Setup Guide

The SEO audit tool now supports **multiple backlink data sources** with automatic fallback. The system will try each source in order until it finds data.

## Available Sources (in order of priority)

### 1. **Ahrefs API** (Paid - Best Quality)
- **Requires**: `AHREFS_API_KEY` in `.env.local`
- **Quality**: ⭐⭐⭐⭐⭐ Excellent
- **Coverage**: Very comprehensive
- **Setup**: Get API key from [Ahrefs API](https://ahrefs.com/api)

### 2. **DataForSEO Backlinks API** (Paid - High Quality)
- **Requires**: 
  - `DATAFORSEO_LOGIN` in `.env.local`
  - `DATAFORSEO_PASSWORD` in `.env.local`
- **Quality**: ⭐⭐⭐⭐⭐ Excellent
- **Coverage**: Very comprehensive
- **Setup**: Get credentials from [DataForSEO](https://dataforseo.com/)

### 3. **BacklinkWatch** (Free - Scraping)
- **Requires**: Nothing (automatic)
- **Quality**: ⭐⭐⭐ Good
- **Coverage**: Moderate (depends on domain popularity)
- **Note**: Uses web scraping, may have rate limits

### 4. **SmallSEOTools** (Free - Scraping)
- **Requires**: Nothing (automatic)
- **Quality**: ⭐⭐⭐ Good
- **Coverage**: Moderate (depends on domain popularity)
- **Note**: Uses web scraping, may have rate limits

### 5. **OpenLinkProfiler** (Free - Scraping)
- **Requires**: Nothing (automatic)
- **Quality**: ⭐⭐ Fair
- **Coverage**: Limited (many domains not in database)
- **Note**: Original source, kept as fallback

## How It Works

The system automatically tries sources in order:
1. If you have **Ahrefs API key** → Uses Ahrefs (best quality)
2. If you have **DataForSEO credentials** → Uses DataForSEO
3. Otherwise → Tries free sources (BacklinkWatch, SmallSEOTools, OpenLinkProfiler)
4. If all fail → Returns zero (no data available)

## Setup Instructions

### Option 1: Use Free Sources (No Setup Required)
- **Nothing to do!** The system will automatically try free sources.
- Works for popular/established domains
- May not have data for newer or smaller websites

### Option 2: Add Ahrefs API (Recommended for Production)
1. Sign up at [Ahrefs](https://ahrefs.com/api)
2. Get your API key
3. Add to `.env.local`:
   ```env
   AHREFS_API_KEY=your_ahrefs_api_key_here
   ```
4. Restart your development server

### Option 3: Add DataForSEO API
1. Sign up at [DataForSEO](https://dataforseo.com/)
2. Get your login and password
3. Add to `.env.local`:
   ```env
   DATAFORSEO_LOGIN=your_login
   DATAFORSEO_PASSWORD=your_password
   ```
4. Restart your development server

## Testing

### Domains Likely to Have Backlink Data:
- **Wikipedia.org** - Very high authority
- **Reddit.com** - High authority
- **GitHub.com** - High authority
- **Medium.com** - High authority
- **Any major news site** (CNN, BBC, etc.)

### Domains Unlikely to Have Data:
- New websites (< 6 months old)
- Small/local business websites
- Private/internal domains
- Domains with no SEO presence

## Troubleshooting

### "No backlink data found"
- **Cause**: Domain not in any database
- **Solution**: This is normal for new/small websites. Consider using a paid API for better coverage.

### "All backlink sources failed"
- **Cause**: All free sources don't have data for this domain
- **Solution**: 
  1. Try a more popular domain to test
  2. Add Ahrefs or DataForSEO API keys for better coverage

### "Invalid API key"
- **Cause**: API key is incorrect or expired
- **Solution**: Verify your API key in `.env.local` and restart the server

## Best Practices

1. **For Development/Testing**: Use free sources (no setup needed)
2. **For Production**: Add Ahrefs or DataForSEO API keys for reliable, comprehensive data
3. **For High-Volume**: Consider caching backlink data to reduce API calls

## Cost Considerations

- **Free Sources**: No cost, but limited coverage
- **Ahrefs API**: Paid, pricing varies by plan
- **DataForSEO**: Paid, pay-as-you-go model

Choose based on your needs and budget!
