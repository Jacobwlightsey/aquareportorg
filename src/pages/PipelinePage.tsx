import { useQuery } from "convex/react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Droplets,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  Table2,
  Trello,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { api } from "../../convex/_generated/api";

type StageKey = "sent" | "claimed" | "tested" | "filtered" | "certified";

const STAGES: Array<{ key: StageKey; label: string; hint: string }> = [
  { key: "sent", label: "Report Sent", hint: "Report exists, waiting on claim" },
  { key: "claimed", label: "Claimed", hint: "Homeowner has claimed or linked" },
  { key: "tested", label: "In-Home Test", hint: "Dealer readings have been entered" },
  { key: "filtered", label: "Filtered", hint: "Filtration install verified" },
  { key: "certified", label: "Certified", hint: "Final certification complete" },
];

const stageRank: Record<StageKey, number> = {
  sent: 1,
  claimed: 2,
  tested: 3,
  filtered: 4,
  certified: 5,
};

function scoreColor(score?: number) {
  if (score === undefined) return "border-slate-300 text-slate-500 bg-slate-50";
  if (score >= 80) return "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30";
  if (score >= 60) return "border-slate-400 text-slate-700 bg-slate-50 dark:bg-slate-900/60 dark:text-slate-200";
  if (score >= 40) return "border-orange-400 text-orange-700 bg-orange-50 dark:bg-orange-950/30";
  return "border-rose-400 text-rose-700 bg-rose-50 dark:bg-rose-950/30";
}

function hasReadings(report: any) {
  if (report.inHomeReadings) return true;
  return [report.chlorine, report.hardness, report.tds, report.ph].some((value) => typeof value === "number");
}

function deriveStage(report: any): StageKey {
  if (report.certificationComplete || report.certifiedAt) return "certified";
  if (report.filtrationVerified || report.filteredAt || report.filtrationVerifiedAt) return "filtered";
  if (hasReadings(report)) return "tested";
  if (report.claimedAt || report.consumerId || report.consumerLinkedAt || report.claimed) return "claimed";
  return "sent";
}

function customerName(report: any) {
  return report.customerName || "Unassigned homeowner";
}

function customerLocation(report: any) {
  const cityState = [report.customerCity || report.city, report.customerState || report.state].filter(Boolean).join(", ");
  const zip = report.customerZip || report.zip;
  return [cityState, zip ? `ZIP ${zip}` : ""].filter(Boolean).join(" · ");
}

function reportUrl(report: any) {
  return `/reports/${report._id}`;
}

function publicUrl(report: any) {
  return report.shareToken ? `${window.location.origin}/r/${report.shareToken}` : "";
}

