/**
 * Post-build SEO script — generates sitemap.xml, rss.xml, and injects
 * static HTML content into index.html for Googlebot.
 *
 * This is critical because AquaReport is an SPA (React + Vite). Without
 * injecting content into the HTML, search engines must render JS to see
 * page content, which delays indexing.
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
];

// ─── Extract blog data from blogData.ts (slug, title, description, dateModified, headerImage) ──
function extractBlogEntries() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/blogData.ts"), "utf-8");

    // Split by object boundaries — each blog entry starts with "  {"
    // and ends with "  }," or "  }]"
    const entries = [];

    // Use a regex that captures each blog object block
    // Match blocks between { ... } that contain slug:
    const blocks = src.split(/\n  \{/).slice(1); // Skip the first split (before first {)

    for (const block of blocks) {
      const slugMatch = block.match(/slug:\s*["']([^"']+)["']/);
      if (!slugMatch) continue;
      const slug = slugMatch[1];

      // Title: single line
      const titleMatch = block.match(/title:\s*["']([^"']+)["']/);

      // Description: may span multiple lines (key:\n      "value")
      const descMatch = block.match(/description:\s*\n?\s*["']([\s\S]*?)["'],/);

      // Dates: always single line
      const dateModMatch = block.match(/dateModified:\s*["']([^"']+)["']/);
      const datePubMatch = block.match(/datePublished:\s*["']([^"']+)["']/);

      // Image: single line, optional
      const imageMatch = block.match(/headerImage:\s*["']([^"']+)["']/);

      entries.push({
        slug,
        title: titleMatch?.[1] || slug.replace(/-/g, " "),
        description: (descMatch?.[1] || "").replace(/\s+/g, " ").trim(),
        dateModified: dateModMatch?.[1] || NOW,
        datePublished: datePubMatch?.[1] || NOW,
        headerImage: imageMatch?.[1] || null,
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

// ─── Escape XML special characters ───────────────────────────────
function escXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ─── Build sitemap XML (with per-article lastmod + images) ───────
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

// ─── Build RSS feed (with titles, descriptions, dates) ───────────
function buildRSS() {
  const blogs = extractBlogEntries();
  // Sort by datePublished descending, take top 20
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

// ─── Inject SEO content into static HTML ─────────────────────────
// For each content route, we create a hidden <div id="seo-content">
// inside index.html with the page's text content. This lets Googlebot
// read the content immediately without executing JavaScript.
function injectSEOContent() {
  const indexPath = resolve(DIST, "index.html");
  if (!existsSync(indexPath)) {
    console.warn("⚠️  dist/index.html not found — skipping content injection");
    return 0;
  }

  const indexHtml = readFileSync(indexPath, "utf-8");
  const blogs = extractBlogEntries();
  const cities = extractCityEntries();
  let injected = 0;

  // Helper: create a route-specific HTML file with SEO content injected
  function writeRouteHtml(routePath, seoContent) {
    // Inject a hidden div before </body> with the static content
    const seoDiv = `<div id="seo-content" style="position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">${seoContent}</div>`;
    const injectedHtml = indexHtml.replace("</body>", `${seoDiv}\n</body>`);

    // Write to the correct path (e.g., /blog/slug/index.html)
    const dir = resolve(DIST, routePath.replace(/^\//, ""));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "index.html"), injectedHtml);
    injected++;
  }

  // Blog articles
  for (const b of blogs) {
    const seoHtml = `<article><h1>${escXml(b.title)}</h1><p>${escXml(b.description)}</p><p>By Jacob Lightsey. Published ${b.datePublished}. Updated ${b.dateModified}.</p></article>`;
    writeRouteHtml(`/blog/${b.slug}`, seoHtml);
  }

  // City water pages
  for (const c of cities) {
    const seoHtml = `<article><h1>Water Quality in ${escXml(c.name)}, ${escXml(c.state)}</h1><p>Detailed water quality data for ${escXml(c.name)}, ${escXml(c.state)} including contaminant levels, EPA violations, and treatment recommendations from AquaReport.</p></article>`;
    writeRouteHtml(`/water-quality/${c.slug}`, seoHtml);
  }

  // Static content pages
  const staticContent = {
    "/learn": `<div><h1>Water Quality Learning Hub</h1><p>Expert guides on water quality, contaminants, filtration, and water treatment business strategies from AquaReport.</p></div>`,
    "/about/jacob-lightsey": `<div><h1>Jacob Lightsey — Founder of AquaReport</h1><p>Jacob Lightsey is the founder and developer of AquaReport, the water quality reporting platform built for water treatment dealers.</p></div>`,
    "/privacy": `<div><h1>Privacy Policy</h1><p>AquaReport privacy policy covering data collection, tracking, Facebook integration, CCPA compliance, and data processor responsibilities.</p></div>`,
    "/terms": `<div><h1>Terms of Service</h1><p>AquaReport terms of service for water treatment dealers using the platform, covering data processing, dealer responsibilities, and acceptable use.</p></div>`,
    "/water-quality": `<div><h1>Water Quality Index — City Water Reports</h1><p>Explore water quality data for 50+ US cities. Find contaminant levels, EPA violations, and treatment recommendations for your area.</p></div>`,
    "/blog": `<div><h1>AquaReport Blog</h1><p>Water quality insights for water treatment dealers and homeowners. Expert guides on contaminants, filtration, in-home sales, and dealer business growth.</p></div>`,
  };

  for (const [route, content] of Object.entries(staticContent)) {
    writeRouteHtml(route, content);
  }

  return injected;
}

// ─── Write files ─────────────────────────────────────────────────
try {
  const sitemap = buildSitemap();
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemap);
  console.log(`✅ Generated sitemap.xml (${sitemap.split("<url>").length - 1} URLs)`);

  const rss = buildRSS();
  writeFileSync(resolve(DIST, "rss.xml"), rss);
  console.log("✅ Generated rss.xml");

  const injectedCount = injectSEOContent();
  console.log(`✅ Injected SEO content into ${injectedCount} route HTML files`);
} catch (err) {
  console.error("⚠️  postbuild-seo error:", err.message);
}
