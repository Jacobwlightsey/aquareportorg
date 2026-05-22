import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Droplets } from "lucide-react";
import { getBlogPost, getRelatedPosts } from "@/lib/blogData";
import { SEO } from "@/components/SEO";
import {
  articleSchema,
  faqSchema,
  breadcrumbSchema,
} from "@/lib/schema";

// Simple markdown-to-JSX renderer for blog content
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Collect lines into a table if they're |...|
  function tryTable(startIdx: number): { el: React.ReactNode; end: number } | null {
    if (!lines[startIdx]?.trim().startsWith("|")) return null;
    const tableLines: string[] = [];
    let idx = startIdx;
    while (idx < lines.length && lines[idx].trim().startsWith("|")) {
      tableLines.push(lines[idx].trim());
      idx++;
    }
    if (tableLines.length < 3) return null; // need header, separator, at least one row

    const parseRow = (line: string) =>
      line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());

    const headers = parseRow(tableLines[0]);
    // skip separator row
    const rows = tableLines.slice(2).map(parseRow);

    return {
      el: (
        <div key={`table-${startIdx}`} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, hi) => (
                  <th
                    key={hi}
                    className="border border-slate-700 bg-slate-800/60 px-4 py-2 text-left font-semibold text-slate-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-slate-700/60 px-4 py-2 text-slate-300"
                    >
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

  function inlineFormat(text: string): React.ReactNode {
    // Bold
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push(text.slice(lastIdx, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {match[1]}
        </strong>
      );
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < text.length) parts.push(text.slice(lastIdx));
    if (parts.length === 0) return text;
    return <>{parts}</>;
  }

  // Collect list items
  function tryList(startIdx: number): { el: React.ReactNode; end: number } | null {
    const first = lines[startIdx]?.trim();
    if (!first) return null;

    const isBullet = first.startsWith("- ");
    const isNumbered = /^\d+\.\s/.test(first);
    if (!isBullet && !isNumbered) return null;

    const items: string[] = [];
    let idx = startIdx;
    while (idx < lines.length) {
      const trimmed = lines[idx].trim();
      if (isBullet && trimmed.startsWith("- ")) {
        items.push(trimmed.slice(2));
        idx++;
      } else if (isNumbered && /^\d+\.\s/.test(trimmed)) {
        items.push(trimmed.replace(/^\d+\.\s/, ""));
        idx++;
      } else {
        break;
      }
    }

    if (items.length === 0) return null;

    const Tag = isBullet ? "ul" : "ol";
    return {
      el: (
        <Tag
          key={`list-${startIdx}`}
          className={`my-4 space-y-1 pl-6 text-slate-300 ${isBullet ? "list-disc" : "list-decimal"}`}
        >
          {items.map((item, ii) => (
            <li key={ii}>{inlineFormat(item)}</li>
          ))}
        </Tag>
      ),
      end: idx,
    };
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Tables
    const table = tryTable(i);
    if (table) {
      elements.push(table.el);
      i = table.end;
      continue;
    }

    // Lists
    const list = tryList(i);
    if (list) {
      elements.push(list.el);
      i = list.end;
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="mb-3 mt-8 text-lg font-bold text-white"
        >
          {trimmed.slice(4)}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="mb-4 mt-10 text-2xl font-bold text-white"
        >
          {trimmed.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-4 leading-relaxed text-slate-300">
        {inlineFormat(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
}

export function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post.slug);

  return (
    <>
      <SEO
        title={post.title}
        description={post.description}
        canonical={`https://aquareport.org/blog/${post.slug}`}
        schema={[
          articleSchema({
            title: post.title,
            description: post.description,
            url: `https://aquareport.org/blog/${post.slug}`,
            datePublished: post.datePublished,
            dateModified: post.dateModified,
          }),
          faqSchema(post.faqs),
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Blog", url: "https://aquareport.org/blog" },
            {
              name: post.title,
              url: `https://aquareport.org/blog/${post.slug}`,
            },
          ]),
        ]}
      />

      <div className="min-h-screen bg-[#020617]">
        {/* Header */}
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <Droplets className="h-6 w-6 text-cyan-400" />
              <span className="text-lg font-bold text-white">AquaReport</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="hidden text-sm text-slate-400 transition-colors hover:text-white md:block"
              >
                Home
              </Link>
              <Link
                to="/blog"
                className="hidden text-sm text-cyan-300 transition-colors hover:text-white md:block"
              >
                Blog
              </Link>
              <Link
                to="/login"
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-400"
              >
                Sign In
              </Link>
            </nav>
          </div>
        </header>

        {/* Consumer Redirect Banner */}
        <div className="border-b border-slate-800/40 bg-slate-900/50 py-2 text-center text-sm text-slate-400">
          Looking for your water quality report?{" "}
          <a
            href="https://myaquareport.com"
            className="text-cyan-400 underline hover:text-cyan-300"
          >
            View it at myaquareport.com →
          </a>
        </div>

        {/* Article */}
        <article className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/blog" className="flex items-center gap-1 hover:text-slate-300">
              <ArrowLeft className="h-3.5 w-3.5" /> Blog
            </Link>
            <span>/</span>
            <span className="text-slate-400">{post.category}</span>
          </div>

          {/* Title + Meta */}
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(post.dateModified).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime} min read
            </span>
            <span>By Jacob Lightsey, Founder</span>
          </div>

          {/* Content */}
          <div className="mt-8 border-t border-slate-800/60 pt-8">
            {renderMarkdown(post.content)}
          </div>

          {/* FAQ Section */}
          {post.faqs.length > 0 && (
            <section className="mt-12 rounded-xl border border-slate-800/60 bg-slate-900/40 p-8">
              <h2 className="mb-6 text-2xl font-bold text-white">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {post.faqs.map((faq, idx) => (
                  <div key={idx}>
                    <h3 className="mb-2 text-lg font-semibold text-cyan-300">
                      {faq.question}
                    </h3>
                    <p className="leading-relaxed text-slate-300">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Ready to Create Professional Water Quality Reports?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              Join water treatment dealers across the country using AquaReport
              to close more deals with data-driven presentations.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-block rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-400"
            >
              Start Your Free Report →
            </Link>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold text-white">
                Related Articles
              </h2>
              <div className="grid gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${r.slug}`}
                    className="group rounded-lg border border-slate-800/60 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900/40"
                  >
                    <div className="mb-1 text-xs text-slate-500">
                      {r.category} · {r.readTime} min read
                    </div>
                    <div className="font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                      {r.title}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-cyan-400" />
                <span className="font-bold text-white">AquaReport</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                Professional water quality reporting software for water
                treatment dealers. Create branded reports, score water quality
                with AquaScore™, and close more sales.
              </p>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/#pricing"
                    className="text-slate-400 hover:text-white"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/signup"
                    className="text-slate-400 hover:text-white"
                  >
                    Sign Up Free
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                Resources
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/blog"
                    className="text-slate-400 hover:text-white"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog/water-quality-report-software-guide"
                    className="text-slate-400 hover:text-white"
                  >
                    Software Guide
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog/water-quality-scoring-system"
                    className="text-slate-400 hover:text-white"
                  >
                    AquaScore Explained
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">
                For Customers
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://myaquareport.com"
                    className="text-slate-400 hover:text-white"
                  >
                    View Your Report
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-6xl border-t border-slate-800/60 px-6 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AquaReport. Water quality report
            software for dealers.
          </div>
        </footer>
      </div>
    </>
  );
}
