import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, BookOpen, Download, Droplets, FileText, List, Search, Shield, Table2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { derivePipelineStage, scoreClass, stageMeta } from "@/lib/pipeline";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function ReportsPage() {
  const reports = useQuery(api.reports.getMyReports);
  const deleteReport = useMutation(api.reports.deleteReport);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<Id<"reports"> | null>(null);
  const [view, setView] = useState<"cards" | "table">("cards");

  const filtered = (reports ?? []).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.utilityName.toLowerCase().includes(q) ||
      (r.customerName || "").toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q) ||
      r.zip.includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteReport({ reportId: deleteId });
      toast.success("Report deleted");
    } catch {
      toast.error("Failed to delete report");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Reports</h1>
          <p className="text-sm text-muted-foreground">
            {reports?.length ?? 0} saved customer reports. Track score, stage, PDFs, and follow-up.
          </p>
        </div>
        <Button asChild>
          <Link to="/generate">
            <Search className="size-4" />
            Create Customer Report
          </Link>
        </Button>
      </div>

      <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by customer, utility, city, state, or ZIP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10"
        />
        <ToggleGroup type="single" value={view} onValueChange={(value: "cards" | "table") => value && setView(value)}>
          <ToggleGroupItem value="cards" aria-label="Card view"><List className="size-4" /></ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view"><Table2 className="size-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>

      {!reports ? (
        <div className="flex items-center justify-center py-20">
          <Droplets className="size-8 animate-pulse text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">{search ? "No reports match your search" : "No customer reports created yet"}</p>
            {!search && (
              <Button className="mt-4" asChild>
                <Link to="/generate">Create Your First Customer Report</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : view === "cards" ? (
        <div className="space-y-3">
          {filtered.map((r) => <ReportCard key={r._id} report={r} onDelete={() => setDeleteId(r._id)} />)}
        </div>
      ) : (
        <ReportsTable reports={filtered} onDelete={(id) => setDeleteId(id)} />
      )}

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The report will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StagePill({ report }: { report: any }) {
  const stage = stageMeta(derivePipelineStage(report));
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${stage.badge}`}>{stage.label}</span>;
}

function ReportCard({ report: r, onDelete }: { report: any; onDelete: () => void }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <Link to={`/reports/${r._id}`} className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${scoreClass(r.waterScore)}`}>
              {r.waterScore ?? "--"}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{r.customerName || r.utilityName}</p>
                <StagePill report={r} />
              </div>
              <p className="text-sm text-muted-foreground">
                {r.utilityName} · {r.city}, {r.state} · ZIP {r.zip}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Generated by {r.generatedByName} · {new Date(r._creationTime).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="rounded bg-muted px-2 py-1 text-xs font-medium">{r.totalContaminants} detected</span>
            {r.overHealthGuidelines > 0 && (
              <span className="flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-600 dark:bg-amber-950/50">
                <AlertTriangle className="size-3" /> {r.overHealthGuidelines}
              </span>
            )}
            {r.overLegalLimits > 0 && (
              <span className="flex items-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 dark:bg-red-950/50">
                <Shield className="size-3" /> {r.overLegalLimits}
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {r.flipbookUrl && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/reports/${r._id}/flipbook`}><BookOpen className="size-3" /> Flipbook</Link>
              </Button>
            )}
            {r.pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={r.pdfUrl} target="_blank" rel="noreferrer"><Download className="size-3" /> PDF</a>
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="size-3" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsTable({ reports, onDelete }: { reports: any[]; onDelete: (id: Id<"reports">) => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Score</TableHead>
              <TableHead>Report</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((r) => (
              <TableRow key={r._id}>
                <TableCell>
                  <div className={`flex size-10 items-center justify-center rounded-full border-2 text-xs font-black ${scoreClass(r.waterScore)}`}>
                    {r.waterScore ?? "--"}
                  </div>
                </TableCell>
                <TableCell>
                  <Link to={`/reports/${r._id}`} className="font-medium hover:underline">{r.customerName || r.utilityName}</Link>
                  <p className="text-xs text-muted-foreground">{r.utilityName}</p>
                </TableCell>
                <TableCell><StagePill report={r} /></TableCell>
                <TableCell>{r.city}, {r.state} {r.zip}</TableCell>
                <TableCell>{r.overHealthGuidelines} health / {r.overLegalLimits} legal</TableCell>
                <TableCell>{new Date(r._creationTime).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onDelete(r._id)}><Trash2 className="size-3" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
