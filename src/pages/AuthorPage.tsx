import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { profilePageSchema, breadcrumbSchema } from "@/lib/schema";
import { blogPosts } from "@/lib/blogData";
import { ArrowLeft, ExternalLink, Linkedin, Github, Globe } from "lucide-react";

export function AuthorPage() {
  const recentPosts = [...blogPosts]
    .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
    .slice(0, 12);

  const totalArticles = blogPosts.length;

  return (
    <>
      <SEO
        title="Jacob Lightsey — Founder of AquaReport"
        description="Jacob Lightsey is the founder of AquaReport, the water quality reporting and sales platform for water treatment dealers. With deep expertise in water treatment technology, Jacob built AquaReport to bridge the gap between complex water data and homeowners who need to understand it."
        canonical="https://aquareport.org/about/jacob-lightsey"
        ogImage="https://aquareport.org/og-author-jacob.png"
        author="Jacob Lightsey"
        schema={[
          profilePageSchema({
            name: "Jacob Lightsey",
            description:
              "Founder & CEO of AquaReport — building the sales operating system for water treatment dealers. Expert in water quality data, EPA contaminant standards, and water treatment technology.",
            url: "https://aquareport.org/about/jacob-lightsey",
            jobTitle: "Founder & CEO",
            worksFor: "AquaReport",
            sameAs: [
              // Add real profile URLs as they're created:
              // "https://linkedin.com/in/jacobwlightsey",
              // "https://twitter.com/jacobwlightsey",
              "https://github.com/Jacobwlightsey",
            ],
          }),
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "About", url: "https://aquareport.org/about/jacob-lightsey" },
          ]),
        ]}
      />

      <div className="min-h-screen bg-[#020617]">
        {/* Header */}
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" width="97" height="28" />
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm text-slate-400 transition hover:text-white">Home</Link>
              <Link to="/blog" className="text-sm text-slate-400 transition hover:text-white">Blog</Link>
              <Link to="/signup" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
                Get Started Free
              </Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          <Link to="/blog" className="mb-8 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </Link>

          {/* Profile Section — Enhanced for E-E-A-T */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-8 mb-12">
            <div className="h-32 w-32 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-cyan-500/20">
              JL
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Jacob Lightsey</h1>
              <p className="mt-1 text-lg text-cyan-300">Founder & CEO, AquaReport</p>
              <p className="mt-4 leading-relaxed text-slate-300">
                Jacob Lightsey is the founder of AquaReport, the water quality reporting and sales platform trusted by water treatment dealers across the United States and Canada. With deep expertise in water treatment technology, EPA and Health Canada contaminant standards, and in-home sales processes, Jacob built AquaReport to bridge the gap between complex water quality data and the homeowners who need to understand it.
              </p>
              <p className="mt-3 leading-relaxed text-slate-300">
                Before building AquaReport, Jacob worked directly with water treatment dealers and saw the same problem everywhere: brilliant technicians losing sales because they couldn't present water data in a way homeowners could understand. Paper test results, handwritten notes, and generic spreadsheets were costing dealers thousands of dollars per month in lost conversions.
              </p>
              <p className="mt-3 leading-relaxed text-slate-300">
                AquaReport was built from that insight — combining real-time EPA water data, a proprietary AquaScore™ grading system, and a 21-step psychology-driven Demo Wizard to give dealers everything they need to run a professional, data-backed in-home consultation. His mission: make water quality information accessible, actionable, and powerful enough to help both dealers and homeowners make better decisions.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <a
                  href="https://aquareport.org"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-sm text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition"
                >
                  <Globe className="h-3.5 w-3.5" /> aquareport.org
                </a>
                <a
                  href="https://github.com/Jacobwlightsey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
                {/* Uncomment when LinkedIn is created:
                <a
                  href="https://linkedin.com/in/jacobwlightsey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:border-slate-500 transition"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
                */}
              </div>
            </div>
          </div>

          {/* Credentials & Expertise — E-E-A-T signal */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-white">Areas of Expertise</h2>
            <p className="mb-6 text-slate-400">
              Jacob writes about water quality, filtration technology, and dealer business strategy. His articles draw on real EPA and EWG contaminant data, Health Canada guidelines, and direct experience working with water treatment dealers.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Water Quality Testing & Analysis",
                "EPA & Health Canada Contaminant Standards",
                "Water Treatment Industry Software",
                "In-Home Water Sales & Presentations",
                "AquaScore™ Water Quality Scoring",
                "Dealer Business Growth Strategies",
                "Digital Water Quality Reports",
                "Water Treatment CRM & Sales Pipeline",
                "Water Filtration Technology",
                "Consumer Water Safety Education",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                  <span className="text-cyan-400">✓</span> {item}
                </div>
              ))}
            </div>
          </section>

          {/* About AquaReport — establishes authority */}
          <section className="mb-12 rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-6">
            <h2 className="mb-3 text-xl font-bold text-white">About AquaReport</h2>
            <p className="leading-relaxed text-slate-300">
              AquaReport is the sales operating system for water treatment dealers. The platform includes professional water quality report generation with the proprietary AquaScore™ 1-100 grading system, a 21-step interactive Demo Wizard for in-home presentations, real-time EPA and Health Canada contaminant data, CRM and lead management, AI-powered sales tools, and team management for sales organizations. Founded in 2025, AquaReport serves dealers across the United States and Canada.
            </p>
            <Link to="/signup" className="mt-4 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300">
              Try AquaReport Free → <ExternalLink className="h-3 w-3" />
            </Link>
          </section>

          {/* Published Articles — comprehensive list */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Published Articles</h2>
              <span className="text-sm text-slate-500">{totalArticles} articles</span>
            </div>
            <p className="mb-6 text-slate-400">
              Expert guides on water quality, contaminants, filtration, and water treatment business strategies.
            </p>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group block rounded-lg border border-slate-800/60 p-4 transition-all hover:border-cyan-500/30 hover:bg-slate-900/40"
                >
                  <div className="mb-1 text-xs text-slate-500">{post.category} · {post.readTime} min read</div>
                  <div className="font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">{post.title}</div>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{post.description}</p>
                </Link>
              ))}
            </div>
            <Link
              to="/blog"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
            >
              View all {totalArticles} articles →
            </Link>
          </section>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Built for Water Treatment Dealers</h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              AquaReport helps dealers create professional, branded water quality reports that close more sales. Start with a free report — no credit card required.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-block rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-400"
            >
              Start Your Free Report →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 bg-slate-950 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AquaReport. Water quality report software for dealers.
          </div>
        </footer>
      </div>
    </>
  );
}
