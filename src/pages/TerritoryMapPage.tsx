import { useQuery } from "convex/react";
import {
  AlertTriangle,
  BarChart3,
  Droplets,
  MapPin,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { api } from "../../convex/_generated/api";

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-400";
  if (s >= 60) return "text-amber-400";
  if (s >= 40) return "text-orange-400";
  return "text-red-400";
}
function scoreBg(s: number) {
  if (s >= 80) return "bg-emerald-500";
  if (s >= 60) return "bg-amber-500";
  if (s >= 40) return "bg-orange-500";
  return "bg-red-500";
}

export function TerritoryMapPage() {
  const reports = useQuery(api.reports.getMyReports) ?? [];
  const leads = useQuery(api.leads.getLeads) ?? [];
  const [search, setSearch] = useState("");

  const territories = useMemo(() => {
    const map: Record<
      string,
      {
        zip: string;
        city: string;
        state: string;
        reports: number;
        leads: number;
        avgScore: number;
        totalContaminants: number;
        overLimit: number;
      }
    > = {};

    for (const r of reports) {
      const zip = r.zip || "Unknown";
      if (!map[zip]) {
        map[zip] = {
          zip,
          city: r.city || "",
          state: r.state || "",
          reports: 0,
          leads: 0,
          avgScore: 0,
          totalContaminants: 0,
          overLimit: 0,
        };
      }
      map[zip].reports++;
      map[zip].avgScore += r.waterScore || 0;
      map[zip].totalContaminants += r.totalContaminants || 0;
      map[zip].overLimit += r.overLegalLimits || 0;
    }
    for (const t of Object.values(map)) {
      if (t.reports > 0) t.avgScore = Math.round(t.avgScore / t.reports);
    }
    for (const l of leads) {
      const zip = l.zip || "Unknown";
      if (map[zip]) map[zip].leads++;
    }
    return Object.values(map).sort((a, b) => b.reports - a.reports);
  }, [reports, leads]);

  const filtered = search
    ? territories.filter(
        (t) =>
          t.zip.includes(search) ||
          t.city.toLowerCase().includes(search.toLowerCase()) ||
          t.state.toLowerCase().includes(search.toLowerCase())
      )
    : territories;

  const totalReports = territories.reduce((s, t) => s + t.reports, 0);
  const avgScore = territories.length
    ? Math.round(
        territories.reduce((s, t) => s + t.avgScore, 0) / territories.length
      )
    : 0;
  const hotZones = territories.filter((t) => t.avgScore < 50).length;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <PageHeader
        title="Territory Map"
        subtitle="Water quality intelligence by area."
        icon={MapPin}
        iconColor="text-cyan-400"
        actions={
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search ZIP, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-44 h-9 text-sm"
            />
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Territories"
          value={territories.length}
          color="text-cyan-400"
          icon={MapPin}
        />
        <StatCard
          label="Reports"
          value={totalReports}
          color="text-emerald-400"
          icon={BarChart3}
        />
        <StatCard
          label="Avg Score"
          value={avgScore}
          color={scoreColor(avgScore)}
          icon={Droplets}
        />
        <StatCard
          label="Hot Zones"
          value={hotZones}
          color="text-red-400"
          icon={AlertTriangle}
        />
      </div>

      {/* Territory List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold">Territory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={search ? "No territories match" : "No territory data yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Create water reports to build your territory map."
              }
            />
          ) : (
            <>
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-white/5 mb-1">
                <div className="col-span-2">ZIP</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-1 text-center">Reports</div>
                <div className="col-span-1 text-center">Leads</div>
                <div className="col-span-2 text-center">Avg Score</div>
                <div className="col-span-1 text-center">Issues</div>
                <div className="col-span-2 text-center">Quality</div>
              </div>

              {/* Desktop rows */}
              <div className="hidden md:block space-y-1">
                {filtered.map((t) => (
                  <div
                    key={t.zip}
                    className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg border border-white/5 hover:bg-white/[0.02] transition-colors items-center"
                  >
                    <div className="col-span-2 font-bold text-sm tabular-nums">
                      {t.zip}
                    </div>
                    <div className="col-span-3 text-sm truncate">
                      {t.city}
                      {t.state ? `, ${t.state}` : ""}
                    </div>
                    <div className="col-span-1 text-center text-sm tabular-nums">
                      {t.reports}
                    </div>
                    <div className="col-span-1 text-center text-sm tabular-nums">
                      {t.leads}
                    </div>
                    <div className="col-span-2 text-center">
                      <span
                        className={`text-sm font-bold ${scoreColor(t.avgScore)}`}
                      >
                        {t.avgScore}/100
                      </span>
                    </div>
                    <div className="col-span-1 text-center text-sm text-red-400">
                      {t.overLimit > 0 ? t.overLimit : "—"}
                    </div>
                    <div className="col-span-2">
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreBg(t.avgScore)} transition-all`}
                          style={{ width: `${t.avgScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filtered.map((t) => (
                  <div
                    key={t.zip}
                    className="rounded-xl border border-white/10 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{t.zip}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {t.city}
                          {t.state ? `, ${t.state}` : ""}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-black ${scoreColor(t.avgScore)}`}
                      >
                        {t.avgScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{t.reports} reports</span>
                      <span>{t.leads} leads</span>
                      {t.overLimit > 0 && (
                        <span className="text-red-400">
                          {t.overLimit} over limit
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBg(t.avgScore)} transition-all`}
                        style={{ width: `${t.avgScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
