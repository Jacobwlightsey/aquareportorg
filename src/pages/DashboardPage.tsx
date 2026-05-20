import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Droplets,
  FileText,
  MapPin,
  Search,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "../../convex/_generated/api";

type PipelineStage = "sent" | "claimed" | "tested" | "filtered" | "certified";

const PIPELINE_STAGES: Array<{ key: PipelineStage; label: string; color: string }> = [
  { key: "sent", label: "Report Sent", color: "bg-slate-500" },
  { key: "claimed", label: "Claimed", color: "bg-blue-500" },
  { key: "tested", label: "In-Home Test", color: "bg-amber-500" },
  { key: "filtered", label: "Filtered", color: "bg-emerald-500" },
  { key: "certified", label: "Certified", color: "bg-violet-500" },
];

function hasDashboardReadings(report: any) {
  if (report.inHomeReadings) return true;
  return [report.chlorine, report.hardness, report.tds, report.ph].some((value) => typeof value === "number");
}

function derivePipelineStage(report: any): PipelineStage {
  if (report.certificationComplete || report.certifiedAt) return "certified";
  if (report.filtrationVerified || report.filteredAt || report.filtrationVerifiedAt) return "filtered";
  if (hasDashboardReadings(report)) return "tested";
  if (report.claimedAt || report.consumerId || report.consumerLinkedAt || report.claimed) return "claimed";
  return "sent";
}

function conversionFor(reports: any[]) {
  if (!reports.length) return 0;
  const converted = reports.filter((report) => derivePipelineStage(report) !== "sent").length;
  return Math.round((converted / reports.length) * 100);
}

