/**
 * Subscription-plan-based feature gating for the dealer UI.
 *
 * Plans (lowest → highest): free < starter < growth < pro < enterprise
 *
 * Tier access:
 *   Free      — 1 trial report
 *   Starter   — Flipbook PDFs, myaquareport.com consumer links, branded reports, lead capture
 *   Growth    — ↑ + Demo Wizard, AI summaries, AI talking points, in-home verification, filtration verification, territory basics
 *   Pro       — ↑ + AI sales assistant, CRM integrations, white-label, lead pipeline, territory intelligence
 *   Enterprise— ↑ + unlimited, custom domains, priority support
 */

export type Plan = "free" | "starter" | "growth" | "pro" | "enterprise";

const PLAN_RANK: Record<string, number> = {
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
 * Check plan access using an overridden effective plan.
 * Used by the free-trial system: free users who haven't used their trial
 * get "starter"-level access so they can preview features during their first report.
 */
export function hasPlanOverride(effectivePlan: Plan, minPlan: Plan): boolean {
  return (PLAN_RANK[effectivePlan] ?? 0) >= (PLAN_RANK[minPlan] ?? 999);
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
 * Upgrade CTA helpers
 * ─────────────────────────────────────────────────────────────*/

export function upgradeMessage(feature: string): string {
  const msgs: Record<string, string> = {
    flipbook: "Upgrade to Starter ($99/mo) to generate flipbook PDFs",
    consumer_links: "Upgrade to Starter ($99/mo) to send myaquareport.com links",
    demo_wizard: "Upgrade to Growth ($199/mo) to unlock the in-home Demo Wizard",
    ai: "Upgrade to Growth ($199/mo) to unlock AI summaries & talking points",
    verification: "Upgrade to Growth ($199/mo) to verify in-home test results",
    filtration: "Upgrade to Growth ($199/mo) to verify filtration installations",
    territory_basic: "Upgrade to Growth ($199/mo) for territory insights",
    ai_sales_assistant: "Upgrade to Pro ($499/mo) for the AI sales assistant",
    lead_pipeline: "Upgrade to Pro ($499/mo) to access the lead pipeline",
    crm: "Upgrade to Pro ($499/mo) for CRM integration access",
    white_label: "Upgrade to Pro ($499/mo) for white-labeled reports",
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