function PipelineCard({
  report,
  stage,
  onMove,
}: {
  report: any;
  stage: StageKey;
  onMove: (reportId: string, stage: StageKey) => void;
}) {
  const score = report.waterScore;
  const link = report.shareToken ? publicUrl(report) : "";

  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 text-sm font-black ${scoreColor(score)}`}>
            {score ?? "--"}
          </div>
          <PipelineMenu report={report} onMove={onMove} />
        </div>

        <div className="min-w-0">
          <Link to={reportUrl(report)} className="font-semibold text-sm hover:underline">
            {customerName(report)}
          </Link>
          <p className="mt-0.5 text-xs text-muted-foreground">{customerLocation(report)}</p>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {report.customerEmail && (
            <a href={`mailto:${report.customerEmail}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Mail className="size-3" />
              <span className="truncate">{report.customerEmail}</span>
            </a>
          )}
          {report.customerPhone && (
            <a href={`tel:${report.customerPhone}`} className="flex items-center gap-1.5 hover:text-foreground">
              <Phone className="size-3" />
              <span>{report.customerPhone}</span>
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <UserRound className="size-3" />
            <span className="truncate">{report.generatedByName || "Unknown rep"}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3" />
            <span>{new Date(report._creationTime).toLocaleDateString()}</span>
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px]">{STAGES.find((item) => item.key === stage)?.label}</Badge>
          {report.overHealthGuidelines > 0 && <Badge variant="outline" className="text-[10px]">{report.overHealthGuidelines} health flags</Badge>}
          {report.overLegalLimits > 0 && <Badge variant="destructive" className="text-[10px]">{report.overLegalLimits} legal</Badge>}
        </div>

        {link && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-full text-xs"
            onClick={() => {
              void navigator.clipboard?.writeText(link);
              toast.success("Customer report link copied.");
            }}
          >
            Copy report link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineMenu({
  report,
  onMove,
}: {
  report: any;
  onMove: (reportId: string, stage: StageKey) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to={reportUrl(report)}>
            <FileText className="size-4" />
            View Report
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (report.customerEmail) {
              window.location.href = `mailto:${report.customerEmail}?subject=Your AquaReport water report&body=Hi ${customerName(report)},%0D%0A%0D%0AHere is your water report: ${encodeURIComponent(report.shareToken ? publicUrl(report) : "")}`;
            } else {
              toast.info("No customer email is saved for this report.");
            }
          }}
        >
          <Mail className="size-4" />
          Send Reminder
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Move Stage</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {STAGES.map((stage) => (
              <DropdownMenuItem key={stage.key} onClick={() => onMove(String(report._id), stage.key)}>
                {stage.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/verify">
            <CheckCircle2 className="size-4" />
            Add Verification
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PipelinePage() {
  const reports = useQuery(api.reports.getMyReports);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [stageOverrides, setStageOverrides] = useState<Record<string, StageKey>>({});

  const records = useMemo(() => {
    return (reports ?? []).map((report: any) => {
      const id = String(report._id);
      const stage = stageOverrides[id] || deriveStage(report);
      return { report, stage };
    });
  }, [reports, stageOverrides]);

  const grouped = useMemo(() => {
    return STAGES.reduce<Record<StageKey, Array<{ report: any; stage: StageKey }>>>((acc, stage) => {
      acc[stage.key] = records
        .filter((record) => record.stage === stage.key)
        .sort((a, b) => b.report._creationTime - a.report._creationTime);
      return acc;
    }, {} as Record<StageKey, Array<{ report: any; stage: StageKey }>>);
  }, [records]);

  const moveStage = (reportId: string, stage: StageKey) => {
    setStageOverrides((current) => ({ ...current, [reportId]: stage }));
    toast.success(`Moved to ${STAGES.find((item) => item.key === stage)?.label}.`);
  };

  if (reports === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track homeowners from report delivery through verified filtration and certification.
          </p>
        </div>
        <ToggleGroup type="single" value={view} onValueChange={(value: "kanban" | "table") => value && setView(value)}>
          <ToggleGroupItem value="kanban" aria-label="Kanban view">
            <Trello className="size-4" />
            Kanban
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <Table2 className="size-4" />
            Table
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList className="mb-4 size-12 text-muted-foreground/30" />
            <h2 className="font-semibold">No customers in the pipeline yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a customer report to start tracking it here.
            </p>
            <Button asChild className="mt-4">
              <Link to="/generate">Create Customer Report</Link>
            </Button>
          </CardContent>
        </Card>
      ) : view === "kanban" ? (
        <div className="grid gap-4 xl:grid-cols-5">
          {STAGES.map((stage) => (
            <div key={stage.key} className="space-y-3">
              <Card className="bg-muted/30">
                <CardHeader className="p-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span>{stage.label}</span>
                    <Badge variant="secondary">{grouped[stage.key]?.length ?? 0}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{stage.hint}</p>
                </CardHeader>
              </Card>
              <div className="space-y-3">
                {(grouped[stage.key] ?? []).map(({ report }) => (
                  <PipelineCard
                    key={report._id}
                    report={report}
                    stage={stage.key}
                    onMove={moveStage}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Score</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records
                  .slice()
                  .sort((a, b) => stageRank[a.stage] - stageRank[b.stage] || b.report._creationTime - a.report._creationTime)
                  .map(({ report, stage }) => (
                    <TableRow key={report._id}>
                      <TableCell>
                        <div className={`flex size-10 items-center justify-center rounded-full border-2 text-xs font-black ${scoreColor(report.waterScore)}`}>
                          {report.waterScore ?? "--"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link to={reportUrl(report)} className="font-medium hover:underline">{customerName(report)}</Link>
                        <p className="text-xs text-muted-foreground">{customerLocation(report)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{STAGES.find((item) => item.key === stage)?.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <p>{report.customerEmail || "No email"}</p>
                          <p>{report.customerPhone || "No phone"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{report.generatedByName || "Unknown"}</TableCell>
                      <TableCell>{new Date(report._creationTime).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <PipelineMenu report={report} onMove={moveStage} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