function timeAgo(timestamp: number) {
  const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function activityMessage(item: any) {
  const actor = item.actorName || "A teammate";
  const metadata = item.metadata || {};
  if (item.action === "report.created") {
    return `${actor} generated report${metadata.zip ? ` for ${metadata.zip}` : ""}`;
  }
  if (item.action === "report.in_home_readings_updated" || item.action === "shared.verify_in_home_results") {
    return `${actor} completed in-home test${metadata.customerZip ? ` for ${metadata.customerZip}` : ""}`;
  }
  if (item.action === "shared.verify_filtration_installs") {
    return `${actor} verified filtration${metadata.systemName ? `: ${metadata.systemName}` : ""}`;
  }
  if (item.action === "shared.lead_pipeline") {
    return `${actor} claimed a consumer lead${metadata.zip ? ` in ${metadata.zip}` : ""}`;
  }
  if (item.action === "lead.created") {
    return `${actor} captured a new report lead`;
  }
  return `${actor} ${String(item.action || "updated workspace").replaceAll("_", " ")}`;
}

export function DashboardPage() {
  const user = useQuery(api.auth.currentUser);
  const company = useQuery(api.companies.getMyCompany);
  const stats = useQuery(api.reports.getStats);
  const reports = useQuery(api.reports.getMyReports);
  const activity = useQuery(api.reports.getRecentActivity, { limit: 8 });
  const territoryInsights = useQuery(api.reports.getTerritoryInsights);
  const newLeadCount = useQuery(api.leads.getNewLeadCount);

  const recentReports = reports?.slice(0, 5) ?? [];
  const allReports = reports ?? [];
  const conversionRate = conversionFor(allReports);
  const now = new Date();
  const currentMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const previousMonthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  const currentMonthReports = allReports.filter((report) => report._creationTime >= currentMonthStart);
  const previousMonthReports = allReports.filter(
    (report) => report._creationTime >= previousMonthStart && report._creationTime < currentMonthStart,
  );
  const conversionTrend = conversionFor(currentMonthReports) - conversionFor(previousMonthReports);
  const pipelineCounts = PIPELINE_STAGES.reduce<Record<PipelineStage, number>>((acc, stage) => {
    acc[stage.key] = 0;
    return acc;
  }, {} as Record<PipelineStage, number>);
  for (const report of allReports) {
    pipelineCounts[derivePipelineStage(report)] += 1;
  }

  // If user has no company, show onboarding
  if (company === null) {
    return <OnboardingPrompt userName={user?.name} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Dealer workspace for creating customer reports, adding field results, and tracking follow-up.
          </p>
        </div>
        <Button asChild>
          <Link to="/generate">
            <Search className="size-4" />
            Create Customer Report
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Reports
            </CardTitle>
            <div className="rounded-lg p-2 bg-blue-500/10">
              <FileText className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {stats?.totalReports ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.thisMonth ?? 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <div className="rounded-lg p-2 bg-emerald-500/10">
              <TrendingUp className="size-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {conversionTrend >= 0 ? "+" : ""}
              {conversionTrend}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Markets Covered
            </CardTitle>
            <div className="rounded-lg p-2 bg-amber-500/10">
              <MapPin className="size-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {stats?.uniqueZips ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              across {stats?.uniqueStates ?? 0} states
            </p>
          </CardContent>
        </Card>

        <Card className={newLeadCount && newLeadCount > 0 ? "border-emerald-500/30 bg-emerald-500/[0.02]" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incoming Leads
            </CardTitle>
            <div className="rounded-lg p-2 bg-violet-500/10">
              <Users className="size-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {newLeadCount ?? 0}
            </div>
            <Link to="/leads" className="text-xs text-blue-500 hover:underline mt-1 inline-block">
              View all leads →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <CustomerPipelineFunnel counts={pipelineCounts} total={allReports.length} />
        <div className="space-y-6">
          <DashboardQuickActions />
          <ActivityFeed items={activity ?? []} />
        </div>
      </div>

      <TerritoryHeatmap insights={territoryInsights ?? []} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Reports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-muted-foreground" />
                Recent Customer Reports
              </CardTitle>
              <CardDescription>Latest dealer-created customer reports</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">
                View All
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <div className="text-center py-8">
                <Droplets className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No reports yet. Create your first customer report.
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link to="/generate">
                    <Search className="size-3" />
                    Create Report
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.map((r) => (
                  <Link
                    key={r._id}
                    to={`/reports/${r._id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm ${
                        (r.waterScore ?? 50) >= 80 ? "bg-emerald-500/10 text-emerald-500" :
                        (r.waterScore ?? 50) >= 60 ? "bg-blue-500/10 text-blue-500" :
                        (r.waterScore ?? 50) >= 40 ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {r.waterScore ?? "—"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {r.customerName || r.utilityName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.utilityName} · {r.city}, {r.state}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.overLegalLimits > 0 && (
                        <span className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
                          {r.overLegalLimits} legal
                        </span>
                      )}
                      {r.overHealthGuidelines > 0 && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                          {r.overHealthGuidelines} health
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(r._creationTime).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Contaminants */}
        <div className="space-y-6">
          {stats?.topContaminants && stats.topContaminants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Contaminants (Your Reports)
                </CardTitle>
                <CardDescription>
                  Most common health guideline exceedances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topContaminants.map((c) => (
                    <div key={c.name} className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-amber-500 shrink-0" />
                      <span className="text-sm font-medium flex-1 truncate">
                        {c.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {c.count} reports
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerPipelineFunnel({
  counts,
  total,
}: {
  counts: Record<PipelineStage, number>;
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-blue-500" />
            Customer Pipeline
          </CardTitle>
          <CardDescription>Report progress from delivery to certification</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pipeline">
            View all
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          {PIPELINE_STAGES.map((stage) => {
            const count = counts[stage.key] || 0;
            const percent = total ? Math.round((count / total) * 100) : 0;
            return (
              <Link
                key={stage.key}
                to="/pipeline"
                className="rounded-xl border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
                  <span className="text-sm font-bold">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${stage.color}`}
                    style={{ width: `${Math.max(count ? 12 : 0, percent)}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{percent}% of pipeline</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardQuickActions() {
  const actions = [
    { label: "New Report", href: "/generate", icon: Search, tone: "bg-blue-500/10 text-blue-500" },
    { label: "Verify Results", href: "/verify", icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-500" },
    { label: "View Leads", href: "/leads", icon: CircleDot, tone: "bg-violet-500/10 text-violet-500" },
    { label: "Analytics", href: "/analytics", icon: Zap, tone: "bg-amber-500/10 text-amber-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="size-5 text-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map((action) => (
          <Button
            key={action.href}
            variant="outline"
            className="h-auto justify-between px-4 py-3"
            asChild
          >
            <Link to={action.href}>
              <span className="flex items-center gap-3">
                <span className={`rounded-lg p-2 ${action.tone}`}>
                  <action.icon className="size-4" />
                </span>
                <span className="font-medium">{action.label}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ items }: { items: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-5 text-blue-500" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Team activity will appear here as reports, tests, leads, and billing events happen.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={String(item.id)} className="flex gap-3">
                <div className="mt-1 size-2 rounded-full bg-blue-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{activityMessage(item)}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TerritoryInsight = {
  zip: string;
  city?: string;
  state?: string;
  riskScore: number;
  totalReports: number;
  totalLeads: number;
  conversionRate: number;
  topContaminants?: string;
};

function riskLabel(score: number) {
  if (score >= 70) return "Severe";
  if (score >= 40) return "Elevated";
  if (score > 0) return "Watch";
  return "Clean";
}

function riskBadgeVariant(score: number) {
  if (score >= 70) return "destructive" as const;
  if (score >= 40) return "warning" as const;
  return "success" as const;
}

function parseTopContaminants(value?: string) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

type ZipFeature = {
  zip: string;
  rings: number[][][];
  centroid?: { lat: number; lon: number };
};

type ZipFeatureState = {
  loading: boolean;
  features: ZipFeature[];
  error?: string;
};

const TIGER_ZCTA_LAYER =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query";
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 520;

function riskFill(score: number) {
  if (score >= 70) return "rgba(239,68,68,0.58)";
  if (score >= 40) return "rgba(249,115,22,0.52)";
  if (score > 0) return "rgba(245,158,11,0.48)";
  return "rgba(16,185,129,0.42)";
}

function ringToPath(ring: number[][], bbox: MapBbox) {
  return ring
    .map(([x, y], index) => {
      const px = ((x - bbox.minX) / (bbox.maxX - bbox.minX)) * MAP_WIDTH;
      const py = ((bbox.maxY - y) / (bbox.maxY - bbox.minY)) * MAP_HEIGHT;
      return `${index === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");
}

type MapBbox = { minX: number; minY: number; maxX: number; maxY: number };

function paddedBbox(features: ZipFeature[]): MapBbox | null {
  const points = features.flatMap((feature) => feature.rings.flat());
  if (points.length === 0) return null;
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = Math.max((maxX - minX) * 0.18, 2500);
  const padY = Math.max((maxY - minY) * 0.18, 2500);
  return { minX: minX - padX, minY: minY - padY, maxX: maxX + padX, maxY: maxY + padY };
}

function satelliteUrl(bbox: MapBbox) {
  const params = new URLSearchParams({
    bbox: `${bbox.minX},${bbox.minY},${bbox.maxX},${bbox.maxY}`,
    bboxSR: "3857",
    imageSR: "3857",
    size: `${MAP_WIDTH},${MAP_HEIGHT}`,
    format: "jpg",
    transparent: "false",
    f: "image",
  });
  return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params}`;
}

async function fetchZipFeatures(zips: string[]): Promise<ZipFeature[]> {
  if (zips.length === 0) return [];
  const quoted = zips.map((zip) => `'${zip.replace(/'/g, "")}'`).join(",");
  const params = new URLSearchParams({
    where: `ZCTA5 IN (${quoted})`,
    outFields: "ZCTA5,BASENAME,NAME,CENTLAT,CENTLON",
    returnGeometry: "true",
    outSR: "3857",
    f: "json",
  });
  const response = await fetch(`${TIGER_ZCTA_LAYER}?${params}`);
  if (!response.ok) throw new Error("ZIP boundary request failed");
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "ZIP boundary request failed");
  return (data.features ?? [])
    .map((feature: any) => ({
      zip: feature.attributes?.ZCTA5 || feature.attributes?.BASENAME,
      rings: feature.geometry?.rings ?? [],
      centroid:
        feature.attributes?.CENTLAT && feature.attributes?.CENTLON
          ? {
              lat: Number(feature.attributes.CENTLAT),
              lon: Number(feature.attributes.CENTLON),
            }
          : undefined,
    }))
    .filter((feature: ZipFeature) => feature.zip && feature.rings.length > 0);
}

function TerritoryHeatmap({ insights }: { insights: TerritoryInsight[] }) {
  const sorted = useMemo(
    () => [...insights].sort((a, b) => b.riskScore - a.riskScore),
    [insights],
  );
  const worst = sorted.slice(0, 5);
  const [activeZip, setActiveZip] = useState<string | null>(null);
  const [featureState, setFeatureState] = useState<ZipFeatureState>({
    loading: false,
    features: [],
  });
  const zips = useMemo(
    () => Array.from(new Set(sorted.slice(0, 30).map((item) => item.zip))).filter(Boolean),
    [sorted],
  );
  const zipKey = zips.join(",");
  const featureByZip = useMemo(
    () => new Map(featureState.features.map((feature) => [feature.zip, feature])),
    [featureState.features],
  );
  const bbox = useMemo(() => paddedBbox(featureState.features), [featureState.features]);
  const imageUrl = bbox ? satelliteUrl(bbox) : "";

  useEffect(() => {
    const currentZips = zipKey ? zipKey.split(",") : [];
    if (currentZips.length === 0) {
      setFeatureState({ loading: false, features: [] });
      return;
    }
    let cancelled = false;
    setFeatureState((current) => ({ ...current, loading: true, error: undefined }));
    fetchZipFeatures(currentZips)
      .then((features) => {
        if (!cancelled) setFeatureState({ loading: false, features });
      })
      .catch((error) => {
        if (!cancelled) {
          setFeatureState({
            loading: false,
            features: [],
            error: error instanceof Error ? error.message : "Map data unavailable",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [zipKey]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5 text-blue-500" />
            Local Coverage Heatmap
          </CardTitle>
          <CardDescription>
            Covered ZIPs ranked by water quality risk from your saved reports
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-1">
            Satellite imagery with Census ZIP Code Tabulation Area boundaries.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> Clean
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-amber-400" /> Watch
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-orange-500" /> Elevated
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-red-500" /> Severe
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
            <MapPin className="size-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium">No covered ZIPs yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Generate reports to build your local risk heatmap.
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link to="/generate">
                <Search className="size-3" />
                Generate First Report
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <div>
              <div className="relative min-h-[380px] overflow-hidden rounded-xl border bg-slate-950">
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                )}
                <div className="absolute inset-0 bg-slate-950/20" />
                <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur">
                  <p className="font-semibold">Local satellite view</p>
                  <p className="text-white/60">
                    {featureState.loading
                      ? "Loading real ZIP boundaries..."
                      : featureState.error
                        ? "Boundary data unavailable"
                        : "Hover a ZIP zone for details"}
                  </p>
                </div>
                {bbox && (
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                    role="img"
                    aria-label="ZIP code risk heatmap"
                    preserveAspectRatio="none"
                  >
                    {sorted.map((item) => {
                      const feature = featureByZip.get(item.zip);
                      if (!feature) return null;
                      const contaminants = parseTopContaminants(item.topContaminants);
                      const path = feature.rings.map((ring) => `${ringToPath(ring, bbox)} Z`).join(" ");
                      return (
                        <path
                          key={item.zip}
                          d={path}
                          fill={riskFill(item.riskScore)}
                          stroke={activeZip === item.zip ? "white" : "rgba(255,255,255,0.85)"}
                          strokeWidth={activeZip === item.zip ? 4 : 2}
                          vectorEffect="non-scaling-stroke"
                          className="cursor-pointer transition-opacity hover:opacity-90"
                          role="button"
                          tabIndex={0}
                          onMouseEnter={() => setActiveZip(item.zip)}
                          onMouseLeave={() => setActiveZip(null)}
                          onFocus={() => setActiveZip(item.zip)}
                          onBlur={() => setActiveZip(null)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setActiveZip(item.zip);
                            }
                          }}
                        >
                          <title>
                            {`ZIP ${item.zip}: ${riskLabel(item.riskScore)} risk, ${item.riskScore}/100. ${item.totalReports} report${item.totalReports === 1 ? "" : "s"}.${contaminants.length ? ` Top concern: ${contaminants[0].name}.` : ""}`}
                          </title>
                        </path>
                      );
                    })}
                  </svg>
                )}
                {activeZip && (
                  <div className="absolute bottom-4 left-4 max-w-xs rounded-xl border border-white/10 bg-slate-950/90 p-4 text-white shadow-xl backdrop-blur">
                    {(() => {
                      const item = sorted.find((entry) => entry.zip === activeZip);
                      const contaminants = parseTopContaminants(item?.topContaminants);
                      if (!item) return null;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">ZIP {item.zip}</p>
                              <p className="text-xs text-white/60">
                                {[item.city, item.state].filter(Boolean).join(", ") || "Covered area"}
                              </p>
                            </div>
                            <Badge variant={riskBadgeVariant(item.riskScore)}>
                              {riskLabel(item.riskScore)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><p className="text-white/50">Risk</p><p className="font-semibold">{item.riskScore}/100</p></div>
                            <div><p className="text-white/50">Reports</p><p className="font-semibold">{item.totalReports}</p></div>
                            <div><p className="text-white/50">Leads</p><p className="font-semibold">{item.totalLeads}</p></div>
                          </div>
                          {contaminants.length > 0 && (
                            <p className="text-xs text-white/70">
                              Top concern: {contaminants.map((contaminant: any) => contaminant.name).join(", ")}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                {!bbox && !featureState.loading && (
                  <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">
                    <div className="rounded-xl border border-white/10 bg-slate-950/80 p-5 backdrop-blur">
                      <MapPin className="mx-auto mb-3 size-8 text-white/60" />
                      <p className="font-semibold">Real ZIP boundaries are not available yet</p>
                      <p className="mt-1 text-sm text-white/60">
                        Generate reports for Census-backed ZIP areas to populate the satellite heatmap.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                ZIP areas use Census ZCTAs, which approximate USPS ZIP service areas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <p className="font-semibold text-sm">Worst nearby areas</p>
              </div>
              {worst.map((item, index) => (
                <div key={item.zip} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">
                        {index + 1}. ZIP {item.zip}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[item.city, item.state].filter(Boolean).join(", ") || "Covered area"}
                      </p>
                    </div>
                    <Badge variant={riskBadgeVariant(item.riskScore)}>
                      {item.riskScore}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={item.riskScore >= 70 ? "h-full bg-red-500" : item.riskScore >= 40 ? "h-full bg-orange-500" : "h-full bg-amber-400"}
                      style={{ width: `${Math.max(6, item.riskScore)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.totalReports} report{item.totalReports === 1 ? "" : "s"} · {item.totalLeads} lead{item.totalLeads === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OnboardingPrompt({ userName }: { userName?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-blue-500/10">
          <Droplets className="size-8 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your company profile to start generating branded water
            quality reports for your customers.
          </p>
        </div>
        <Button size="lg" asChild>
          <Link to="/company">
            Set Up Company
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
