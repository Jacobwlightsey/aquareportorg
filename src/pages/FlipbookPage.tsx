import { useQuery } from "convex/react";
import { ArrowLeft, BookOpen, Download, ExternalLink, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export function FlipbookPage() {
  const { reportId, shareToken } = useParams<{ reportId?: string; shareToken?: string }>();
  const privateReport = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as Id<"reports"> } : "skip",
  );
  const publicReport = useQuery(
    api.reports.getPublicReport,
    shareToken ? { shareToken } : "skip",
  );
  const report = reportId ? privateReport : publicReport;
  const backUrl = shareToken ? `/r/${shareToken}` : reportId ? `/customers/${reportId}` : "/customers";

  if (report === undefined) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!report || !report.flipbookUrl) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center p-6">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <BookOpen className="mx-auto size-10 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-bold">Flipbook not ready yet</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Build the PDF and flipbook from the dealer report first.
              </p>
            </div>
            <Button asChild>
              <Link to={backUrl}>
                <ArrowLeft className="size-4" />
                Back to Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex flex-col gap-3 border-b border-white/10 bg-slate-950/95 px-4 py-3 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link to={backUrl}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{report.customerName || report.utilityName}</p>
            <p className="truncate text-xs text-slate-400">{report.utilityName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {report.pdfUrl && (
            <Button variant="secondary" size="sm" asChild>
              <a href={report.pdfUrl} target="_blank" rel="noreferrer">
                <Download className="size-4" />
                PDF
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
            <a href={report.flipbookUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              Open Source
            </a>
          </Button>
        </div>
      </header>
      <iframe
        title="AquaReport flipbook"
        src={report.flipbookUrl}
        className="min-h-[calc(100vh-73px)] flex-1 border-0"
        allow="fullscreen; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
