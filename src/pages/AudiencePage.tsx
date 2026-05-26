import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Users, Lock, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";

export function AudiencePage() {
  const company = useQuery(api.companies.getMyCompany);

  return (
    <>
      <SEO title="Audiences" description="Build custom audience segments for targeted marketing." noindex />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Audiences</h1>
          <p className="mt-1 text-slate-400">Build custom segments and export audiences for Facebook and other platforms.</p>
        </div>

        {/* Coming Soon / Pro Gate */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/40 py-16 text-center">
          <div className="rounded-2xl bg-purple-500/10 p-4">
            <Users className="h-10 w-10 text-purple-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Custom Audiences</h2>
          <p className="mt-2 max-w-md text-slate-400">
            Create audience segments based on water quality scores, contaminants, location, and engagement.
            Export directly to Facebook Custom Audiences for targeted ad campaigns.
          </p>

          <div className="mt-6 grid max-w-lg gap-3 text-left sm:grid-cols-2">
            {[
              "Score-based segments",
              "Contaminant targeting",
              "Location filters",
              "Engagement scoring",
              "Facebook export",
              "CSV download",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 rounded-lg border border-slate-800/40 bg-slate-950/40 px-3 py-2 text-sm">
                <div className="size-1.5 rounded-full bg-purple-400" />
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm text-amber-300">
            <Lock className="h-4 w-4" />
            Available on Pro plan ($599/mo)
          </div>

          <Link
            to="/company"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300"
          >
            Upgrade your plan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
