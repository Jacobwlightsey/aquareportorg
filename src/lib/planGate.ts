/**
 * Subscription-plan-based feature gating for the dealer UI.
 *
 * Plans (lowest → highest): free < starter < growth < pro < enterprise
 *
 * Tier access:
 *   Free      — 1 trial report (Growth-level preview during trial experience)
 *   Starter   — Pipeline, Leads, Appointments, Proposals, Commissions, Reviews,
 *               Flipbook PDFs, consumer links, branded reports
 *   Growth    — ↑ + Demo Wizard, Demo Analytics, Analytics, Retention, Follow-Ups,
 *               Marketing, Training, AI summaries, verification, filtration, territory basics
 *   Pro       — ↑ + Territory Map, AI sales assistant, CRM, white-label
 *   Enterprise— ↑ + unlimited, custom domains, priority support
 */

export type Plan = "free" | "starter" | "growth" | "pro" | "enterprise";

export const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  enterprise: 4,
};

/** Get the effective active plan. Returns "free" if not subscribed or inactive. */
export function activePlan(company: { stripePlan?: string; stripeStatus?: string } | null | undefined): Plan {
  if (!company) return "free";
  const active = company.stripeStatus === "active";
  return (active ? (company.stripePlan as Plan) : "free") || "free";
}

/** True when the company's plan is at or above `minPlan`. */
export function hasPlan(company: any, minPlan: Plan): boolean {
  return (PLAN_RANK[activePlan(company)] ?? 0) >= (PLAN_RANK[minPlan] ?? 999);
}

/**
 * Check plan access using an overridden effective plan string.
 * Used by the free-trial system: free users in their trial experience
 * get "growth"-level access so they can preview features during their first report.
 */
export function hasPlanOverride(effectivePlan: Plan, minPlan: Plan): boolean {
  return (PLAN_RANK[effectivePlan] ?? 0) >= (PLAN_RANK[minPlan] ?? 999);
}

/*──────────────────────────────────────────────────────────────
 * Page-level gating — minimum plan required per page
 * Used by PageGate (page-level) and sidebar (lock icons)
 * ─────────────────────────────────────────────────────────────*/

export const PAGE_MIN_PLAN: Record<string, Plan> = {
  // Always accessible (free + all paid)
  dashboard: "free",
  customers: "free",
  "customer-detail": "free",
  "create-customer": "free",
  reports: "free",
  "view-report": "free",
  "report-v2": "free",
  subscription: "free",
  settings: "free",
  company: "free",
  team: "free",

  // Free trial gets Growth-level preview for the report experience
  "demo-wizard": "growth",

  // ── Starter ($199/mo) ──
  pipeline: "starter",
  leads: "starter",
  appointments: "starter",
  proposals: "starter",
  commissions: "starter",
  reviews: "starter",

  // ── Growth ($349/mo) ──
  analytics: "growth",
  "demo-analytics": "growth",
  retention: "growth",
  "follow-ups": "growth",
  marketing: "growth",
  training: "growth",

  // ── Pro ($599/mo) ──
  "territory-map": "pro",
};

/** Map page path (e.g. "/pipeline") to page key (e.g. "pipeline") */
export function pathToPageKey(path: string): string {
  return path.replace(/^\//, "").split("/")[0] || "dashboard";
}

/** Check if a plan has access to a specific page */
export function canAccessPage(plan: Plan, page: string): boolean {
  const required = PAGE_MIN_PLAN[page] ?? "free";
  return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[required] ?? 999);
}

/** Get the minimum plan required for a page */
export function pageRequiredPlan(page: string): Plan {
  return PAGE_MIN_PLAN[page] ?? "free";
}

/*──────────────────────────────────────────────────────────────
 * Feature gates — mirrors FEATURE_MIN_PLAN in convex/security.ts
 * ─────────────────────────────────────────────────────────────*/

