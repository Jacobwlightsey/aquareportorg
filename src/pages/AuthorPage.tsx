import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicHeader } from "@/components/PublicHeader";
import { profilePageSchema, breadcrumbSchema } from "@/lib/schema";
import { blogPosts } from "@/lib/blogData";
import { ArrowLeft, ExternalLink } from "lucide-react";

export function AuthorPage() {
  const recentPosts = [...blogPosts]
    .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
    .slice(0, 10);

  return (
    <>
      <SEO
        title="Jacob Lightsey — Founder of AquaReport"
        description="Jacob Lightsey is the founder of AquaReport, the water quality reporting platform for water treatment dealers. Learn about his mission to make water quality data accessible."
        canonical="https://aquareport.org/about/jacob-lightsey"
        ogImage="https://aquareport.org/og-author-jacob.png"
        author="Jacob Lightsey"
        schema={[
          profilePageSchema({
            name: "Jacob Lightsey",
            description: "Founder of AquaReport — building software to help water treatment dealers create professional reports and close more sales.",
            url: "https://aquareport.org/about/jacob-lightsey",
            jobTitle: "Founder & CEO",
            worksFor: "AquaReport",
          }),
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "About", url: "https://aquareport.org/about/jacob-lightsey" },
          ]),
        ]}
      />

      <div className="min-h-screen bg-[#020617]">
        <PublicHeader navLinks={[{ label: "Home", to: "/" }, { label: "Blog", to: "/blog" }, { label: "Learn", to: "/learn" }]} />

        <div className="mx-auto max-w-3xl px-6 pb-16 pt-12">
          <Link to="/blog" className="mb-8 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Blog
          </Link>

          {/* Profile Section */}
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-8 mb-12">
            <div className="h-32 w-32 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-cyan-500/20">
              JL
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Jacob Lightsey</h1>
              <p className="mt-1 text-lg text-cyan-300">Founder & CEO, AquaReport</p>
              <p className="mt-4 leading-relaxed text-slate-300">
                Jacob Lightsey is the founder of AquaReport, the water quality reporting platform trusted by water treatment dealers across the United States. With deep expertise in the water treatment industry, Jacob built AquaReport to bridge the gap between complex water quality data and the homeowners who need to understand it.
              </p>
              <p className="mt-3 leading-relaxed text-slate-300">
                His mission: make water quality information accessible, actionable, and powerful enough to drive real decisions — whether you're a homeowner concerned about your family's water or a dealer helping customers find the right solution.
              </p>
              <div className="mt-4 flex gap-4">
                <a href="https://aquareport.org" className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300">
                  <ExternalLink className="h-3.5 w-3.5" /> aquareport.org
                </a>
              </div>
            </div>
          </div>

          {/* Expertise */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-white">Areas of Expertise</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Water Quality Testing & Analysis",
                "Water Treatment Industry Software",
                "EPA & EWG Contaminant Standards",
                "In-Home Water Sales Presentations",
                "AquaScore™ Water Quality Scoring",
                "Dealer Business Growth Strategies",
                "Digital Water Quality Reports",
                "Water Treatment CRM & Pipeline",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-4 py-3 text-sm text-slate-300">
                  <span className="text-cyan-400">✓</span> {item}
                </div>
              ))}
            </div>
          </section>

          {/* Published Articles */}
          <section>
            <h2 className="mb-4 text-2xl font-bold text-white">Published Articles</h2>
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
          </section>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Built for Water Treatment Dealers</h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              AquaReport helps dealers create professional, branded water quality reports that close more sales.
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
