import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

declare const process: { env: Record<string, string | undefined> };

// ─── Helper: resolve admin emails ──────────────────────────────────────────
function getAdminEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "jacobwlightsey@gmail.com,clearflowwaterco@gmail.com")
    .split(",")
    .map((e: string) => e.trim().toLowerCase());
}

// ─── Helper: require platform admin ────────────────────────────────────────
async function requirePlatformAdmin(ctx: any): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user?.email) throw new Error("No email on account");
  if (!getAdminEmails().includes(user.email.toLowerCase())) {
    throw new Error("Platform admin access required");
  }
  return userId;
}

// ─── Auto-link member on signup ─────────────────────────────────────────────
export const autoLinkMember = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const accepted = existing.find((m) => m.acceptedAt || m.role === "owner");
    if (accepted) return { companyId: accepted.companyId, role: accepted.role };

    const user = await ctx.db.get(userId);
    if (!user?.email) return null;

    const placeholder = await ctx.db
      .query("companyMembers")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (placeholder && !placeholder.acceptedAt) {
      await ctx.db.patch(placeholder._id, {
        userId: userId,
        name: user.name || placeholder.name,
      });
      return { companyId: placeholder.companyId, role: placeholder.role };
    }

    return null;
  },
});

// ─── Is current user a company admin/owner ──────────────────────────────────
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return membership?.role === "admin" || membership?.role === "owner";
  },
});

// ─── Setup admin placeholder (internal only — use from dashboard/deploy scripts) ──
export const setupAdminPlaceholder = internalMutation({
  args: {
    email: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const companies = await ctx.db.query("companies").collect();
    const company = companies.find((c) => c.name === args.companyName);
    if (!company) {
      return { error: "Company not found" };
    }

    const existing = await ctx.db
      .query("companyMembers")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) {
      if (existing.role !== "owner") {
        await ctx.db.patch(existing._id, { role: "owner" });
      }
      return { status: "already_exists", memberId: existing._id, role: "owner" };
    }

    const anyMember = await ctx.db.query("companyMembers").first();
    const memberId = await ctx.db.insert("companyMembers", {
      companyId: company._id,
      userId: anyMember?.userId ?? company.createdBy!,
      role: "owner",
      name: args.email.split("@")[0],
      email: args.email,
    });

    return { status: "created", memberId, role: "owner" };
  },
});

// ─── Is current user a platform admin ───────────────────────────────────────
export const isPlatformAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    if (!user?.email) return false;
    return getAdminEmails().includes(user.email.toLowerCase());
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Platform admin functions — ALL require platform admin auth
// ═══════════════════════════════════════════════════════════════════════════

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    const companies = await ctx.db.query("companies").collect();
    const users = await ctx.db.query("users").collect();
    const reports = await ctx.db.query("reports").collect();
    const leads = await ctx.db.query("leads").collect();
    const demoSessions = await ctx.db.query("demoSessions").collect();

    // Plan breakdown
    const planBreakdown: Record<string, number> = { free: 0, starter: 0, growth: 0, pro: 0, enterprise: 0 };
    for (const c of companies) {
      const plan = (c.stripeStatus === "active" && c.stripePlan) ? c.stripePlan : "free";
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
    }

    // MRR
    const planPrices: Record<string, number> = { starter: 199, growth: 349, pro: 599, enterprise: 599 };
    let mrr = 0;
    for (const c of companies) {
      if (c.stripeStatus === "active" && c.stripePlan) {
        mrr += planPrices[c.stripePlan] || 0;
      }
    }

    // Weekly signups (last 12 weeks)
    const weeklySignups = [];
    const now = Date.now();
    for (let i = 11; i >= 0; i--) {
      const weekStart = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
      const weekEnd = now - i * 7 * 24 * 60 * 60 * 1000;
      const count = users.filter((u) => u._creationTime >= weekStart && u._creationTime < weekEnd).length;
      const d = new Date(weekEnd);
      weeklySignups.push({ week: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }

    return {
      totalCompanies: companies.length,
      totalUsers: users.length,
      totalReports: reports.length,
      totalLeads: leads.length,
      totalDemos: demoSessions.length,
      activeSubscriptions: companies.filter((c) => c.stripeStatus === "active").length,
      mrr,
      planBreakdown,
      weeklySignups,
      reportsThisMonth: reports.filter((r) => {
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        return r._creationTime > thirtyDaysAgo;
      }).length,
    };
  },
});

export const getAllCompanies = query({
  args: {},
  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    const companies = await ctx.db.query("companies").collect();
    const result = [];
    for (const company of companies) {
      const members = await ctx.db
        .query("companyMembers")
        .withIndex("by_company", (q: any) => q.eq("companyId", company._id))
        .collect();
      const reports = await ctx.db
        .query("reports")
        .withIndex("by_company", (q: any) => q.eq("companyId", company._id))
        .collect();
      result.push({
        ...company,
        memberCount: members.length,
        reportCount: reports.length,
        createdAt: company._creationTime,
      });
    }
    return result;
  },
});

export const getCompanyDetail = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    await requirePlatformAdmin(ctx);

    const company = await ctx.db.get(companyId);
    if (!company) return null;
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const demos = await ctx.db
      .query("demoSessions")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .collect();
    const owner = company.createdBy ? await ctx.db.get(company.createdBy) : null;

    const demoOutcomes: Record<string, number> = {};
    for (const d of demos) {
      demoOutcomes[d.outcome] = (demoOutcomes[d.outcome] || 0) + 1;
    }

    return {
      company: {
        ...company,
        ownerEmail: owner?.email ?? null,
        createdAt: company._creationTime,
      },
      members,
      reportCount: reports.length,
      leadCount: leads.length,
      demoCount: demos.length,
      recentReports: reports.slice(-10).reverse(),
      demoOutcomes,
    };
  },
});

export const adminGetCompanyReports = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    await requirePlatformAdmin(ctx);
    return await ctx.db
      .query("reports")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

export const adminGetCompanyLeads = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    await requirePlatformAdmin(ctx);
    return await ctx.db
      .query("leads")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

export const adminGetCompanyDemos = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    await requirePlatformAdmin(ctx);
    return await ctx.db
      .query("demoSessions")
      .withIndex("by_company", (q: any) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

export const adminUpdateCompany = mutation({
  args: {
    companyId: v.id("companies"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    stripePlan: v.optional(v.string()),
    stripeStatus: v.optional(v.string()),
    reportLimitOverride: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, ...updates }) => {
    await requirePlatformAdmin(ctx);
    const clean = Object.fromEntries(
      Object.entries(updates).filter(([_, val]) => val !== undefined)
    );
    if (Object.keys(clean).length > 0) {
      await ctx.db.patch(companyId, clean);
    }
    return { success: true };
  },
});

export const adminDeleteReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.delete(reportId);
    return { success: true };
  },
});
