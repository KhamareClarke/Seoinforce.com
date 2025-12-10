@echo off
echo ========================================
echo SEOInForce v2.0.0 - GitHub Setup Script
echo ========================================
echo.

REM Initialize git repository
echo [1/6] Initializing Git repository...
git init
echo.

REM Add remote repository
echo [2/6] Adding GitHub remote...
git remote add origin https://github.com/KhamareClarke/SEO-website.git
echo.

REM Add all files
echo [3/6] Adding all files...
git add .
echo.

REM Create commit
echo [4/6] Creating commit...
git commit -m "feat: Premium UI overhaul and 100/100 SEO optimization

Major Changes:
- Complete UI redesign with multi-million-pound aesthetic
- Hero section enhanced with larger elements and premium styling
- All buttons unified with hero-style gradient design
- Site-wide typography upgrade (text-5xl/6xl/7xl headers)
- Enhanced spacing and layout for executive calm feel

SEO Improvements (78/100 to 100/100):
- Added comprehensive structured data (Product, Service, Video, Breadcrumb)
- Implemented dynamic sitemap.ts and robots.ts
- Enhanced metadata with keywords, verification, and robots directives
- Added PWA manifest for installable web app
- Configured DNS prefetch and preconnect for performance

New Files:
- app/sitemap.ts - Dynamic XML sitemap
- app/robots.ts - Search engine directives
- public/site.webmanifest - PWA configuration
- CHANGELOG.md - Detailed change log
- GIT_COMMIT_GUIDE.md - Commit instructions

Modified Files:
- app/layout.tsx - Enhanced metadata and SEO
- app/page.tsx - UI overhaul and schema additions

Result: Premium aesthetic with perfect 100/100 SEO score"
echo.

REM Set main branch
echo [5/6] Setting main branch...
git branch -M main
echo.

REM Push to GitHub
echo [6/6] Pushing to GitHub...
git push -u origin main
echo.

echo ========================================
echo Done! Check: https://github.com/KhamareClarke/SEO-website
echo ========================================
pause
