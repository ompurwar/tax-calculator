# 🧪 SEO Testing & Validation Guide

## Quick Start

1. **Set Environment Variable**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and set NEXT_PUBLIC_SITE_URL
   ```

2. **Build & Run**
   ```bash
   npm run build
   npm run start
   ```

## Testing Checklist

### ✅ Structured Data Validation

**Test Homepage Schema:**
```bash
# Open browser and view page source
open http://localhost:3000

# Extract JSON-LD schemas (look for <script type="application/ld+json">)
# You should find 4 schemas:
# 1. WebApplication
# 2. FAQPage (6 questions)
# 3. HowTo (5 steps)
# 4. Organization
```

**Validate with Google Rich Results Test:**
1. Go to: https://search.google.com/test/rich-results
2. Enter URL: `http://localhost:3000` (or use "Code Snippet" tab)
3. Paste the JSON-LD content from page source
4. Check for validation errors

**Validate with Schema.org Validator:**
1. Go to: https://validator.schema.org/
2. Paste JSON-LD content
3. Check for warnings/errors

### ✅ Open Graph Images

**Test Dynamic OG Generation:**
```bash
# Basic test
curl "http://localhost:3000/api/og?title=Test&ay=2026-27" --output test-og.png
open test-og.png

# With salary data
curl "http://localhost:3000/api/og?ctc=2400000&inhand=133837&ay=2026-27&hike=15.5" --output salary-og.png
open salary-og.png

# Test in browser
open "http://localhost:3000/api/og?ctc=2400000&inhand=133837&ay=2026-27&hike=15.5"
```

**Validate Social Previews:**
- **Facebook:** https://developers.facebook.com/tools/debug/
- **Twitter:** https://cards-dev.twitter.com/validator
- **LinkedIn:** https://www.linkedin.com/post-inspector/

Enter your deployed URL to see how cards appear.

### ✅ Public API for AI Crawlers

**Test Default Response:**
```bash
curl "http://localhost:3000/api/public" | jq '.'
```

**Expected Output:**
```json
{
  "assessmentYear": "2026-27",
  "regime": "new",
  "timestamp": "2024-...",
  "summary": "India Income Tax Calculator for AY 2026-27...",
  "calculations": [
    {
      "ctc": 1700000,
      "grossMonthly": 121576,
      "monthlyTax": 9740,
      "monthlyPF": 10407,
      "inHandMonthly": 101429,
      "annualTax": 116880,
      "effectiveTaxRate": 8.01
    },
    // ... more variations
  ],
  "metadata": {
    "tool": "India Income Tax Calculator",
    "url": "...",
    "version": "1.0",
    "lastUpdated": "...",
    "disclaimer": "..."
  },
  "taxConfiguration": {
    "standardDeduction": 75000,
    "cessRate": "4%",
    "rebate": { ... }
  }
}
```

**Test with Custom Parameters:**
```bash
# Custom salaries
curl "http://localhost:3000/api/public?salaries=2000000,2500000,3000000" | jq '.calculations'

# Different assessment year and PF
curl "http://localhost:3000/api/public?ay=2025-26&pf=10&salaries=1800000" | jq '.'
```

### ✅ Sitemap Validation

**View Sitemap:**
```bash
curl http://localhost:3000/sitemap.xml

# Pretty print
curl http://localhost:3000/sitemap.xml | xmllint --format -
```

**Expected Structure:**
- Homepage (priority 1.0, weekly)
- 3 assessment year pages (priority 0.8, monthly)
- Up to 50 comparison pages (priority 0.7, monthly)

**Validate Sitemap:**
1. Go to: https://www.xml-sitemaps.com/validate-xml-sitemap.html
2. Enter: `http://localhost:3000/sitemap.xml` (or deployed URL)
3. Check for errors

**Submit to Search Consoles:**
- **Google:** https://search.google.com/search-console
- **Bing:** https://www.bing.com/webmasters

### ✅ Robots.txt Validation

**View Robots.txt:**
```bash
curl http://localhost:3000/robots.txt
```

**Expected Content:**
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

# ... more AI crawlers

