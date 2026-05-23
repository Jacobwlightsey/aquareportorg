import { useQuery } from "convex/react";
import {
  AlertTriangle,
  BarChart3,
  Droplets,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "../../convex/_generated/api";

export function TerritoryMapPage() {
  const reports = useQuery(api.reports.list) ?? [];
  const leads = useQuery(api.leads.getLeads) ?? [];
  const [search, setSearch] = useState("");

  // Aggregate data by ZIP code
  const territories = useMemo(() => {
    const map: Record<string, {
      zip: string;
      city: string;
      state: string;
      reports: number;
      leads: number;
      avgScore: number;
      totalContaminants: number;
      overLimit: number;
    }> = {};

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

    // Average scores
    for (const t of Object.values(map)) {
      if (t.reports > 0) t.avgScore = Math.round(t.avgScore / t.reports);
    }

    // Count leads per zip
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
    ? Math.round(territories.reduce((s, t) => s + t.avgScore, 0) / territories.length)
    : 0;
  const hotZones = territories.filter((t) => t.avgScore < 50).length;

  function getScoreColor(score: number) {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  }

  function getScoreBg(score: number) {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Territory Map</h1>
          <p className="text-sm text-muted-foreground">Water quality intelligence by area.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search ZIP, city, or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-56"
          />
        </div>
      </div>

      {/* Territory Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10">
              <MapPin className="size-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Territories</p>
              <p className="text-xl font-black">{territories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <BarChart3 className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Reports</p>
              <p className="text-xl font-black">{totalReports}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Droplets className="size-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Score</p>
              <p className={`text-xl font-black ${getScoreColor(avgScore)}`}>{avgScore}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10">
              <AlertTriangle className="size-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hot Zones</p>
              <p className="text-xl font-black text-red-400">{hotZones}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territory List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Territory Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="size-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {search ? "No territories match your search." : "No territory data yet. Create water reports to build your map."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-2">ZIP</div>
                <div className="col-span-3">Location</div>
                <div className="col-span-1 text-center">Reports</div>
                <div className="col-span-1 text-center">Leads</div>
                <div className="col-span-2 text-center">Avg Score</div>
                <div className="col-span-1 text-center">Issues</div>
                <div className="col-span-2 text-center">Quality</div>
              </div>
              {filtered.map((t) => (
                <div
                  key={t.zip}
                  className="grid grid-cols-12 gap-2 px-3 py-3 rounded-lg border border-white/10 hover:bg-white/[0.02] transition-colors items-center"
                >
                  <div className="col-span-2 font-bold text-sm">{t.zip}</div>
                  <div className="col-span-3 text-sm">
                    {t.city}{t.state ? `, ${t.state}` : ""}
                  </div>
                  <div className="col-span-1 text-center text-sm">{t.reports}</div>
                  <div className="col-span-1 text-center text-sm">{t.leads}</div>
                  <div className="col-span-2 text-center">
                    <span className={`text-sm font-bold ${getScoreColor(t.avgScore)}`}>
                      {t.avgScore}/100
                    </span>
                  </div>
                  <div className="col-span-1 text-center text-sm text-red-400">
                    {t.overLimit > 0 ? t.overLimit : "—"}
                  </div>
                  <div className="col-span-2">
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getScoreBg(t.avgScore)} transition-all`}
                        style={{ width: `${t.avgScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
