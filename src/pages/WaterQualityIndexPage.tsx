import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Search, Droplets } from "lucide-react";
import { cityWaterData } from "@/lib/cityData";
import type { CityWaterData } from "@/lib/cityData";
import { SEO } from "@/components/SEO";
import { breadcrumbSchema } from "@/lib/schema";
import { useState, useMemo } from "react";

function ScoreBadge({ score, tier }: { score: number; tier: string }) {
  const color =
    tier === "Gold" ? "text-green-400 bg-green-500/10 border-green-500/20" :
    tier === "Silver" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" :
    tier === "Bronze" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    "text-red-400 bg-red-500/10 border-red-500/20";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

export function WaterQualityIndexPage() {
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");

  const states = useMemo(() => {
    const s = [...new Set(cityWaterData.map((c) => c.stateAbbr))].sort();
    return s;
  }, []);

  const filtered = useMemo(() => {
    let result = cityWaterData;
    if (selectedState !== "all") result = result.filter((c) => c.stateAbbr === selectedState);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((c) => c.city.toLowerCase().includes(q) || c.state.toLowerCase().includes(q) || c.slug.includes(q));
    }
    return result.sort((a, b) => a.aquaScore - b.aquaScore);
  }, [query, selectedState]);

  const atRisk = cityWaterData.filter((c) => c.aquaScore < 50).length;
  const avgScore = Math.round(cityWaterData.reduce((s, c) => s + c.aquaScore, 0) / cityWaterData.length);

  return (
    <>
      <SEO
        title="Water Quality by City — US Tap Water Reports"
        description={`Check water quality reports for ${cityWaterData.length} major US cities. See AquaScore™ ratings, contaminants detected, and what's really in your city's tap water.`}
        canonical="https://aquareport.org/water-quality"
        schema={[
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Water Quality by City", url: "https://aquareport.org/water-quality" },
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
              <Link to="/blog" className="hidden text-sm text-slate-400 hover:text-white md:block">Blog</Link>
              <Link to="/learn" className="hidden text-sm text-slate-400 hover:text-white md:block">Learn</Link>
              <Link to="/login" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400">Sign In</Link>
            </nav>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 pb-16 pt-12">
          {/* Hero */}
          <div className="text-center">
            <Droplets className="mx-auto h-10 w-10 text-cyan-400" />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">Water Quality by City</h1>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-400">
              Explore water quality data for {cityWaterData.length} major US cities. Every report uses real EWG and EPA data to show what's actually in your tap water.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center">
              <p className="text-3xl font-bold text-white">{cityWaterData.length}</p>
              <p className="text-sm text-slate-400">Cities Analyzed</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center">
              <p className="text-3xl font-bold text-white">{avgScore}</p>
              <p className="text-sm text-slate-400">Average AquaScore</p>
            </div>
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-center">
              <p className="text-3xl font-bold text-red-400">{atRisk}</p>
              <p className="text-sm text-slate-400">At Risk Cities</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search cities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* City Grid */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((city) => (
              <Link
                key={city.slug}
                to={`/water-quality/${city.slug}`}
                className="group relative overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 p-5 transition-all hover:border-cyan-500/30 hover:bg-slate-900/60"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-500">{city.state}</span>
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-white group-hover:text-cyan-300">
                      {city.city}
                    </h3>
                  </div>
                  <ScoreBadge score={city.aquaScore} tier={city.scoreTier} />
                </div>
                <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                  {city.contaminantsDetected} contaminants detected · {city.exceedingGuidelines} exceeding guidelines
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {city.topContaminants.slice(0, 3).map((c) => (
                    <span key={c} className="inline-block rounded bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                      {c.length > 25 ? c.slice(0, 22) + "…" : c}
                    </span>
                  ))}
                </div>
                <div className="absolute bottom-5 right-5 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="h-4 w-4 text-cyan-400" />
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-12 text-center text-slate-500">
              No cities match your search. Try a different city name or state.
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8 text-center">
            <h2 className="text-2xl font-bold text-white">
              Water Treatment Dealers: Turn This Data Into Sales
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-slate-300">
              AquaReport generates professional, branded water quality reports for any ZIP code. Show your customers exactly what's in their water and close more deals.
            </p>
            <Link
              to="/signup"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-medium text-white hover:bg-cyan-400"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <footer className="border-t border-slate-800/60 bg-slate-950 py-8">
          <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} AquaReport. Water quality data from EWG and EPA public databases. ·{" "}
            <Link to="/privacy" className="hover:text-slate-300">Privacy</Link> ·{" "}
            <Link to="/terms" className="hover:text-slate-300">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
