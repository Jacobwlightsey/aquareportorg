import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { blogPosts } from "@/lib/blogData";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schema";

export function BlogPage() {
  return (
    <>
      <SEO
        title="Blog — Water Treatment Dealer Resources"
        description="Expert guides, tips, and strategies for water treatment dealers. Learn how to create better reports, close more sales, and grow your business with AquaReport."
        canonical="https://aquareport.org/blog"
        ogImage="https://aquareport.org/og-blog.png"
        schema={breadcrumbSchema([
          { name: "Home", url: "https://aquareport.org" },
          { name: "Blog", url: "https://aquareport.org/blog" },
        ])}
      />

      <div className="min-h-screen bg-[#020617]">
        {/* Header */}
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" width="112" height="32" />
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="hidden text-sm text-slate-400 transition-colors hover:text-white md:block"
              >
                Home
              </Link>
              <Link
                to="/#pricing"
                className="hidden text-sm text-slate-400 transition-colors hover:text-white md:block"
              >
                Pricing
              </Link>
              <span className="text-sm font-medium text-cyan-300">Blog</span>
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

        {/* Hero */}
        <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Water Dealer Resources
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Expert guides to help water treatment dealers create better reports,
            close more sales, and grow their business.
          </p>
        </div>

        {/* Article Grid */}
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 transition-all hover:border-cyan-500/30 hover:bg-slate-900/70"
              >
                {post.headerImage && (
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={post.headerImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      width="600"
                      height="400"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-500">
                    {post.readTime} min read
                  </span>
                </div>
                <h2 className="mb-2 text-lg font-semibold text-white transition-colors group-hover:text-cyan-300">
                  {post.title}
                </h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-400">
                  {post.description}
                </p>
                <div className="flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
                  Read article <ArrowRight className="h-4 w-4" />
                </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* SEO Footer */}
        <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" width="84" height="24" loading="lazy" />
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
