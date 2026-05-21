import { useQuery } from "convex/react";
import {
  ChevronRight,
  Droplets,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  derivePipelineStage,
  PIPELINE_STAGES,
  scoreClass,
  stageMeta,
  type PipelineStage,
} from "@/lib/pipeline";
import { FreeTierBanner } from "@/components/FreeTierCTA";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { api } from "../../convex/_generated/api";

type ViewMode = "cards" | "kanban" | "table";

function ScoreBadge({ score }: { score?: number }) {
  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-base font-black ${scoreClass(score)}`}
    >
      {score ?? "--"}
    </div>
  );
}

function StagePill({ report }: { report: any }) {
  const meta = stageMeta(derivePipelineStage(report));
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
      {meta.label}
    </span>
  );
}

function CustomerCard({ report }: { report: any }) {
  const stage = derivePipelineStage(report);
  const meta = stageMeta(stage);
  const created = report._creationTime
    ? new Date(report._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <Link to={`/customers/${report._id}`}>
      <Card className="transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 active:scale-[0.99] bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-sm">
                {report.customerName || report.utilityName}
              </p>
              {report.customerEmail && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {report.customerEmail}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                {report.customerCity || report.city}, {report.customerState || report.state} {report.customerZip || report.zip}
              </p>
            </div>
            <ScoreBadge score={report.waterScore} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {report.overLegalLimits > 0 && (
              <Badge variant="destructive" className="text-[10px] rounded-md">
                {report.overLegalLimits} legal
              </Badge>
            )}
            {report.overHealthGuidelines > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10 rounded-md">
                {report.overHealthGuidelines} health
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] rounded-md">
              {report.totalContaminants} total
            </Badge>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
              <span className={`size-2 rounded-full ${meta.color}`} />
              {meta.label}
            </span>
            {created && (
              <span className="text-[11px] text-muted-foreground">{created}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function KanbanView({ reports }: { reports: any[] }) {
  const grouped = useMemo(() => {
    const map: Record<PipelineStage, any[]> = {
      sent: [],
      claimed: [],
      tested: [],
      filtered: [],
      certified: [],
    };
    for (const r of reports) {
      const stage = derivePipelineStage(r);
      map[stage].push(r);
    }
    return map;
  }, [reports]);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage.key} className="space-y-3">
          <Card className="bg-muted/30">
            <CardHeader className="p-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{stage.label}</span>
                <Badge variant="secondary">{grouped[stage.key]?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
          </Card>
          <div className="space-y-3">
            {(grouped[stage.key] ?? [])
              .sort((a: any, b: any) => b._creationTime - a._creationTime)
              .map((report: any) => (
                <CustomerCard key={report._id} report={report} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableView({ reports }: { reports: any[] }) {
  const navigate = useNavigate();
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Score</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Contact</TableHead>
              <TableHead className="hidden sm:table-cell">Flags</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow
                key={r._id}
                className="cursor-pointer"
                onClick={() => navigate(`/customers/${r._id}`)}
              >
                  <TableCell>
                    <ScoreBadge score={r.waterScore} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{r.customerName || r.utilityName}</p>
                    <p className="text-xs text-muted-foreground">{r.utilityName}</p>
                  </TableCell>
                  <TableCell>
                    <StagePill report={r} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {r.customerCity || r.city}, {r.customerState || r.state} {r.customerZip || r.zip}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-xs text-muted-foreground">
                      <p>{r.customerEmail || "—"}</p>
                      <p>{r.customerPhone || "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex gap-1">
                      {r.overHealthGuidelines > 0 && (
                        <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                          {r.overHealthGuidelines}h
                        </Badge>
                      )}
                      {r.overLegalLimits > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {r.overLegalLimits}L
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground/50" />
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ViewToggle({ view, onViewChange }: { view: ViewMode; onViewChange: (v: ViewMode) => void }) {
  const modes: { key: ViewMode; label: string }[] = [
    { key: "cards", label: "Cards" },
    { key: "kanban", label: "Kanban" },
    { key: "table", label: "Table" },
  ];
  return (
    <div className="inline-flex items-center rounded-lg bg-muted/50 p-0.5">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onViewChange(m.key)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === m.key
              ? "bg-cyan-500 text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function recentCount(reports: any[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return reports.filter((r: any) => r._creationTime > weekAgo).length;
}

export function CustomersPage() {
  const reports = useQuery(api.reports.getMyReports);
  const { isFree, hasUsedTrial, canCreateReport, totalReports } = useFreeTrial();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("cards");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let list = reports ?? [];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r: any) =>
          (r.customerName || "").toLowerCase().includes(q) ||
          r.utilityName.toLowerCase().includes(q) ||
          (r.customerEmail || "").toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.zip.includes(q)
      );
    }
    if (stageFilter !== "all") {
      list = list.filter((r: any) => derivePipelineStage(r) === stageFilter);
    }
    return list.slice().sort((a: any, b: any) => b._creationTime - a._creationTime);
  }, [reports, search, stageFilter]);

  if (reports === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  const thisWeek = recentCount(reports);

  return (
    <div className="space-y-5">
      {/* Free tier upgrade banner */}
      {isFree && hasUsedTrial && <FreeTierBanner totalReports={totalReports} />}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} customer{reports.length !== 1 ? "s" : ""} · {thisWeek} this week
          </p>
        </div>
        {canCreateReport ? (
          <Button asChild className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white rounded-full px-5 shadow-lg shadow-red-500/20">
            <Link to="/customers/new">
              <Plus className="size-4" />
              New Customer
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white rounded-full px-5 shadow-lg shadow-amber-500/20">
            <Link to="/subscription">
              Upgrade to Create More
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-full bg-muted/40 border-0 pl-4 pr-4 placeholder:text-muted-foreground/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onViewChange={setView} />
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-9 w-[130px] rounded-lg bg-muted/40 border-0">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Droplets className="mb-4 size-12 text-muted-foreground/30" />
            <h2 className="font-semibold">
              {search || stageFilter !== "all"
                ? "No customers match your filters"
                : "No customers yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || stageFilter !== "all"
                ? "Try broadening your search"
                : "Create your first customer to get started"}
            </p>
            {!search && stageFilter === "all" && (
              <Button asChild className="mt-4 bg-red-500 hover:bg-red-600 text-white rounded-full px-5">
                <Link to="/customers/new">
                  <Plus className="size-4" />
                  Create Customer
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === "kanban" ? (
        <KanbanView reports={filtered} />
      ) : view === "table" ? (
        <TableView reports={filtered} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r: any) => (
            <CustomerCard key={r._id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
