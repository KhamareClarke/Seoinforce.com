# Quick Fix for Compilation Errors

## The Problem
Next.js 13.5.1 has issues with cheerio's dependencies (undici package uses modern JS syntax).

## Solution Applied

I've made the following changes:

1. **Reverted Next.js to 13.5.1** (keeping your current version)
2. **Changed cheerio to dynamic import** - This loads cheerio only on the server side, avoiding build issues
3. **Simplified webpack config** - Removed complex transpilation rules

## Next Steps

1. **Complete the npm install** (if it was canceled):
   ```bash
   npm install
   ```
   
   The warnings about missing .map files are normal and can be ignored.

2. **If installation fails**, try:
   ```bash
   npm cache clean --force
   npm install
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

## Alternative: If Still Having Issues

If cheerio still causes problems, we can replace it with a simpler HTML parser. But try the dynamic import approach first - it should work!

## What Changed

- `lib/seo/audit-engine.ts` - Now uses dynamic import for cheerio
- `next.config.js` - Simplified webpack config
- `package.json` - Kept Next.js 13.5.1

The dynamic import ensures cheerio only loads on the server side where it's needed, avoiding client-side build issues.
