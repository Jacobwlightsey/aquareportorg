export type PipelineStage = "sent" | "claimed" | "tested" | "filtered" | "certified";

// ─── Unified CRM Pipeline ──────────────────────────────────────────
// One lead = one customer journey. Stage only moves forward unless
// explicitly marked lost. Every action auto-advances the stage.
// ────────────────────────────────────────────────────────────────────

export type LeadStage =
  | "new_lead"
  | "call_to_set"
  | "scheduled"
  | "report_created"
  | "demo_done"
  | "forms_sent"
  | "sold"
  | "installed"
  | "closed_lost";

/** Ordered rank for forward-only enforcement. closed_lost is special (can happen at any stage). */
export const LEAD_STAGE_RANK: Record<LeadStage, number> = {
  new_lead: 0,
  call_to_set: 1,
  scheduled: 2,
  report_created: 3,
  demo_done: 4,
  forms_sent: 5,
  sold: 6,
  installed: 7,
  closed_lost: -1, // special — can be set from any stage
};

export const LEAD_STAGES: Array<{
  key: LeadStage;
  label: string;
  emoji: string;
  color: string;
  badge: string;
}> = [
  { key: "new_lead", label: "New Lead", emoji: "👤", color: "bg-slate-500", badge: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300" },
  { key: "call_to_set", label: "Call to Set", emoji: "📞", color: "bg-blue-500", badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { key: "scheduled", label: "Scheduled", emoji: "📅", color: "bg-cyan-500", badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  { key: "report_created", label: "Report Created", emoji: "📊", color: "bg-indigo-500", badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  { key: "demo_done", label: "Demo Done", emoji: "🎯", color: "bg-amber-500", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  { key: "forms_sent", label: "Forms Sent", emoji: "📋", color: "bg-orange-500", badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300" },
  { key: "sold", label: "Sold", emoji: "🎉", color: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { key: "installed", label: "Installed", emoji: "✅", color: "bg-green-600", badge: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
  { key: "closed_lost", label: "Closed Lost", emoji: "❌", color: "bg-red-500", badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
];

export function leadStageMeta(stage: string) {
  return LEAD_STAGES.find((s) => s.key === stage) || LEAD_STAGES[0];
}

// ─── Legacy stage mapping ──────────────────────────────────────────
// Maps old stage names to new ones for backward compatibility
export function normalizeLeadStage(stage: string): LeadStage {
  const map: Record<string, LeadStage> = {
    // old → new
    "new": "new_lead",
    "contacted": "call_to_set",
    "appointment_set": "scheduled",
    "demo_completed": "demo_done",
    "proposal_sent": "forms_sent",
    "negotiation": "forms_sent",
    "closed": "sold",
    "closed_won": "sold",
    // already correct
    "new_lead": "new_lead",
    "call_to_set": "call_to_set",
    "scheduled": "scheduled",
    "report_created": "report_created",
    "demo_done": "demo_done",
    "forms_sent": "forms_sent",
    "sold": "sold",
    "installed": "installed",
    "closed_lost": "closed_lost",
  };
  return map[stage] || "new_lead";
}

// ─── Report Pipeline (kept as-is) ──────────────────────────────────

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
