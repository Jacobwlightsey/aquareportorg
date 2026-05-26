/**
 * Post-build SEO script — auto-generates sitemap.xml and injects meta into index.html
 * Dynamically reads city data and blog data to build complete sitemap.
 */
import { readFileSync, writeFileSync, readdirSync } from "fs";
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
  { path: "/in-home-water-testing", priority: "0.9", changefreq: "monthly" },
];

// ─── Extract blog slugs from blogData.ts ─────────────────────────
function extractBlogSlugs() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/blogData.ts"), "utf-8");
    const matches = [...src.matchAll(/slug:\s*["']([^"']+)["']/g)];
    return matches.map((m) => m[1]);
  } catch {
    return [];
  }
}

// ─── Extract city slugs from cityData.ts ─────────────────────────
function extractCitySlugs() {
  try {
    const src = readFileSync(resolve(__dirname, "../src/lib/cityData.ts"), "utf-8");
    const matches = [...src.matchAll(/slug:\s*["']([^"']+)["']/g)];
    return matches.map((m) => m[1]);
  } catch {
    return [];
  }
}

// ─── Build sitemap XML ───────────────────────────────────────────
function buildSitemap() {
  const blogSlugs = extractBlogSlugs();
  const citySlugs = extractCitySlugs();

  const urls = [
    ...staticRoutes.map(
      (r) =>
        `  <url>\n    <loc>${SITE}${r.path}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`,
    ),
    ...blogSlugs.map(
      (slug) =>
        `  <url>\n    <loc>${SITE}/blog/${slug}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
    ...citySlugs.map(
      (slug) =>
        `  <url>\n    <loc>${SITE}/water-quality/${slug}</loc>\n    <lastmod>${NOW}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

// ─── Build RSS feed ──────────────────────────────────────────────
function buildRSS() {
  const blogSlugs = extractBlogSlugs();
  const items = blogSlugs
    .slice(0, 20)
    .map(
      (slug) =>
        `    <item>\n      <title>${slug.replace(/-/g, " ")}</title>\n      <link>${SITE}/blog/${slug}</link>\n      <guid>${SITE}/blog/${slug}</guid>\n    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AquaReport Blog</title>
    <link>${SITE}/blog</link>
    <description>Water quality insights for dealers and homeowners</description>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

// ─── Write files ─────────────────────────────────────────────────
try {
  const sitemap = buildSitemap();
  writeFileSync(resolve(DIST, "sitemap.xml"), sitemap);
  console.log(`✅ Generated sitemap.xml (${sitemap.split("<url>").length - 1} URLs)`);

  const rss = buildRSS();
  writeFileSync(resolve(DIST, "rss.xml"), rss);
  console.log("✅ Generated rss.xml");
} catch (err) {
  console.error("⚠️  postbuild-seo error:", err.message);
}
