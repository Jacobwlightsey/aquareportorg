import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { BarChart3, TrendingUp, Users, MousePointerClick, Target, ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-5 w-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-28 shrink-0 text-right text-sm text-muted-foreground">{label}</span>
      <div className="flex-1">
        <div className="h-8 overflow-hidden rounded-lg bg-secondary">
          <div
            className={`h-full rounded-lg ${color} flex items-center px-3 text-sm font-bold text-foreground transition-all duration-700`}
            style={{ width: `${width}%` }}
          >
            {value > 0 && value}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AttributionPage() {
  const company = useQuery(api.companies.getMyCompany);
  const companyId = company?._id;

  const funnel = useQuery(
    api.tracking.getConversionFunnel,
    companyId ? { companyId } : "skip",
  );

  const sources = useQuery(
    api.tracking.getSourceBreakdown,
    companyId ? { companyId } : "skip",
  );

  const maxFunnel = funnel
    ? Math.max(funnel.pageViews, funnel.leads, funnel.demos, funnel.completed, funnel.closed, 1)
    : 1;

  return (
    <>
      <SEO title="Attribution Dashboard" description="Track your marketing attribution and conversion funnel." noindex />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attribution Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Track where your leads come from and how they convert.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={MousePointerClick} label="Page Views" value={funnel?.pageViews ?? "—"} color="bg-blue-500/20" />
          <StatCard icon={Users} label="Leads" value={funnel?.leads ?? "—"} color="bg-cyan-500/20" />
          <StatCard icon={Target} label="Demos Started" value={funnel?.demos ?? "—"} color="bg-purple-500/20" />
          <StatCard icon={TrendingUp} label="Demos Completed" value={funnel?.completed ?? "—"} color="bg-amber-500/20" />
          <StatCard icon={BarChart3} label="Deals Closed" value={funnel?.closed ?? "—"} color="bg-green-500/20" />
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">Conversion Funnel (Last 30 Days)</h2>
          <div className="space-y-3">
            <FunnelBar label="Page Views" value={funnel?.pageViews ?? 0} max={maxFunnel} color="bg-blue-500" />
            <FunnelBar label="Leads" value={funnel?.leads ?? 0} max={maxFunnel} color="bg-cyan-500" />
            <FunnelBar label="Demos" value={funnel?.demos ?? 0} max={maxFunnel} color="bg-purple-500" />
            <FunnelBar label="Completed" value={funnel?.completed ?? 0} max={maxFunnel} color="bg-amber-500" />
            <FunnelBar label="Closed" value={funnel?.closed ?? 0} max={maxFunnel} color="bg-green-500" />
          </div>
        </div>

        {/* Source Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-bold text-foreground">Lead Sources</h2>
          {sources && sources.length > 0 ? (
            <div className="space-y-2">
              {sources.map((s: { source: string; count: number }) => (
                <div key={s.source} className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
                  <span className="font-medium text-foreground capitalize">{s.source}</span>
                  <span className="text-sm font-bold text-cyan-400">{s.count} leads</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <BarChart3 className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
              <p>No tracking data yet.</p>
              <p className="mt-1 text-sm">Install the AquaReport pixel on your website to start tracking.</p>
            </div>
          )}
        </div>

        {/* Pixel Setup CTA */}
        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h3 className="font-bold text-foreground">Set Up Your Tracking Pixel</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the AquaReport pixel to your website to track page views, leads, and conversions automatically.
          </p>
          <a
            href="/company"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-400"
          >
            Go to Company Settings <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </>
  );
}
