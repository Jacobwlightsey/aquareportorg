export type PipelineStage = "sent" | "claimed" | "tested" | "filtered" | "certified";

export const PIPELINE_STAGES: Array<{
  key: PipelineStage;
  label: string;
  color: string;
  badge: string;
}> = [
  { key: "sent", label: "Report Sent", color: "bg-slate-500", badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  { key: "claimed", label: "Claimed", color: "bg-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { key: "tested", label: "In-Home Test", color: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { key: "filtered", label: "Filtered", color: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { key: "certified", label: "Certified", color: "bg-violet-500", badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
];

export const stageRank: Record<PipelineStage, number> = {
  sent: 1,
  claimed: 2,
  tested: 3,
  filtered: 4,
  certified: 5,
};

export function hasInHomeReadings(report: any) {
  if (report.inHomeReadings) return true;
  return [report.chlorine, report.hardness, report.tds, report.ph].some((value) => typeof value === "number");
}

export function derivePipelineStage(report: any): PipelineStage {
  if (report.certificationComplete || report.certifiedAt) return "certified";
  if (report.filtrationVerified || report.filteredAt || report.filtrationVerifiedAt) return "filtered";
  if (hasInHomeReadings(report)) return "tested";
  if (report.claimedAt || report.consumerId || report.consumerLinkedAt || report.claimed) return "claimed";
  return "sent";
}

export function stageMeta(stage: PipelineStage) {
  return PIPELINE_STAGES.find((item) => item.key === stage) || PIPELINE_STAGES[0];
}

export function scoreClass(score?: number) {
  if (score === undefined) return "border-slate-300 text-slate-500 bg-slate-50";
  if (score >= 80) return "border-amber-400 text-amber-700 bg-amber-50 dark:bg-amber-950/30";
  if (score >= 60) return "border-slate-400 text-slate-700 bg-slate-50 dark:bg-slate-900/60 dark:text-slate-200";
  if (score >= 40) return "border-orange-400 text-orange-700 bg-orange-50 dark:bg-orange-950/30";
  return "border-rose-400 text-rose-700 bg-rose-50 dark:bg-rose-950/30";
}

export function parseContaminants(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function conversionRateFor(reports: any[]) {
  if (!reports.length) return 0;
  const converted = reports.filter((report) => derivePipelineStage(report) !== "sent").length;
  return Math.round((converted / reports.length) * 100);
}
