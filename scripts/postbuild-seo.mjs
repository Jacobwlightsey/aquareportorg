/**
 * Post-build SEO script
 * Generates route-specific index.html files with unique meta tags
 * so crawlers get correct title/description/OG without needing JS rendering.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";

const DIST = "dist";
const BASE_URL = "https://aquareport.org";

// Read the base index.html template
const baseHtml = readFileSync(join(DIST, "index.html"), "utf-8");

// Blog posts data (extracted from blogData.ts)
const blogPosts = [
  { slug: "water-quality-report-software-guide", title: "Water Quality Report Software: The Complete Guide for Dealers", description: "Everything water treatment dealers need to know about water quality report software. Compare features, pricing, and find the right platform for your business." },
  { slug: "create-professional-water-test-reports", title: "How to Create Professional Water Test Reports That Close Deals", description: "Step-by-step guide to creating professional water quality reports that impress homeowners and help close more water treatment sales." },
  { slug: "best-water-testing-software-small-dealers", title: "Best Water Testing Software for Small Dealers in 2025", description: "Compare the top water testing software options for small water treatment dealers. Features, pricing, and recommendations for growing businesses." },
  { slug: "white-label-water-quality-reports", title: "White Label Water Quality Reports: Build Your Brand", description: "How white-label water quality reports help dealers build brand recognition and professional credibility with every customer interaction." },
  { slug: "grow-water-treatment-business", title: "10 Proven Strategies to Grow Your Water Treatment Business", description: "Actionable strategies for water treatment dealers to attract more customers, close more sales, and scale their business with technology." },
  { slug: "water-treatment-dealer-software", title: "Water Treatment Dealer Software: Everything You Need", description: "Complete guide to software solutions for water treatment dealers. CRM, reporting, scheduling, and sales tools to run your business efficiently." },
  { slug: "sell-more-water-softeners-reports", title: "How Professional Reports Help You Sell More Water Softeners", description: "Learn how data-driven water quality reports dramatically increase water softener sales by showing homeowners exactly what's in their water." },
  { slug: "digital-vs-paper-water-test-reports", title: "Digital vs Paper Water Test Reports: Why Dealers Are Switching", description: "Compare digital and paper water test reports. See why top water treatment dealers are switching to digital reporting platforms." },
  { slug: "water-dealer-lead-generation", title: "Water Treatment Dealer Lead Generation: Modern Strategies", description: "Modern lead generation strategies for water treatment dealers. Use technology, content, and data to attract and convert more prospects." },
  { slug: "present-water-test-results-customers", title: "How to Present Water Test Results to Customers Effectively", description: "Master the art of presenting water test results to homeowners. Use data visualization and storytelling to educate and convert." },
  { slug: "water-treatment-crm-software", title: "Water Treatment CRM Software: Managing Customer Relationships", description: "How CRM software designed for water treatment dealers helps manage leads, track customer interactions, and grow recurring revenue." },
  { slug: "automated-water-test-reports", title: "Automated Water Test Reports: Save Time, Close More Deals", description: "How automated water quality report generation saves dealers hours per week while producing more professional, consistent customer reports." },
  { slug: "water-quality-scoring-system", title: "Water Quality Scoring Systems: Making Data Accessible", description: "How water quality scoring systems like AquaScore make complex contaminant data instantly understandable for homeowners and sales teams." },
  { slug: "water-treatment-business-marketing", title: "Water Treatment Business Marketing: Digital Strategies That Work", description: "Effective digital marketing strategies for water treatment businesses. SEO, content, social media, and local marketing tactics." },
  { slug: "roi-professional-water-quality-reports", title: "The ROI of Professional Water Quality Reports for Dealers", description: "Calculate the return on investment of professional water quality reporting software. See how top dealers are increasing revenue per appointment." },
];

// Pillar pages
const pillarPages = [
  { route: "/water-treatment-dealer-software", title: "Water Treatment Dealer Software", description: "AquaReport is the all-in-one software platform for water treatment dealers. Create professional water quality reports, manage customers, and close more sales with data-driven tools built for your workflow." },
  { route: "/water-quality-report-software", title: "Water Quality Report Software", description: "Generate professional, branded water quality reports in minutes. AquaReport turns raw test data into polished customer reports with AquaScore™ ratings, EPA comparisons, and shareable digital links." },
  { route: "/digital-water-test-reports", title: "Digital Water Test Reports", description: "Replace paper water test forms with professional digital reports. AquaReport helps water treatment dealers create, share, and track digital water quality reports from any device." },
  { route: "/water-testing-software-for-dealers", title: "Water Testing Software for Dealers", description: "Streamline your water testing workflow with software built for dealers. AquaReport integrates field testing, report generation, customer management, and sales presentations into one mobile-friendly platform." },
];

// Static pages
const staticPages = [
  {
    route: "/",
    title: "AquaReport — Water Quality Report Software for Dealers",
    description: "AquaReport helps water treatment companies create premium home water quality reports, capture leads, and explain filtration opportunities with clear sales-ready insights.",
  },
  {
    route: "/blog",
    title: "Blog — Water Treatment Industry Guides & Tips",
    description: "Expert guides, tips, and strategies for water treatment dealers. Learn how to create better reports, close more sales, and grow your business with AquaReport.",
  },
  {
    route: "/login",
    title: "Sign In — AquaReport Dealer Portal",
    description: "Sign in to your AquaReport dealer account to manage water quality reports, customer data, and sales tools.",
  },
  {
    route: "/signup",
    title: "Get Started — Create Your AquaReport Account",
    description: "Create your free AquaReport account. Start generating professional water quality reports and closing more water treatment sales today.",
  },
];

function generateHtml(route, title, description, ogImage) {
  const canonical = `${BASE_URL}${route}`;
  const fullTitle = title.includes("AquaReport") ? title : `${title} | AquaReport`;
  const img = ogImage || `${BASE_URL}/og-image.png`;

  let html = baseHtml;

  // Replace title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${fullTitle}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`
  );

  // Add/replace canonical
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`);
  } else {
    html = html.replace("</head>", `    <link rel="canonical" href="${canonical}" />\n  </head>`);
  }

  // Replace OG tags
  html = html.replace(/property="og:title"\s+content="[^"]*"/, `property="og:title" content="${fullTitle}"`);
  html = html.replace(/property="og:description"\s+content="[^"]*"/, `property="og:description" content="${description}"`);
  html = html.replace(/property="og:url"\s+content="[^"]*"/, `property="og:url" content="${canonical}"`);
  html = html.replace(/property="og:image"\s+content="[^"]*"/, `property="og:image" content="${img}"`);

  // Replace Twitter tags
  html = html.replace(/name="twitter:title"\s+content="[^"]*"/, `name="twitter:title" content="${fullTitle}"`);
  html = html.replace(/name="twitter:description"\s+content="[^"]*"/, `name="twitter:description" content="${description}"`);
  html = html.replace(/name="twitter:image"\s+content="[^"]*"/, `name="twitter:image" content="${img}"`);

  return html;
}

// Generate static pages
for (const page of staticPages) {
  const dir = join(DIST, page.route === "/" ? "" : page.route);
  if (page.route !== "/") {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), generateHtml(page.route, page.title, page.description));
    console.log(`✅ ${page.route}/index.html`);
  } else {
    // Overwrite root index.html with correct tags
    writeFileSync(join(DIST, "index.html"), generateHtml("/", page.title, page.description));
    console.log(`✅ / (root index.html)`);
  }
}

// Generate blog post pages
for (const post of blogPosts) {
  const route = `/blog/${post.slug}`;
  const dir = join(DIST, "blog", post.slug);
  const ogImage = `${BASE_URL}/blog/images/${post.slug}.webp`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), generateHtml(route, post.title, post.description, ogImage));
  console.log(`✅ ${route}/index.html`);
}

// Generate pillar pages
for (const page of pillarPages) {
  const dir = join(DIST, page.route.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), generateHtml(page.route, page.title, page.description));
  console.log(`✅ ${page.route}/index.html (pillar)`);
}

console.log(`\n✨ Generated ${staticPages.length + pillarPages.length + blogPosts.length} SEO-optimized HTML files`);
