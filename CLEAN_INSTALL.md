# Clean Installation Instructions

## Problem
Your node_modules folder is corrupted/incomplete. Next.js installation is missing critical files.

## Solution: Complete Clean Install

### Step 1: Delete Everything
**In PowerShell, run these commands:**

```powershell
cd "C:\Users\FC\Desktop\Seoinforce.com"
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

**OR manually:**
- Close your code editor
- Delete the `node_modules` folder
- Delete `package-lock.json` file

### Step 2: Fresh Install
```powershell
npm install
```

**Let it complete** - This may take 5-10 minutes. The warnings about .map files are normal.

### Step 3: Verify Installation
```powershell
npm run dev
```

## If Installation Still Fails

### Option A: Use npm ci (clean install)
```powershell
npm ci
```

### Option B: Install with legacy peer deps
```powershell
npm install --legacy-peer-deps
```

### Option C: Install Next.js separately first
```powershell
npm install next@13.5.1 --save-exact
npm install
```

## What I Fixed

1. ✅ Reverted Next.js to 13.5.1 (stable version)
2. ✅ Fixed eslint-config-next to match
3. ✅ Cheerio uses dynamic import (avoids build issues)

## After Installation

Once `npm install` completes successfully:
1. Run `npm run dev`
2. The app should start without errors
3. Visit http://localhost:3000

## Important Notes

- **Don't cancel npm install** - Let it finish completely
- **Warnings are OK** - The .map file warnings don't affect functionality
- **Be patient** - First install can take 5-10 minutes

If you still have issues after a clean install, we may need to use an alternative HTML parser instead of cheerio.
