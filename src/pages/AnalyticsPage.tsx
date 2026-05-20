import { useQuery } from "convex/react";
import { Award, BarChart3, ClipboardCheck, Droplets, MapPin, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PIPELINE_STAGES,
  derivePipelineStage,
  parseContaminants,
  stageRank,
} from "@/lib/pipeline";
import { api } from "../../convex/_generated/api";

export function AnalyticsPage() {
  const reports = useQuery(api.reports.getMyReports);
  const stats = useQuery(api.reports.getStats);
  const insights = useQuery(api.reports.getTerritoryInsights);
  const allReports = reports ?? [];

  const stageCounts = PIPELINE_STAGES.reduce<Record<string, number>>((acc, stage) => {
    acc[stage.key] = 0;
    return acc;
  }, {});
  for (const report of allReports) stageCounts[derivePipelineStage(report)] += 1;

  const leaderboard = buildLeaderboard(allReports);
  const contaminants = buildContaminants(allReports);

  if (reports === undefined || insights === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conversion, territory, team, and contaminant insights from your dealer workspace.
          </p>
        </div>
        <Button asChild>
          <Link to="/pipeline">
            <ClipboardCheck className="size-4" />
            View Pipeline
          </Link>
        </Button>
      </div>

      <ConversionFunnel counts={stageCounts} total={allReports.length} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]">
        <TerritoryTable insights={insights ?? []} />
        <TeamLeaderboard rows={leaderboard} />
      </div>

      <TopContaminants contaminants={contaminants} fallback={stats?.topContaminants ?? []} />
    </div>
  );
}

function ConversionFunnel({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-5 text-blue-500" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>Reports through claimed, tested, filtered, and certified stages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage, index) => {
            const count = counts[stage.key] || 0;
            const previous = index === 0 ? total : counts[PIPELINE_STAGES[index - 1].key] || 0;
            const percentOfTotal = total ? Math.round((count / total) * 100) : 0;
            const dropOff = index === 0 || previous === 0 ? 0 : Math.max(0, Math.round(((previous - count) / previous) * 100));
            return (
              <div key={stage.key} className="rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <div className="h-16 rounded-lg bg-muted p-1">
                  <div
                    className={`h-full rounded-md ${stage.color}`}
                    style={{ width: `${Math.max(count ? 14 : 0, percentOfTotal)}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{percentOfTotal}% of reports</p>
                {index > 0 && <p className="text-xs text-muted-foreground">{dropOff}% drop-off</p>}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TerritoryTable({ insights }: { insights: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-5 text-amber-500" />
          Territory Insights
        </CardTitle>
        <CardDescription>ZIP-level report, lead, and conversion performance.</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <Empty message="Generate reports to build territory insights." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ZIP</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Reports</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insights.slice(0, 12).map((item) => (
                <TableRow key={item.zip}>
                  <TableCell className="font-medium">{item.zip}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={item.riskScore} className="w-20" variant={item.riskScore >= 70 ? "destructive" : item.riskScore >= 40 ? "warning" : "success"} />
                      <span>{item.riskScore}</span>
                    </div>
                  </TableCell>
                  <TableCell>{item.totalReports}</TableCell>
                  <TableCell>{item.totalLeads}</TableCell>
                  <TableCell>{item.conversionRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function TeamLeaderboard({ rows }: { rows: Array<{ rep: string; reports: number; claims: number; verifications: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-violet-500" />
          Team Leaderboard
        </CardTitle>
        <CardDescription>Rep activity derived from generated reports.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty message="Rep performance appears after reports are generated." />
        ) : (
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={row.rep} className="rounded-xl border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600">{index + 1}</span>
                    <span className="font-semibold text-sm">{row.rep}</span>
                  </div>
                  <Badge variant="secondary">{row.reports} reports</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <span>{row.reports} generated</span>
                  <span>{row.claims} claims</span>
                  <span>{row.verifications} verified</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopContaminants({
  contaminants,
  fallback,
}: {
  contaminants: Array<{ name: string; count: number }>;
  fallback: Array<{ name: string; count: number }>;
}) {
  const rows = contaminants.length ? contaminants : fallback;
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="size-5 text-red-500" />
          Top Contaminants
        </CardTitle>
        <CardDescription>Most-seen contaminants across all saved reports.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty message="Contaminant analytics will appear after reports are generated." />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 10).map((row, index) => (
              <div key={row.name} className="grid gap-2 md:grid-cols-[220px_1fr_60px] md:items-center">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  <span className="truncate font-medium">{row.name}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }} />
                </div>
                <span className="text-sm text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Empty({ message }: { message: string }) {
  return <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{message}</p>;
}

function buildLeaderboard(reports: any[]) {
  const byRep = new Map<string, { rep: string; reports: number; claims: number; verifications: number }>();
  for (const report of reports) {
    const rep = report.generatedByName || "Unknown rep";
    const row = byRep.get(rep) || { rep, reports: 0, claims: 0, verifications: 0 };
    row.reports += 1;
    const stage = derivePipelineStage(report);
    if (stageRank[stage] >= stageRank.claimed) row.claims += 1;
    if (stageRank[stage] >= stageRank.tested) row.verifications += 1;
    byRep.set(rep, row);
  }
  return Array.from(byRep.values()).sort((a, b) => b.reports - a.reports || b.verifications - a.verifications);
}

function buildContaminants(reports: any[]) {
  const counts = new Map<string, number>();
  for (const report of reports) {
    for (const contaminant of parseContaminants(report.contaminants)) {
      const name = contaminant.contaminant || contaminant.name || contaminant.contaminant_name;
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