// ── Starter features (available to all paid) ──
/** Flipbook PDF reports */
export const hasFlipbook = (company: any) => hasPlan(company, "starter");
/** Generate myaquareport.com consumer links */
export const hasConsumerLinks = (company: any) => hasPlan(company, "starter");

// ── Growth features ──
/** Demo Wizard (in-home presentation tool) */
export const hasDemoWizard = (company: any) => hasPlan(company, "growth");
/** AI homeowner summaries & sales talking points */
export const hasAI = (company: any) => hasPlan(company, "growth");
/** In-home test verification */
export const hasVerification = (company: any) => hasPlan(company, "growth");
/** Filtration install verification */
export const hasFiltration = (company: any) => hasPlan(company, "growth");
/** Basic territory insights */
export const hasTerritoryBasic = (company: any) => hasPlan(company, "growth");

// ── Pro features ──
/** AI sales assistant */
export const hasAISalesAssistant = (company: any) => hasPlan(company, "pro");
/** Lead pipeline management */
export const hasLeadPipeline = (company: any) => hasPlan(company, "pro");
/** CRM integrations */
export const hasCRM = (company: any) => hasPlan(company, "pro");
/** White-labeled reports & territory intelligence */
export const hasWhiteLabel = (company: any) => hasPlan(company, "pro");

/*──────────────────────────────────────────────────────────────
 * Team member limits by plan
 * ─────────────────────────────────────────────────────────────*/

export const PLAN_TEAM_LIMIT: Record<string, number> = {
  free: 1,
  starter: 2,
  growth: 5,
  pro: 15,
  enterprise: Infinity,
};

export function teamLimit(plan: Plan): number {
  return PLAN_TEAM_LIMIT[plan] ?? 1;
}

/*──────────────────────────────────────────────────────────────
 * Upgrade CTA helpers
 * ─────────────────────────────────────────────────────────────*/

export function upgradeMessage(feature: string): string {
  const msgs: Record<string, string> = {
    flipbook: "Upgrade to Starter ($199/mo) to generate flipbook PDFs",
    consumer_links: "Upgrade to Starter ($199/mo) to send myaquareport.com links",
    demo_wizard: "Upgrade to Growth ($349/mo) to unlock the in-home Demo Wizard",
    ai: "Upgrade to Growth ($349/mo) to unlock AI summaries & talking points",
    verification: "Upgrade to Growth ($349/mo) to verify in-home test results",
    filtration: "Upgrade to Growth ($349/mo) to verify filtration installations",
    territory_basic: "Upgrade to Growth ($349/mo) for territory insights",
    ai_sales_assistant: "Upgrade to Pro ($599/mo) for the AI sales assistant",
    lead_pipeline: "Upgrade to Pro ($599/mo) to access the lead pipeline",
    crm: "Upgrade to Pro ($599/mo) for CRM integration access",
    white_label: "Upgrade to Pro ($599/mo) for white-labeled reports",
  };
  return msgs[feature] || "Upgrade your plan to unlock this feature";
}

/** Returns the minimum plan name needed for a feature (for badge display). */
export function requiredPlanLabel(feature: string): string {
  const map: Record<string, string> = {
    flipbook: "Starter",
    consumer_links: "Starter",
    demo_wizard: "Growth",
    ai: "Growth",
    verification: "Growth",
    filtration: "Growth",
    territory_basic: "Growth",
    ai_sales_assistant: "Pro",
    lead_pipeline: "Pro",
    crm: "Pro",
    white_label: "Pro",
  };
  return map[feature] || "Growth";
}

/** Human-readable plan name */
export function planLabel(plan: Plan): string {
  if (plan === "free") return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** Price string for a plan */
export function planPrice(plan: Plan): string {
  const prices: Record<string, string> = {
    free: "Free",
    starter: "$199/mo",
    growth: "$349/mo",
    pro: "$599/mo",
    enterprise: "Contact us",
  };
  return prices[plan] || "";
}