Sitemap: http://localhost:3000/sitemap.xml
Host: http://localhost:3000
```

**Validate:**
1. Go to: https://support.google.com/webmasters/answer/6062598
2. Use robots.txt Tester in Google Search Console

### ✅ Meta Tags Verification

**Check Homepage Meta Tags:**
```bash
curl http://localhost:3000 | grep -E '<meta|<title|<link rel="canonical"'
```

**Required Tags:**
- `<title>` - Should contain "CTC to In-Hand Salary Calculator"
- `<meta name="description">` - Should be under 160 characters
- `<meta property="og:title">`
- `<meta property="og:description">`
- `<meta property="og:image">`
- `<meta property="og:url">`
- `<meta name="twitter:card">`
- `<link rel="canonical">`

**Use Browser Extensions:**
- **Meta SEO Inspector** (Chrome/Firefox)
- **SEO Meta in 1 Click** (Chrome)
- **OpenGraph Preview** (Chrome)

### ✅ Lighthouse Audit

**Run Lighthouse:**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view

# Generate report
lighthouse http://localhost:3000 --output html --output-path ./lighthouse-report.html
```

**Target Scores:**
- SEO: ≥ 95
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90

**Check in Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" + "Performance" + "Accessibility"
4. Click "Analyze page load"

### ✅ Mobile-Friendly Test

**Google Mobile-Friendly Test:**
1. Go to: https://search.google.com/test/mobile-friendly
2. Enter your deployed URL
3. Check results

### ✅ Page Speed Insights

**Test Performance:**
1. Go to: https://pagespeed.web.dev/
2. Enter your deployed URL
3. Review both Mobile and Desktop scores

**Key Metrics to Monitor:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.8s

### ✅ AI Crawler Testing

**Test with curl (simulate crawlers):**
```bash
# Simulate GPTBot
curl -A "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)" \
  http://localhost:3000 | grep -E '<title|application/ld\+json'

# Simulate PerplexityBot
curl -A "PerplexityBot" http://localhost:3000/api/public | jq '.'
```

### ✅ Hidden SEO Content

**Verify screen-reader content is present:**
```bash
curl http://localhost:3000 | grep -A5 'sr-only'
```

Should find:
- H1: "India Income Tax Calculator - CTC to In-Hand Salary Converter"
- Detailed paragraphs about features
- Keyword-rich descriptions

### ✅ Canonical URLs

**Check canonical tags:**
```bash
curl http://localhost:3000 | grep 'rel="canonical"'
```

Should point to your production domain (from `NEXT_PUBLIC_SITE_URL`).

## Production Deployment Checklist

Before deploying to production:

- [ ] Update `NEXT_PUBLIC_SITE_URL` in production environment
- [ ] Verify all OG images generate correctly
- [ ] Test `/api/public` endpoint
- [ ] Submit sitemap to Google Search Console
- [ ] Submit sitemap to Bing Webmaster Tools
- [ ] Verify robots.txt is accessible
- [ ] Test structured data with Google Rich Results Test
- [ ] Run Lighthouse audit
- [ ] Test social media previews (Facebook, Twitter, LinkedIn)
- [ ] Monitor Core Web Vitals in Search Console
- [ ] Set up analytics (GA4, Plausible, etc.)

## Monitoring URLs

After deployment, monitor these in search consoles:

- Homepage: `/`
- Assessment years: `/ay/2026-27`, `/ay/2025-26`, etc.
- API endpoints: `/api/public`, `/api/og`
- Sitemap: `/sitemap.xml`
- Robots: `/robots.txt`

## Common Issues & Fixes

### Issue: OG images not showing
**Solution:** 
- Check `NEXT_PUBLIC_SITE_URL` is set correctly
- Verify `/api/og` returns 200 status
- Use absolute URLs in meta tags

### Issue: Structured data errors
**Solution:**
- Validate JSON-LD with schema.org validator
- Check for proper escaping in strings
- Ensure all required properties are present

### Issue: Sitemap not updating
**Solution:**
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`
- Check dynamic routes are being generated

### Issue: Low Lighthouse scores
**Solution:**
- Optimize images (use Next.js Image component)
- Enable caching headers
- Minimize JavaScript bundle
- Use font-display: swap

## Additional Tools

- **Screaming Frog SEO Spider:** Desktop crawler for comprehensive audit
- **Ahrefs Webmaster Tools:** Free SEO analysis
- **SEMrush Site Audit:** Technical SEO checker
- **GTmetrix:** Performance and SEO analysis

## Questions or Issues?

Refer to `SEO_IMPLEMENTATION.md` for detailed documentation of all implemented features.
