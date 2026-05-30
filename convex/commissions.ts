import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership, canRole } from "./security";

export const getCommissions = query({
  args: { period: v.optional(v.string()), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    let commissions = await ctx.db
      .query("commissions")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    // Sales reps only see their own
    if (membership.role === "sales_rep") {
      commissions = commissions.filter((c) => String(c.userId) === String(membership.userId));
    } else if (args.userId) {
      commissions = commissions.filter((c) => c.userId === args.userId);
    }
    if (args.period) commissions = commissions.filter((c) => c.period === args.period);
    return commissions.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getCommissionSummary = query({
  args: { period: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const { membership } = result;
    const now = new Date();
    const currentPeriod = args.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const commissions = await ctx.db
      .query("commissions")
      .withIndex("by_period", (q) => q.eq("companyId", membership.companyId).eq("period", currentPeriod))
      .collect();
    // Aggregate by user
    const byUser: Record<string, { userId: string; totalDeals: number; totalRevenue: number; totalCommission: number; paid: number; pending: number }> = {};
    for (const c of commissions) {
      const uid = String(c.userId);
      if (!byUser[uid]) byUser[uid] = { userId: uid, totalDeals: 0, totalRevenue: 0, totalCommission: 0, paid: 0, pending: 0 };
      byUser[uid].totalDeals++;
      byUser[uid].totalRevenue += c.dealValue;
      byUser[uid].totalCommission += c.commissionAmount;
      if (c.status === "paid") byUser[uid].paid += c.commissionAmount;
      else byUser[uid].pending += c.commissionAmount;
    }
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    const enriched = Object.values(byUser).map((b) => {
      const member = members.find((m) => String(m.userId) === b.userId);
      return { ...b, name: member?.name || member?.email || "Unknown" };
    });
    return {
      period: currentPeriod,
      byRep: enriched.sort((a, b) => b.totalCommission - a.totalCommission),
      totalRevenue: commissions.reduce((s, c) => s + c.dealValue, 0),
      totalCommissions: commissions.reduce((s, c) => s + c.commissionAmount, 0),
      totalPaid: commissions.filter((c) => c.status === "paid").reduce((s, c) => s + c.commissionAmount, 0),
      totalPending: commissions.filter((c) => c.status !== "paid").reduce((s, c) => s + c.commissionAmount, 0),
    };
  },
});

export const createCommission = mutation({
  args: {
    userId: v.id("users"),
    dealId: v.optional(v.id("deals")),
    leadId: v.optional(v.id("leads")),
    demoSessionId: v.optional(v.id("demoSessions")),
    dealValue: v.number(),
    commissionRate: v.number(),
    customerName: v.optional(v.string()),
    period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "manager")) throw new Error("Insufficient permissions");
    const now = new Date();
    const period = args.period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const commissionAmount = Math.round(args.dealValue * (args.commissionRate / 100) * 100) / 100;
    return await ctx.db.insert("commissions", {
      companyId: result.membership.companyId,
      userId: args.userId,
      dealId: args.dealId,
      demoSessionId: args.demoSessionId,
      dealValue: args.dealValue,
      commissionRate: args.commissionRate,
      commissionAmount,
      status: "pending",
      period,
      customerName: args.customerName,
    });
  },
});

export const approveCommission = mutation({
  args: { commissionId: v.id("commissions") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "admin")) throw new Error("Insufficient permissions");
    await ctx.db.patch(args.commissionId, { status: "approved" });
  },
});

export const markPaid = mutation({
  args: { commissionId: v.id("commissions") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "admin")) throw new Error("Insufficient permissions");
    await ctx.db.patch(args.commissionId, { status: "paid", paidAt: Date.now() });
  },
});
