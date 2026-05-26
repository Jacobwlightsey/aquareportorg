import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Droplets, FlaskConical, Shield, Building2, Scale } from "lucide-react";
import { blogPosts } from "@/lib/blogData";
import { pillarPages } from "@/lib/pillarData";
import { cityWaterData } from "@/lib/cityData";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schema";

const categories = [
  {
    title: "Water Quality Guides",
    description: "Understand what's in your water and what the numbers mean",
    icon: Droplets,
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/20",
    links: [
      { title: "Water Quality by City", href: "/water-quality", desc: `${cityWaterData.length} US cities analyzed` },
      { title: "How AquaScore™ Works", href: "/blog/water-quality-scoring-system", desc: "0–100 scoring explained" },
      { title: "Understanding Water Test Results", href: "/blog/present-water-test-results-customers", desc: "Reading your report" },
    ],
  },
  {
    title: "For Water Treatment Dealers",
    description: "Software, sales strategies, and business growth",
    icon: Building2,
    color: "from-emerald-500/20 to-cyan-500/20 border-emerald-500/20",
    links: [
      { title: "Water Treatment Dealer Software", href: "/water-treatment-dealer-software", desc: "All-in-one platform" },
      { title: "Grow Your Water Treatment Business", href: "/blog/grow-water-treatment-business", desc: "10 proven strategies" },
      { title: "Water Treatment CRM Software", href: "/blog/water-treatment-crm-software", desc: "Manage customer relationships" },
    ],
  },
  {
    title: "Reports & Testing",
    description: "Create professional water quality reports",
    icon: FlaskConical,
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/20",
    links: [
      { title: "Water Quality Report Software", href: "/water-quality-report-software", desc: "Generate branded reports" },
      { title: "Digital Water Test Reports", href: "/digital-water-test-reports", desc: "Go paperless" },
      { title: "Create Professional Reports", href: "/blog/create-professional-water-test-reports", desc: "Step-by-step guide" },
    ],
  },
  {
    title: "Sales & Marketing",
    description: "Close more deals with data-driven presentations",
    icon: Scale,
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/20",
    links: [
      { title: "Sell More Water Softeners", href: "/blog/sell-more-water-softeners-reports", desc: "Using professional reports" },
      { title: "ROI of Water Quality Reports", href: "/blog/roi-professional-water-quality-reports", desc: "Calculate your return" },
      { title: "Lead Generation Strategies", href: "/blog/water-dealer-lead-generation", desc: "Modern lead gen" },
    ],
  },
];

export function LearnHubPage() {
  const recentPosts = [...blogPosts]
    .sort((a, b) => b.dateModified.localeCompare(a.dateModified))
    .slice(0, 6);

  return (
    <>
      <SEO
        title="Learn — Water Treatment Guides, Reports & Industry Knowledge"
        description="Your hub for water treatment industry knowledge. Guides on water quality, dealer software, sales strategies, and creating professional water quality reports."
        canonical="https://aquareport.org/learn"
        schema={[
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Learn", url: "https://aquareport.org/learn" },
          ]),
        ]}
      />

      <div className="min-h-screen bg-[#020617]">
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/water-quality" className="hidden text-sm text-slate-400 hover:text-white md:block">Water Quality</Link>
              <Link to="/blog" className="hidden text-sm text-slate-400 hover:text-white md:block">Blog</Link>
              <Link to="/login" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400">Sign In</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
          {/* Hero */}
          <div className="text-center">
            <BookOpen className="mx-auto h-10 w-10 text-cyan-400" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">
              Learn About Water Quality
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-400">
              Everything water treatment professionals and homeowners need to know about water quality, testing, reporting, and building a successful water treatment business.
            </p>
          </div>

          {/* Category Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {categories.map((cat) => (
              <div
                key={cat.title}
                className={`rounded-2xl border bg-gradient-to-br ${cat.color} p-6`}
              >
                <div className="flex items-center gap-3">
                  <cat.icon className="h-6 w-6 text-white" />
                  <h2 className="text-xl font-bold text-white">{cat.title}</h2>
                </div>
                <p className="mt-1 text-sm text-slate-400">{cat.description}</p>
                <div className="mt-4 space-y-2">
                  {cat.links.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="group flex items-center justify-between rounded-lg border border-slate-800/40 bg-slate-950/40 p-3 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60"
                    >
                      <div>
                        <p className="font-medium text-cyan-400 group-hover:text-cyan-300">{link.title}</p>
                        <p className="text-xs text-slate-500">{link.desc}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pillar Pages */}
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-white">
              <Shield className="mr-2 inline h-6 w-6 text-cyan-400" />
              Authority Guides
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {pillarPages.map((p) => (
                <Link
                  key={p.slug}
                  to={`/${p.slug}`}
                  className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 transition-all hover:border-cyan-500/30"
                >
                  <h3 className="font-bold text-white group-hover:text-cyan-300">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{p.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Articles */}
          <section className="mt-16">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Latest Articles</h2>
              <Link to="/blog" className="text-sm text-cyan-400 hover:text-cyan-300">
                View all →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 transition-all hover:border-cyan-500/30"
                >
                  <div className="text-xs text-slate-500">{post.category} · {post.readTime} min read</div>
                  <h3 className="mt-2 font-bold text-white group-hover:text-cyan-300 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{post.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">Ready to Create Professional Water Quality Reports?</h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              AquaReport turns water data into branded, sales-ready reports. Start your free trial today.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white hover:bg-cyan-400"
            >
              Start Free Report <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <footer className="border-t border-slate-800/60 bg-slate-950 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AquaReport. Water quality report software for dealers. ·{" "}
            <Link to="/privacy" className="hover:text-slate-300">Privacy</Link> ·{" "}
            <Link to="/terms" className="hover:text-slate-300">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
