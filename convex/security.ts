import { getAuthUserId } from "@convex-dev/auth/server";

declare const process: { env: Record<string, string | undefined> };

const ROLE_RANK: Record<string, number> = {
  viewer: 10,
  sales_rep: 20,
  rep: 20,
  manager: 30,
  admin: 40,
  owner: 50,
};

export function normalizeRole(role?: string) {
  if (role === "rep") return "sales_rep";
  return role || "viewer";
}

export function canRole(role: string | undefined, minimum: string) {
  return (ROLE_RANK[normalizeRole(role)] ?? 0) >= (ROLE_RANK[minimum] ?? 0);
}

export async function getMembership(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;

  const memberships = await ctx.db
    .query("companyMembers")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const membership = memberships
    .filter((entry: any) => entry.acceptedAt || entry.role === "owner")
    .sort((a: any, b: any) => (ROLE_RANK[normalizeRole(b.role)] ?? 0) - (ROLE_RANK[normalizeRole(a.role)] ?? 0))[0];

  return membership ? { userId, membership } : null;
}

export async function requireMembership(ctx: any) {
  const result = await getMembership(ctx);
  if (!result) throw new Error("Not authenticated or no company membership");
  return result;
}

export async function requireRole(ctx: any, minimum: string) {
  const result = await requireMembership(ctx);
  if (!canRole(result.membership.role, minimum)) {
    throw new Error(`${minimum} access required`);
  }
  return result;
}

export async function audit(ctx: any, input: {
  companyId?: any;
  actorId?: any;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  await ctx.db.insert("auditLogs", {
    companyId: input.companyId,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });
}

export function currentPeriod(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function trackUsage(ctx: any, input: {
  companyId?: any;
  userId?: any;
  publicKey?: string;
  event: string;
  quantity?: number;
  metadata?: Record<string, unknown>;
}) {
  await ctx.db.insert("usageEvents", {
    companyId: input.companyId,
    userId: input.userId,
    publicKey: input.publicKey,
    event: input.event,
    quantity: input.quantity ?? 1,
    period: currentPeriod(),
    metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
  });
}

export async function countMonthlyUsage(ctx: any, companyId: any, event: string) {
  const events = await ctx.db
    .query("usageEvents")
    .withIndex("by_company_period", (q: any) =>
      q.eq("companyId", companyId).eq("period", currentPeriod())
    )
    .collect();

  return events
    .filter((entry: any) => entry.event === event)
    .reduce((sum: number, entry: any) => sum + entry.quantity, 0);
}

export function planReportLimit(company: any) {
  if (typeof company?.reportLimitOverride === "number") {
    return company.reportLimitOverride;
  }
  const plan = company?.stripePlan || "free";
  if (plan === "enterprise") return Number.POSITIVE_INFINITY;
  if (plan === "pro") return 150;
  if (plan === "growth") return 50;
  if (plan === "starter") return 20;
  return 1;
}

export function planUserLimit(company: any) {
  const plan = company?.stripePlan || "free";
  if (plan === "enterprise") return Number.POSITIVE_INFINITY;
  if (plan === "pro") return 15;
  if (plan === "growth") return 5;
  if (plan === "starter") return 2;
  return 1;
}

const PLAN_RANK: Record<string, number> = {
  free: 0,
  starter: 1,
  growth: 2,
  pro: 3,
  enterprise: 4,
};

const FEATURE_MIN_PLAN: Record<string, string> = {
  flipbook_reports: "growth",
  issue_consumer_reports: "growth",
  verify_in_home_results: "growth",
  verify_filtration_installs: "growth",
  interactive_dashboard: "growth",
  lead_pipeline: "pro",
};

export function activePlan(company: any) {
  return company?.stripeStatus === "active" ? company?.stripePlan || "free" : "free";
}

export function checkTierAccess(company: any, feature: string) {
  const plan = activePlan(company);
  const required = FEATURE_MIN_PLAN[feature] || "free";
  return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

export function tierAccessMessage(feature: string) {
  if (feature === "lead_pipeline") {
    return "Upgrade to Pro ($499/mo) to access the lead pipeline.";
  }
  if (feature === "verify_in_home_results" || feature === "verify_filtration_installs" || feature === "issue_consumer_reports") {
    return "Upgrade to Growth ($199/mo) to verify test results and issue consumer reports.";
  }
  return "Upgrade your plan to access this feature.";
}

export async function requireTierAccess(ctx: any, companyId: any, feature: string) {
  const company = await ctx.db.get(companyId);
  if (!company) throw new Error("Company not found");
  if (!checkTierAccess(company, feature)) {
    throw new Error(tierAccessMessage(feature));
  }
  return company;
}

export async function enforceReportLimit(ctx: any, company: any) {
  const limit = planReportLimit(company);
  if (!Number.isFinite(limit)) return;

  const used = await countMonthlyUsage(ctx, company._id, "report.created");
  if (used >= limit) {
    throw new Error("Monthly report limit reached. Upgrade your plan to continue.");
  }
}

export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
