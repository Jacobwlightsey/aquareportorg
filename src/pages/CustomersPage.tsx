import { useQuery } from "convex/react";
import {
  ChevronRight,
  Droplets,
  Filter,
  LayoutGrid,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Table2,
  Trello,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  derivePipelineStage,
  PIPELINE_STAGES,
  scoreClass,
  stageMeta,
  type PipelineStage,
} from "@/lib/pipeline";
/* No plan gate needed on Customers — all tiers can view & create customers */
import { api } from "../../convex/_generated/api";

type ViewMode = "cards" | "kanban" | "table";

function ScoreBadge({ score }: { score?: number }) {
  return (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${scoreClass(score)}`}
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

  return (
    <Link to={`/customers/${report._id}`}>
      <Card className="transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ScoreBadge score={report.waterScore} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-sm">
                  {report.customerName || report.utilityName}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}>
                  {meta.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">
                  {report.customerCity || report.city}, {report.customerState || report.state} · ZIP{" "}
                  {report.customerZip || report.zip}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {report.customerEmail && (
                  <span className="flex items-center gap-1 truncate">
                    <Mail className="size-3" />
                    <span className="truncate max-w-[140px]">{report.customerEmail}</span>
                  </span>
                )}
                {report.customerPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3" />
                    {report.customerPhone}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground/50 mt-1" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              {report.totalContaminants} detected
            </Badge>
            {report.overHealthGuidelines > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                {report.overHealthGuidelines} health
              </Badge>
            )}
            {report.overLegalLimits > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {report.overLegalLimits} legal
              </Badge>
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
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
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

export function CustomersPage() {
  const reports = useQuery(api.reports.getMyReports);
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} customer{reports.length !== 1 ? "s" : ""} · Track from report through certification
          </p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link to="/customers/new">
            <Plus className="size-4" />
            New Customer
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, city, ZIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-10 w-[140px]">
              <Filter className="size-3.5 mr-1.5" />
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(v: ViewMode) => v && setView(v)}
            className="hidden sm:flex"
          >
            <ToggleGroupItem value="cards" aria-label="Cards">
              <LayoutGrid className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="kanban" aria-label="Kanban">
              <Trello className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table">
              <Table2 className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <Card>
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
              <Button asChild className="mt-4">
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
