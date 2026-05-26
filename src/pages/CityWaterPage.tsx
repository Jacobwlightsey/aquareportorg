import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, AlertTriangle, Shield, Droplets, MapPin, Users, FlaskConical, ExternalLink } from "lucide-react";
import { getCityBySlug, cityWaterData } from "@/lib/cityData";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schema";

/* ── Score ring ────────────────────────────────────────────────── */
function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    tier === "Gold" ? "#22c55e" :
    tier === "Silver" ? "#22d3ee" :
    tier === "Bronze" ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle
          cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold text-white">{score}</span>
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color }}>{tier}</span>
      </div>
    </div>
  );
}

/* ── Contaminant card ──────────────────────────────────────────── */
function ContaminantCard({ name, index }: { name: string; index: number }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-400">
        {index + 1}
      </div>
      <div>
        <p className="font-medium text-white">{name}</p>
        <p className="mt-0.5 text-xs text-slate-400">Detected above EWG health guidelines</p>
      </div>
    </div>
  );
}

export function CityWaterPage() {
  const { slug } = useParams<{ slug: string }>();
  const city = slug ? getCityBySlug(slug) : undefined;

  if (!city) return <Navigate to="/water-quality" replace />;

  const relatedCities = cityWaterData
    .filter((c) => c.stateAbbr === city.stateAbbr && c.slug !== city.slug)
    .slice(0, 4);

  const worstCities = [...cityWaterData].sort((a, b) => a.aquaScore - b.aquaScore).slice(0, 5);

  return (
    <>
      <SEO
        title={`${city.city}, ${city.stateAbbr} Water Quality Report — AquaScore ${city.aquaScore}/100`}
        description={`${city.city} tap water quality report: AquaScore ${city.aquaScore}/100 (${city.scoreTier}). ${city.contaminantsDetected} contaminants detected, ${city.exceedingGuidelines} exceeding health guidelines. See what's in ${city.city}'s water.`}
        canonical={`https://aquareport.org/water-quality/${city.slug}`}
        author="Jacob Lightsey"
        schema={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `${city.city}, ${city.stateAbbr} Water Quality Report`,
            description: `Complete water quality analysis for ${city.city}, ${city.state}. AquaScore: ${city.aquaScore}/100.`,
            datePublished: "2026-05-25",
            dateModified: "2026-05-25",
            author: { "@type": "Person", name: "Jacob Lightsey", url: "https://aquareport.org/about/jacob-lightsey" },
            publisher: { "@type": "Organization", name: "AquaReport", url: "https://aquareport.org" },
            mainEntityOfPage: `https://aquareport.org/water-quality/${city.slug}`,
          },
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Water Quality", url: "https://aquareport.org/water-quality" },
            { name: `${city.city}, ${city.stateAbbr}`, url: `https://aquareport.org/water-quality/${city.slug}` },
          ]),
        ]}
      />

      <div className="min-h-screen bg-[#020617]">
        {/* Nav */}
        <header className="border-b border-slate-800/60">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/water-quality" className="hidden text-sm text-slate-400 hover:text-white md:block">Water Quality</Link>
              <Link to="/blog" className="hidden text-sm text-slate-400 hover:text-white md:block">Blog</Link>
              <Link to="/learn" className="hidden text-sm text-slate-400 hover:text-white md:block">Learn</Link>
              <Link to="/login" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400">Sign In</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 pb-16 pt-8">
          <Link to="/water-quality" className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300">
            <ArrowLeft className="h-3.5 w-3.5" /> All Cities
          </Link>

          {/* Hero */}
          <div className="flex flex-col items-center gap-8 rounded-2xl border border-slate-800/60 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-8 text-center md:flex-row md:text-left">
            <ScoreRing score={city.aquaScore} tier={city.scoreTier} />
            <div>
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-cyan-400">{city.state}</span>
              </div>
              <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">
                {city.city} Water Quality Report
              </h1>
              <p className="mt-2 text-slate-400">
                AquaScore™ {city.aquaScore}/100 · {city.scoreTier} · {city.contaminantsDetected} contaminants detected
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: Droplets, label: "Water Source", value: city.waterSource.split(",")[0] },
              { icon: Users, label: "Population Served", value: city.population.toLocaleString() },
              { icon: FlaskConical, label: "Contaminants Found", value: String(city.contaminantsDetected) },
              { icon: AlertTriangle, label: "Exceeding Guidelines", value: String(city.exceedingGuidelines) },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center">
                <stat.icon className="mx-auto h-5 w-5 text-cyan-400" />
                <p className="mt-2 text-lg font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main content */}
          <article className="mt-10 space-y-10 text-slate-300 leading-relaxed">
            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">What's in {city.city}'s Tap Water?</h2>
              <p>
                According to data from the Environmental Working Group (EWG) and the EPA's Safe Drinking Water Information System, {city.city}'s tap water — served by {city.utility} — contains <strong className="text-white">{city.contaminantsDetected} detected contaminants</strong>, of which <strong className="text-white">{city.exceedingGuidelines} exceed EWG health guidelines</strong>.
              </p>
              <p className="mt-3">
                The water scores <strong className="text-white">{city.aquaScore} out of 100</strong> on the AquaScore™ scale, placing it in the <strong className="text-white">{city.scoreTier}</strong> tier.
                {city.aquaScore < 50
                  ? " This means the water has significant contamination concerns that homeowners should be aware of."
                  : city.aquaScore < 60
                  ? " While meeting federal legal standards, the water contains contaminants above science-based health guidelines."
                  : city.aquaScore < 80
                  ? " The water quality is above average but still has room for improvement, particularly regarding disinfection byproducts."
                  : " The water quality is excellent compared to most US cities, though some contaminants are still present."}
              </p>
              {city.violations > 0 && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                  <p className="text-red-300">
                    {city.city}'s water system has <strong className="text-white">{city.violations} federal violation(s)</strong> on record. Violations mean the water utility failed to meet EPA legal standards — a more serious concern than exceeding health guidelines.
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Top Contaminants in {city.city} Water</h2>
              <p className="mb-4">
                These are the most significant contaminants detected in {city.city}'s water supply, ranked by their exceedance above EWG's health-protective guidelines:
              </p>
              <div className="space-y-3">
                {city.topContaminants.map((c, i) => (
                  <ContaminantCard key={c} name={c} index={i} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Water Source & Treatment</h2>
              <p>
                {city.city} gets its water from <strong className="text-white">{city.waterSource}</strong>. The water is treated and distributed by <strong className="text-white">{city.utility}</strong>, which serves a population of approximately {city.population.toLocaleString()}.
              </p>
              <p className="mt-3">{city.concerns}</p>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Understanding Your AquaScore™</h2>
              <p>
                AquaScore™ rates water quality on a 0–100 scale based on detected contaminants compared to both EPA legal limits and stricter EWG health guidelines. Here's what each tier means:
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { tier: "Gold (80+)", color: "text-green-400 border-green-500/20 bg-green-500/5", desc: "Excellent — minimal contamination concerns" },
                  { tier: "Silver (60–79)", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5", desc: "Good — some contaminants above guidelines" },
                  { tier: "Bronze (40–59)", color: "text-amber-400 border-amber-500/20 bg-amber-500/5", desc: "Fair — multiple contaminants of concern" },
                  { tier: "At Risk (<40)", color: "text-red-400 border-red-500/20 bg-red-500/5", desc: "Poor — significant contamination detected" },
                ].map((t) => (
                  <div key={t.tier} className={`rounded-lg border p-3 ${t.color}`}>
                    <p className="font-bold">{t.tier}</p>
                    <p className="mt-1 text-sm text-slate-300">{t.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">What Can {city.city} Homeowners Do?</h2>
              <p>
                If you're a homeowner in {city.city} concerned about your water quality, there are several steps you can take:
              </p>
              <ol className="mt-4 list-decimal space-y-3 pl-6">
                <li>
                  <strong className="text-white">Get your water tested.</strong> Municipal data shows what's in the system, but conditions at your tap can vary depending on your home's plumbing, pipe age, and location in the distribution system.
                </li>
                <li>
                  <strong className="text-white">Review your water utility's Consumer Confidence Report (CCR).</strong> {city.utility} is required to publish an annual report detailing all detected contaminants.
                </li>
                <li>
                  <strong className="text-white">Consider whole-home water treatment.</strong> Based on {city.city}'s contaminant profile, a whole-home filtration system can significantly reduce exposure to {city.topContaminants[0]} and other detected contaminants.
                </li>
                <li>
                  <strong className="text-white">Look for NSF-certified filters.</strong> Make sure any filtration system you consider is certified to remove the specific contaminants found in {city.city}'s water.
                </li>
              </ol>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-bold text-white">Data Sources & Methodology</h2>
              <p>
                This water quality report is based on data from the <a href="https://www.ewg.org/tapwater/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">EWG Tap Water Database <ExternalLink className="inline h-3 w-3" /></a> and the <a href="https://www.epa.gov/ground-water-and-drinking-water" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">EPA Safe Drinking Water Information System <ExternalLink className="inline h-3 w-3" /></a>. Contaminant levels are compared against both EPA Maximum Contaminant Levels (MCLs) — the legal limits — and EWG's health-based guidelines, which are often much stricter.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                AquaScore™ is a proprietary scoring system developed by AquaReport. It is not affiliated with the EPA or EWG. For the most current data, always check your utility's latest Consumer Confidence Report.
              </p>
            </section>
          </article>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <Shield className="mx-auto h-10 w-10 text-cyan-400" />
            <h2 className="mt-4 text-2xl font-bold text-white">
              Are You a Water Treatment Dealer in {city.city}?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              AquaReport helps you create professional, branded water quality reports for your customers using real {city.city} water data. Turn this data into closed deals.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white hover:bg-cyan-400"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Related cities */}
          {relatedCities.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 text-xl font-bold text-white">
                Other Cities in {city.state}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {relatedCities.map((c) => (
                  <Link
                    key={c.slug}
                    to={`/water-quality/${c.slug}`}
                    className="group flex items-center justify-between rounded-lg border border-slate-800/60 p-4 hover:border-cyan-500/30 hover:bg-slate-900/40"
                  >
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-300">{c.city}, {c.stateAbbr}</p>
                      <p className="text-sm text-slate-400">AquaScore: {c.aquaScore} · {c.scoreTier}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Worst cities sidebar */}
          <section className="mt-12">
            <h2 className="mb-4 text-xl font-bold text-white">Cities With Lowest Water Quality Scores</h2>
            <div className="space-y-2">
              {worstCities.map((c, i) => (
                <Link
                  key={c.slug}
                  to={`/water-quality/${c.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-slate-800/60 p-3 hover:border-red-500/30 hover:bg-slate-900/40"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-400">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-white group-hover:text-red-300">{c.city}, {c.stateAbbr}</span>
                    <span className="ml-2 text-sm text-slate-500">Score: {c.aquaScore}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
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
