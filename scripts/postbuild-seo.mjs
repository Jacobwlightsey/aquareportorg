/**
 * Post-build SEO script — generates sitemap.xml, rss.xml, llms.txt,
 * and injects per-route HTML (visible inside <div id="root">) plus
 * correct <head> meta tags for each public page.
 *
 * Why: AquaReport is an SPA (React + Vite on Cloudflare Pages). Without
 * pre-rendered HTML, crawlers (Googlebot, GPTBot, PerplexityBot, ClaudeBot)
 * see an empty <div id="root"></div>. This script creates per-route
 * index.html files with:
 *   1. Correct <title>, <meta description>, <link canonical> in <head>
 *   2. Visible page content inside <div id="root"> (React replaces on mount)
 *   3. Per-page structured data (LD+JSON)
 *
 * No hidden divs, no aria-hidden tricks, no cloaking risk.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "../dist");
const SITE = "https://aquareport.org";
const NOW = new Date().toISOString().split("T")[0];

// ─── Static routes ───────────────────────────────────────────────
const staticRoutes = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/blog", priority: "0.8", changefreq: "weekly" },
  { path: "/water-quality", priority: "0.8", changefreq: "weekly" },
  { path: "/learn", priority: "0.8", changefreq: "monthly" },
  { path: "/about/jacob-lightsey", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  // Pillar pages
  { path: "/water-treatment-dealer-software", priority: "0.9", changefreq: "monthly" },
  { path: "/water-quality-report-software", priority: "0.9", changefreq: "monthly" },
  { path: "/digital-water-test-reports", priority: "0.9", changefreq: "monthly" },
  { path: "/water-testing-software-for-dealers", priority: "0.9", changefreq: "monthly" },
  // Comparison page
  { path: "/best-water-treatment-dealer-software", priority: "0.8", changefreq: "monthly" },
];

// ─── Extract blog data from blogData.ts ──────────────────────────
function extractBlogEntries() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/blogData.ts"), "utf-8");
    const entries = [];
    const blocks = src.split(/\n  \{/).slice(1);

    for (const block of blocks) {
      const slugMatch = block.match(/slug:\s*["']([^"']+)["']/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];
      const titleMatch = block.match(/title:\s*["']([^"']+)["']/);
      const descMatch = block.match(/description:\s*\n?\s*["']([\s\S]*?)["'],/);
      const dateModMatch = block.match(/dateModified:\s*["']([^"']+)["']/);
      const datePubMatch = block.match(/datePublished:\s*["']([^"']+)["']/);
      const imageMatch = block.match(/headerImage:\s*["']([^"']+)["']/);
      const keywordMatch = block.match(/primaryKeyword:\s*["']([^"']+)["']/);

      entries.push({
        slug,
        title: titleMatch?.[1] || slug.replace(/-/g, " "),
        description: (descMatch?.[1] || "").replace(/\s+/g, " ").trim(),
        dateModified: dateModMatch?.[1] || NOW,
        datePublished: datePubMatch?.[1] || NOW,
        headerImage: imageMatch?.[1] || null,
        primaryKeyword: keywordMatch?.[1] || "",
      });
    }
    return entries;
  } catch (err) {
    console.warn("⚠️  Failed to extract blog data:", err.message);
    return [];
  }
}

// ─── Extract city data from cityData.ts ──────────────────────────
function extractCityEntries() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/cityData.ts"), "utf-8");
    const slugs = [...src.matchAll(/slug:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const names = [...src.matchAll(/name:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    const states = [...src.matchAll(/state:\s*["']([^"']+)["']/g)].map((m) => m[1]);
    return slugs.map((slug, i) => ({
      slug,
      name: names[i] || slug.replace(/-/g, " "),
      state: states[i] || "",
    }));
  } catch {
    return [];
  }
}

// ─── Extract pillar data ─────────────────────────────────────────
function extractPillarEntries() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/pillarData.ts"), "utf-8");
    const entries = [];
    const blocks = src.split(/\n  \{/).slice(1);

    for (const block of blocks) {
      const slugMatch = block.match(/slug:\s*["']([^"']+)["']/);
      if (!slugMatch) continue;
      const titleMatch = block.match(/title:\s*["']([^"']+)["']/);
      const descMatch = block.match(/description:\s*\n?\s*["']([\s\S]*?)["'],/);

      entries.push({
        slug: slugMatch[1],
        title: titleMatch?.[1] || slugMatch[1].replace(/-/g, " "),
        description: (descMatch?.[1] || "").replace(/\s+/g, " ").trim(),
      });
    }
    return entries;
  } catch {
    return [];
  }
}

// ─── XML helpers ─────────────────────────────────────────────────
function escXml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Build sitemap XML ──────────────────────────────────────────
function buildSitemap() {
  const blogs = extractBlogEntries();
  const cities = extractCityEntries();

  const urls = [
    ...staticRoutes.map(
      (r) =>
        `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
    ),
    ...blogs.map((b) => {
      let entry = `  <url>\n    <loc>${SITE}/blog/${b.slug}</loc>\n    <lastmod>${b.dateModified}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>`;
      if (b.headerImage) {
        entry += `\n    <image:image>\n      <image:loc>${SITE}${b.headerImage}</image:loc>\n      <image:title>${escXml(b.title)}</image:title>\n    </image:image>`;
      }
      entry += `\n  </url>`;
      return entry;
    }),
    ...cities.map(
      (c) =>
        `  <url>\n    <loc>${SITE}/water-quality/${c.slug}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
}

// ─── Build RSS feed ─────────────────────────────────────────────
function buildRSS() {
  const blogs = extractBlogEntries();
  const sorted = [...blogs]
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
    .slice(0, 20);

  const items = sorted
    .map(
      (b) =>
        `    <item>
      <title>${escXml(b.title)}</title>
      <link>${SITE}/blog/${b.slug}</link>
      <guid isPermaLink="true">${SITE}/blog/${b.slug}</guid>
      <description>${escXml(b.description)}</description>
      <pubDate>${new Date(b.datePublished + "T12:00:00Z").toUTCString()}</pubDate>
      <author>support@aquareport.org (Jacob Lightsey)</author>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AquaReport Blog</title>
    <link>${SITE}/blog</link>
    <description>Water quality insights for water treatment dealers and homeowners — contaminant guides, filtration advice, and industry best practices.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

// ─── Build llms.txt ─────────────────────────────────────────────
function buildLlmsTxt() {
  const blogs = extractBlogEntries();
  const pillars = extractPillarEntries();

  const blogList = blogs
    .slice(0, 30)
    .map((b) => `- [${b.title}](${SITE}/blog/${b.slug}): ${b.description.slice(0, 120)}`)
    .join("\n");

  const pillarList = pillars
    .map((p) => `- [${p.title}](${SITE}/${p.slug}): ${p.description.slice(0, 120)}`)
    .join("\n");

  return `# AquaReport

> The sales operating system for water treatment dealers.

AquaReport helps water treatment dealers create professional water quality reports, run interactive in-home sales demos, and manage their customer pipeline — all from one platform.

## Key Facts
- Website: https://aquareport.org
- Consumer portal: https://myaquareport.com
- Founded: 2025 by Jacob Lightsey
- Available in: United States and Canada
- Category: B2B SaaS — Water Treatment Industry

## Core Features
- **AquaScore™ Water Quality Grading**: Proprietary 1-100 scoring system that turns complex EPA contaminant data into a single score homeowners understand instantly.
- **21-Step Demo Wizard**: An interactive, psychology-driven sales presentation tool designed for in-home water consultations. Walks reps through water data, live testing, score reveals, and solution recommendations.
- **Professional Water Quality Reports**: Branded, digital reports with contaminant breakdowns, EPA comparisons, and filtration recommendations. Shareable via link.
- **Consumer Report Portal (myaquareport.com)**: Homeowners receive their report on a branded consumer-facing page.
- **Real-Time EPA & Health Canada Data**: Pulls live contaminant data by ZIP code or postal code from EPA, EWG, and Health Canada databases.
- **CRM & Lead Management**: Track leads, appointments, proposals, commissions, and follow-ups.
- **AI Sales Tools**: AI-generated talking points, homeowner summaries, and objection handling.
- **Team Management**: Multi-user support with role-based access for sales organizations.

## Pricing
- **Starter**: $199/month — 20 reports/mo, 2 team members
- **Growth**: $349/month — 50 reports/mo, 5 team members, Demo Wizard, AI summaries
- **Pro**: $599/month — 150+ reports/mo, 15 team members, white-label branding
- **Enterprise**: Custom pricing — unlimited reports, dedicated support
- **Free Trial**: 1 free premium report with all features unlocked

## Key Pages
${pillarList}
- [Best Water Treatment Dealer Software — 2025 Comparison](${SITE}/best-water-treatment-dealer-software): Compare AquaReport vs ServiceTitan vs Salesforce vs HubSpot vs Jobber for water dealers.

## Blog (Top Articles)
${blogList}

## Contact
- Email: support@aquareport.org
- Signup: https://aquareport.org/signup

## For More Detail
See the full version: https://aquareport.org/llms-full.txt
`;
}

function buildLlmsFullTxt() {
  const blogs = extractBlogEntries();
  const pillars = extractPillarEntries();
  const cities = extractCityEntries();

  const blogList = blogs
    .map((b) => `- [${b.title}](${SITE}/blog/${b.slug}): ${b.description}`)
    .join("\n");

  const pillarList = pillars
    .map((p) => `- [${p.title}](${SITE}/${p.slug}): ${p.description}`)
    .join("\n");

  const cityList = cities
    .map((c) => `- [Water Quality in ${c.name}, ${c.state}](${SITE}/water-quality/${c.slug})`)
    .join("\n");

  return `# AquaReport — Full Product Reference

> The sales operating system for water treatment dealers.

## Company Overview
AquaReport is a B2B SaaS platform built specifically for water treatment dealers and water quality professionals. Founded in 2025 by Jacob Lightsey, AquaReport provides everything a water dealer needs to present professional water quality data, run compelling in-home sales demos, and manage their customer pipeline.

The platform serves dealers in the United States and Canada, pulling real-time contaminant data from EPA, EWG, and Health Canada databases.

**Website:** https://aquareport.org
**Consumer Portal:** https://myaquareport.com
**Support:** support@aquareport.org

## Problem We Solve
Most water treatment dealers still rely on handwritten test results, paper forms, and generic CRMs. This leads to:
- Unprofessional presentations that lose sales
- No way to visualize complex water data for homeowners
- Lost leads and missed follow-ups
- No data-driven approach to selling filtration systems

AquaReport replaces paper forms, spreadsheets, and generic tools with a purpose-built platform for the water treatment industry.

## Core Features

### AquaScore™ Water Quality Grading
A proprietary 1–100 scoring system that transforms complex EPA contaminant data into a single, intuitive score. Higher scores mean cleaner water. The algorithm considers legal limits, health guidelines, and contaminant severity with tiered penalty weights.

### 21-Step Demo Wizard
The flagship sales tool — an interactive, psychology-driven presentation designed for in-home water consultations. The wizard guides sales reps through:
1. Customer greeting and setup
2. Local water data presentation (pulled live by ZIP/postal code)
3. Contaminant education with visual breakdowns
4. Live water test results entry and instant scoring
5. Before/after score comparison with filtration
6. Solution recommendation and pricing
7. Proposal generation and closing

Each step is designed around proven sales psychology — building concern, demonstrating value, and closing with data.

### Professional Water Quality Reports
Branded digital reports featuring:
- Overall AquaScore™ with color-coded grading
- Contaminant-by-contaminant breakdown vs. EPA legal limits and health guidelines
- Filtration recommendations per contaminant
- Interactive flipbook format for sharing
- Company branding (logo, colors, contact info)
- QR code linking to the consumer portal

### Consumer Report Portal (myaquareport.com)
Homeowners receive their water quality report on a branded, consumer-friendly page. No login required — just a shareable link. This reinforces the dealer's professionalism and gives homeowners a reference they can share with family.

### Real-Time Water Data
- US: EPA SDWIS + EWG Tap Water Database by ZIP code
- Canada: Health Canada guidelines by postal code
- Covers 100+ contaminants with legal limits, health guidelines, and detected levels

### CRM & Lead Management
- Lead tracking with customizable pipeline stages
- Appointment scheduling and calendar integration
- Proposal generation with auto-pricing
- Commission tracking for sales teams
- Automated follow-up reminders
- Retention and review request campaigns

### AI-Powered Sales Tools
- AI-generated homeowner summaries (plain-language water quality explanation)
- Sales talking points tailored to specific water issues
- Objection handling suggestions
- Rep coaching insights

### Team Management
- Multi-user accounts with role-based access (Owner, Manager, Rep)
- Team performance analytics
- Territory mapping with Google Maps integration
- Centralized company branding and settings

## Pricing Plans

| Plan | Monthly Price | Reports/mo | Team Members | Key Features |
|------|--------------|------------|--------------|--------------|
| Starter | $199 | 20 | 2 | Branded reports, AquaScore, lead capture |
| Growth | $349 | 50 | 5 | + Demo Wizard, live testing, AI summaries |
| Pro | $599 | 150+ | 15 | + White-label, AI sales tools, territory intel |
| Enterprise | Custom | Unlimited | Unlimited | + Dedicated support, custom integrations |

**Free Trial:** 1 free premium report with all features unlocked. No credit card required.

## Pillar Pages (Authority Content)
${pillarList}

## Blog Articles
${blogList}

## City Water Quality Pages
${cityList}

## Technical Details
- Frontend: React (SPA on Cloudflare Pages)
- Backend: Convex (real-time serverless database)
- Data sources: EPA SDWIS, EWG, Health Canada
- Authentication: Email/password
- Payments: Stripe
- Available via web browser (desktop and mobile responsive)
`;
}

// ─── Per-route HTML injection (visible, not hidden) ──────────────
// Puts content inside <div id="root">...</div> so crawlers see it
// immediately. React's createRoot replaces this on hydration.
function injectSEOContent() {
  const indexPath = resolve(DIST, "index.html");
  if (!existsSync(indexPath)) {
    console.warn("⚠️  dist/index.html not found — skipping content injection");
    return 0;
  }

  const indexHtml = readFileSync(indexPath, "utf-8");
  const blogs = extractBlogEntries();
  const cities = extractCityEntries();
  const pillars = extractPillarEntries();
  let injected = 0;

  /**
   * Create a route-specific HTML file with:
   * 1. Correct <title> in <head>
   * 2. <meta name="description"> with route-specific description
   * 3. <link rel="canonical"> pointing to this page
   * 4. <meta name="robots" content="index, follow">
   * 5. Visible content inside <div id="root">
   * 6. Optional structured data (LD+JSON)
   */
  function writeRouteHtml(routePath, { title, description, content, schema }) {
    let html = indexHtml;

    // Inject <meta description>, <link canonical>, <meta robots> before </head>
    const headInjection = [
      `<meta name="description" content="${escHtml(description)}" />`,
      `<link rel="canonical" href="${SITE}${routePath === "/" ? "" : routePath}" />`,
      `<meta name="robots" content="index, follow" />`,
    ].join("\n    ");
    html = html.replace("</head>", `    ${headInjection}\n  </head>`);

    // Replace <title>
    const fullTitle = title
      ? `${title} | AquaReport`
      : "AquaReport | Water Quality Report Software for Dealers";
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${escHtml(fullTitle)}</title>`,
    );

    // Update OG tags
    html = html.replace(
      /(<meta property="og:title" content=").*?(")/,
      `$1${escHtml(fullTitle)}$2`,
    );
    html = html.replace(
      /(<meta property="og:description"\s*content=")[\s\S]*?(")/,
      `$1${escHtml(description)}$2`,
    );
    html = html.replace(
      /(<meta property="og:url" content=").*?(")/,
      `$1${SITE}${routePath}$2`,
    );

    // Update Twitter tags
    html = html.replace(
      /(<meta name="twitter:title" content=").*?(")/,
      `$1${escHtml(fullTitle)}$2`,
    );
    html = html.replace(
      /(<meta name="twitter:description"\s*content=")[\s\S]*?(")/,
      `$1${escHtml(description)}$2`,
    );

    // Inject visible content inside <div id="root">
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root">${content}</div>`,
    );

    // Inject structured data if provided
    if (schema) {
      const schemaTag = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
      html = html.replace("</head>", `    ${schemaTag}\n  </head>`);
    }

    // Write to the correct path
    const dir = resolve(DIST, routePath.replace(/^\//, ""));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), html);
    injected++;
  }

  // ── Homepage (no subdirectory needed, already at dist/index.html)
  // We update the root index.html in place
  {
    const homeContent = `<header><h1>AquaReport — The Sales Operating System for Water Treatment Dealers</h1><p>21-step Demo Wizard for water treatment dealers. Real water data, live testing, AquaScore™ water grading, and built-in rep coaching — designed to help dealers close more in-home consultations.</p></header><nav><a href="/blog">Blog</a> <a href="/water-treatment-dealer-software">Water Treatment Dealer Software</a> <a href="/water-quality-report-software">Water Quality Report Software</a> <a href="/signup">Start Free Trial</a></nav>`;
    let homeHtml = indexHtml;
    const headInj = [
      `<meta name="description" content="21-step Demo Wizard for water treatment dealers. Real water data, live testing, AquaScore™ water grading, and built-in rep coaching — designed to help dealers close more in-home consultations." />`,
      `<link rel="canonical" href="${SITE}/" />`,
      `<meta name="robots" content="index, follow" />`,
    ].join("\n    ");
    homeHtml = homeHtml.replace("</head>", `    ${headInj}\n  </head>`);
    homeHtml = homeHtml.replace(
      '<div id="root"></div>',
      `<div id="root">${homeContent}</div>`,
    );
    writeFileSync(indexPath, homeHtml);
    console.log("  ✓ / (homepage)");
  }

  // ── Blog index
  writeRouteHtml("/blog", {
    title: "Water Quality Blog for Dealers & Homeowners",
    description:
      "Expert guides on water quality, contaminants, filtration, and water treatment business strategies from AquaReport.",
    content: `<main><h1>AquaReport Blog</h1><p>Water quality insights for water treatment dealers and homeowners. Expert guides on contaminants, filtration, in-home sales, and dealer business growth.</p><ul>${blogs.slice(0, 20).map((b) => `<li><a href="/blog/${b.slug}">${escHtml(b.title)}</a> — ${escHtml(b.description.slice(0, 150))}</li>`).join("")}</ul></main>`,
  });

  // ── Blog articles
  for (const b of blogs) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: b.title,
      description: b.description,
      author: { "@type": "Person", name: "Jacob Lightsey" },
      publisher: {
        "@type": "Organization",
        name: "AquaReport",
        logo: { "@type": "ImageObject", url: `${SITE}/favicon.png` },
      },
      datePublished: b.datePublished,
      dateModified: b.dateModified,
      mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE}/blog/${b.slug}` },
    };

    writeRouteHtml(`/blog/${b.slug}`, {
      title: b.title,
      description: b.description,
      content: `<article><h1>${escHtml(b.title)}</h1><p>${escHtml(b.description)}</p><p>By Jacob Lightsey. Published ${b.datePublished}. Updated ${b.dateModified}.</p><a href="/blog">← Back to Blog</a></article>`,
      schema,
    });
  }

  // ── Pillar pages
  for (const p of pillars) {
    writeRouteHtml(`/${p.slug}`, {
      title: p.title,
      description: p.description,
      content: `<main><h1>${escHtml(p.title)}</h1><p>${escHtml(p.description)}</p><a href="/signup">Start Free Trial →</a></main>`,
    });
  }

  // ── City water pages
  for (const c of cities) {
    const desc = `Detailed water quality data for ${c.name}, ${c.state} including contaminant levels, EPA comparisons, AquaScore™ grading, and treatment recommendations.`;
    writeRouteHtml(`/water-quality/${c.slug}`, {
      title: `Water Quality in ${c.name}, ${c.state}`,
      description: desc,
      content: `<main><h1>Water Quality in ${escHtml(c.name)}, ${escHtml(c.state)}</h1><p>${escHtml(desc)}</p><a href="/water-quality">← All Cities</a></main>`,
    });
  }

  // ── Water quality index
  writeRouteHtml("/water-quality", {
    title: "Water Quality Index — City Water Reports",
    description:
      "Explore water quality data for 50+ US cities. Find contaminant levels, EPA violations, AquaScore™ grading, and treatment recommendations for your area.",
    content: `<main><h1>Water Quality Index</h1><p>Explore water quality data for 50+ US cities with AquaScore™ grading.</p><ul>${cities.map((c) => `<li><a href="/water-quality/${c.slug}">Water Quality in ${escHtml(c.name)}, ${escHtml(c.state)}</a></li>`).join("")}</ul></main>`,
  });

  // ── Learn hub
  writeRouteHtml("/learn", {
    title: "Water Quality Learning Hub",
    description:
      "Expert guides on water quality, contaminants, filtration, and water treatment business strategies from AquaReport.",
    content: `<main><h1>Water Quality Learning Hub</h1><p>Expert guides on water quality, contaminants, filtration, and water treatment business strategies from AquaReport.</p></main>`,
  });

  // ── Author page
  writeRouteHtml("/about/jacob-lightsey", {
    title: "Jacob Lightsey — Founder of AquaReport",
    description:
      "Jacob Lightsey is the founder of AquaReport, the water quality reporting and sales platform built for water treatment dealers.",
    content: `<main><h1>Jacob Lightsey</h1><p>Founder of AquaReport — the sales operating system for water treatment dealers. Building tools that help water dealers present professional water quality data and close more in-home consultations.</p></main>`,
  });

  // ── Privacy
  writeRouteHtml("/privacy", {
    title: "Privacy Policy",
    description:
      "AquaReport privacy policy covering data collection, usage, and your rights as a user of our water quality reporting platform.",
    content: `<main><h1>Privacy Policy</h1><p>AquaReport privacy policy. Learn how we collect, use, and protect your data.</p></main>`,
  });

  // ── Terms
  writeRouteHtml("/terms", {
    title: "Terms of Service",
    description:
      "AquaReport terms of service for water treatment dealers using our water quality reporting and sales platform.",
    content: `<main><h1>Terms of Service</h1><p>AquaReport terms of service. By using our platform, you agree to these terms.</p></main>`,
  });

  // ── Signup
  writeRouteHtml("/signup", {
    title: "Start Your Free Trial",
    description:
      "Sign up for AquaReport — get 1 free premium water quality report with all features unlocked. No credit card required.",
    content: `<main><h1>Start Your Free Trial</h1><p>Create your AquaReport account and generate your first professional water quality report for free. No credit card required.</p></main>`,
  });

  // ── Login
  writeRouteHtml("/login", {
    title: "Sign In",
    description: "Sign in to your AquaReport dealer dashboard.",
    content: `<main><h1>Sign In to AquaReport</h1><p>Access your dealer dashboard, reports, and tools.</p></main>`,
  });

  // ── Comparison page
  writeRouteHtml("/best-water-treatment-dealer-software", {
    title: "Best Water Treatment Dealer Software (2025 Comparison)",
    description:
      "Compare the best water treatment dealer software: AquaReport vs ServiceTitan vs Salesforce vs HubSpot vs Jobber. Feature-by-feature comparison, pricing, and which platform is right for your water business.",
    content: `<main><h1>Best Water Treatment Dealer Software</h1><p>A head-to-head comparison of the top software platforms water treatment dealers actually use — from purpose-built water tools to general CRMs.</p><h2>Platforms Compared</h2><ul><li><strong>AquaReport</strong> — Purpose-built for water treatment dealers. AquaScore™ scoring, 21-step Demo Wizard, EPA data, branded reports. From $199/mo.</li><li><strong>ServiceTitan</strong> — General home services software for HVAC, plumbing, electrical. No water-specific features. Custom pricing.</li><li><strong>Salesforce</strong> — Enterprise CRM platform. Infinitely customizable but requires extensive setup. From $25/user/mo.</li><li><strong>HubSpot CRM</strong> — Marketing-focused CRM with free tier. No water industry features. Free to $1,200+/mo.</li><li><strong>Jobber</strong> — Field service management for small businesses. No water-specific reporting. From $49/mo.</li></ul><h2>Key Differentiator</h2><p>AquaReport is the only platform built exclusively for water treatment dealers — with real-time EPA data, proprietary water quality scoring, branded reports, a 21-step sales demo wizard, and a consumer delivery portal.</p><h2>FAQ</h2><dl><dt>Is AquaReport only for water treatment dealers?</dt><dd>Yes — every feature is designed around the water dealer workflow.</dd><dt>How does AquaReport compare to ServiceTitan for water dealers?</dt><dd>ServiceTitan excels at dispatch and scheduling but has no water-specific features. AquaReport provides water quality scoring, EPA data, branded reports, and an in-home demo wizard.</dd><dt>What makes AquaScore™ different?</dt><dd>AquaScore™ is a proprietary 1-100 scoring algorithm that considers EPA MCLs, EWG health guidelines, and contaminant severity to produce a single score homeowners understand instantly.</dd></dl><a href="/signup">Try AquaReport Free →</a></main>`,
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is AquaReport only for water treatment dealers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes — AquaReport is purpose-built for water treatment dealers, water quality professionals, and water testing companies. Every feature is designed around the water dealer workflow.",
          },
        },
        {
          "@type": "Question",
          name: "How does AquaReport compare to ServiceTitan for water dealers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ServiceTitan is excellent for large home service companies but has no water-specific features. AquaReport fills that gap with water quality scoring, EPA data integration, branded water reports, and an in-home demo wizard.",
          },
        },
        {
          "@type": "Question",
          name: "What makes AquaScore™ different from just showing test results?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AquaScore™ is a proprietary 1-100 scoring algorithm that considers legal limits (EPA MCLs), health guidelines (EWG standards), and contaminant severity to produce a single score homeowners understand instantly.",
          },
        },
      ],
    },
  });

  return injected;
}

// ─── Write all files ─────────────────────────────────────────────
try {
  const sitemap = buildSitemap();
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemap);
  console.log(
    `✅ Generated sitemap.xml (${sitemap.split("<url>").length - 1} URLs)`,
  );

  const rss = buildRSS();
  writeFileSync(resolve(DIST, "rss.xml"), rss);
  console.log("✅ Generated rss.xml");

  const llmsTxt = buildLlmsTxt();
  writeFileSync(resolve(DIST, "llms.txt"), llmsTxt);
  console.log("✅ Generated llms.txt");

  const llmsFullTxt = buildLlmsFullTxt();
  writeFileSync(resolve(DIST, "llms-full.txt"), llmsFullTxt);
  console.log("✅ Generated llms-full.txt");

  const injectedCount = injectSEOContent();
  console.log(
    `✅ Injected SEO content into ${injectedCount} route HTML files`,
  );
} catch (err) {
  console.error("⚠️  postbuild-seo error:", err.message);
}
