import { Link, useLocation, Navigate } from "react-router-dom";
import { ArrowRight, CheckCircle, ChevronRight } from "lucide-react";
import { getPillarPage, pillarPages } from "@/lib/pillarData";
import { getBlogPost } from "@/lib/blogData";
import { SEO } from "@/components/SEO";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";

/* ── Markdown renderer (reused from blog) ────────────────────────── */
function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index));
    parts.push(
      <strong key={match.index} className="font-semibold text-white">
        {match[1]}
      </strong>
    );
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts.length ? <>{parts}</> : text;
}

function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  function tryTable(startIdx: number): { el: React.ReactNode; end: number } | null {
    if (!lines[startIdx]?.trim().startsWith("|")) return null;
    const tableLines: string[] = [];
    let idx = startIdx;
    while (idx < lines.length && lines[idx].trim().startsWith("|")) {
      tableLines.push(lines[idx].trim());
      idx++;
    }
    if (tableLines.length < 3) return null;
    const parseRow = (line: string) =>
      line.split("|").slice(1, -1).map((c) => c.trim());
    const headers = parseRow(tableLines[0]);
    const rows = tableLines.slice(2).map(parseRow);
    return {
      el: (
        <div key={`table-${startIdx}`} className="my-6 overflow-x-auto rounded-xl border border-slate-700/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="border-b border-slate-700 bg-slate-800/80 px-4 py-3 text-left font-semibold text-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-slate-800/30" : ""}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border-b border-slate-700/40 px-4 py-3 text-slate-300">
                      {inlineFormat(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
      end: idx,
    };
  }

  function tryList(startIdx: number): { el: React.ReactNode; end: number } | null {
    const first = lines[startIdx]?.trim();
    if (!first) return null;
    const isBullet = first.startsWith("- ");
    const isNumbered = /^\d+\.\s/.test(first);
    if (!isBullet && !isNumbered) return null;
    const items: string[] = [];
    let idx = startIdx;
    while (idx < lines.length) {
      const line = lines[idx]?.trim();
      if (!line) break;
      if (isBullet && line.startsWith("- ")) {
        items.push(line.slice(2));
        idx++;
      } else if (isNumbered && /^\d+\.\s/.test(line)) {
        items.push(line.replace(/^\d+\.\s/, ""));
        idx++;
      } else break;
    }
    if (!items.length) return null;
    const Tag = isBullet ? "ul" : "ol";
    return {
      el: (
        <Tag
          key={`list-${startIdx}`}
          className={`my-4 space-y-2 pl-6 ${isBullet ? "list-disc" : "list-decimal"} text-slate-300 marker:text-cyan-400`}
        >
          {items.map((item, ii) => (
            <li key={ii} className="leading-relaxed pl-1">
              {inlineFormat(item)}
            </li>
          ))}
        </Tag>
      ),
      end: idx,
    };
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    const table = tryTable(i);
    if (table) { elements.push(table.el); i = table.end; continue; }

    const list = tryList(i);
    if (list) { elements.push(list.el); i = list.end; continue; }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="my-6 border-l-4 border-cyan-400/60 bg-slate-800/40 py-4 pl-5 pr-4 text-slate-300 italic rounded-r-lg">
          {inlineFormat(trimmed.slice(2))}
        </blockquote>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={i} className="leading-relaxed text-slate-300">
        {inlineFormat(trimmed)}
      </p>
    );
    i++;
  }

  return <div className="space-y-4">{elements}</div>;
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function PillarPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "").replace(/\/$/, "");
  const page = slug ? getPillarPage(slug) : undefined;

  if (!page) return <Navigate to="/blog" replace />;

  const canonical = `https://aquareport.org/${page.slug}`;

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", url: "https://aquareport.org" },
    { name: page.title, url: canonical },
  ]);

  const faqSch = page.faqs.length
    ? faqSchema(page.faqs.map((f) => ({ question: f.question, answer: f.answer })))
    : null;

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    url: canonical,
    publisher: {
      "@type": "Organization",
      name: "AquaReport",
      url: "https://aquareport.org",
      logo: "https://aquareport.org/aquareport-logo.png",
    },
  };

  const schemas = [breadcrumbs, webPageSchema, ...(faqSch ? [faqSch] : [])];

  // Get related blog posts
  const relatedPosts = page.relatedBlogSlugs
    .map((s) => getBlogPost(s))
    .filter(Boolean);

  // Other pillar pages (for cross-linking)
  const otherPillars = pillarPages.filter((p) => p.slug !== page.slug);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <SEO
        title={page.title}
        description={page.description}
        canonical={canonical}
        schema={schemas}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" width="112" height="32" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm text-slate-400 transition hover:text-white">
              Home
            </Link>
            <Link to="/blog" className="text-sm text-slate-400 transition hover:text-white">
              Blog
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Breadcrumbs ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-4xl px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-cyan-400 transition">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-300">{page.title}</span>
        </nav>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {page.heroHeadline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
          {page.heroSubheadline}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-400 hover:shadow-cyan-400/30"
          >
            Start Free <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/#pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 text-lg font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* ── Definition Block (AI retrieval optimized) ──────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-cyan-400" />
            <p className="text-lg leading-relaxed text-slate-200">
              {page.definitionBlock}
            </p>
          </div>
        </div>
      </section>

      {/* ── Content Sections ───────────────────────────────────────── */}
      <article className="mx-auto max-w-4xl px-6 pb-16">
        {page.sections.map((section, idx) => (
          <section key={idx} className="mb-16">
            <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
              {section.heading}
            </h2>
            {renderMarkdown(section.content)}
          </section>
        ))}
      </article>

      {/* ── Related Blog Posts (Internal Links) ────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <h2 className="mb-8 text-2xl font-bold text-white">Related Articles</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedPosts.map((post) =>
              post ? (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 transition hover:border-cyan-500/40 hover:bg-slate-800/60"
                >
                  <h3 className="font-semibold text-white group-hover:text-cyan-400 transition">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                    {post.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}

      {/* ── FAQ Section ────────────────────────────────────────────── */}
      {page.faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <h2 className="mb-8 text-2xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {page.faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-slate-700/60 bg-slate-800/40"
              >
                <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-white transition hover:text-cyan-400 list-none flex items-center justify-between">
                  {faq.question}
                  <ChevronRight className="h-5 w-5 text-slate-500 transition group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-slate-300 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── Cross-Links to Other Pillar Pages ──────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-6 text-xl font-bold text-white">Explore More</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {otherPillars.map((p) => (
            <Link
              key={p.slug}
              to={`/${p.slug}`}
              className="rounded-xl border border-slate-700/60 bg-slate-800/30 px-5 py-4 text-sm font-medium text-slate-300 transition hover:border-cyan-500/40 hover:text-white"
            >
              {p.title} →
            </Link>
          ))}
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────── */}
      <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            {page.ctaHeadline}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            {page.ctaSubheadline}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-400"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 text-lg font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" width="84" height="24" loading="lazy" />
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Professional water quality reporting software for water treatment dealers.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/#features" className="hover:text-white transition">Features</Link></li>
              <li><Link to="/#pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link to="/signup" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/water-treatment-dealer-software" className="hover:text-white transition">Dealer Software</Link></li>
              <li><Link to="/water-quality-report-software" className="hover:text-white transition">Report Software</Link></li>
              <li><Link to="/digital-water-test-reports" className="hover:text-white transition">Digital Reports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><a href="mailto:support@aquareport.org" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-slate-800/60 px-6 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} AquaReport. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
