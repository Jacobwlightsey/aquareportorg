import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getMembership } from "./security";

export const getDeals = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    // If sales_rep, only show their deals
    if (membership.role === "sales_rep") {
      return deals.filter((d) => String(d.assignedTo) === String(membership.userId));
    }
    return deals;
  },
});

export const getDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.companyId !== result.membership.companyId) return null;
    return deal;
  },
});

export const createDeal = mutation({
  args: {
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    reportId: v.optional(v.id("reports")),
    demoSessionId: v.optional(v.id("demoSessions")),
    leadId: v.optional(v.id("leads")),
    dealValue: v.optional(v.number()),
    equipmentList: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    source: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { membership } = result;
    const stageHistory = JSON.stringify([
      { stage: "new_lead", timestamp: Date.now(), userId: String(membership.userId) },
    ]);
    return await ctx.db.insert("deals", {
      companyId: membership.companyId,
      ...args,
      stage: "new_lead",
      assignedTo: args.assignedTo || membership.userId,
      stageHistory,
    });
  },
});

export const updateDealStage = mutation({
  args: {
    dealId: v.id("deals"),
    stage: v.string(),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.companyId !== result.membership.companyId) throw new Error("Not found");
    const history = deal.stageHistory ? JSON.parse(deal.stageHistory) : [];
    history.push({
      stage: args.stage,
      timestamp: Date.now(),
      userId: String(result.membership.userId),
    });
    const update: any = { stage: args.stage, stageHistory: JSON.stringify(history) };
    if (args.stage === "closed_won" || args.stage === "closed_lost") {
      update.closedAt = Date.now();
    }
    if (args.lostReason) update.lostReason = args.lostReason;
    await ctx.db.patch(args.dealId, update);

    // Fire attribution tracking event for deal stage changes
    if (args.stage === "closed_won") {
      await ctx.runMutation(internal.tracking.recordEvent, {
        companyId: deal.companyId,
        eventName: "DealClosed",
        eventCategory: "conversion",
        metadata: JSON.stringify({
          dealId: String(args.dealId),
          stage: args.stage,
          dealValue: deal.dealValue,
        }),
      });
    }
  },
});

export const updateDeal = mutation({
  args: {
    dealId: v.id("deals"),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    dealValue: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    priority: v.optional(v.string()),
    expectedCloseDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    equipmentList: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const deal = await ctx.db.get(args.dealId);
    if (!deal || deal.companyId !== result.membership.companyId) throw new Error("Not found");
    const { dealId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    await ctx.db.patch(dealId, clean);
  },
});

export const getPipelineStats = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const { membership } = result;
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    const stages = ["new_lead", "appointment_set", "demo_completed", "proposal_sent", "negotiation", "closed_won", "closed_lost"];
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const s of stages) byStage[s] = { count: 0, value: 0 };
    let totalValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    for (const d of deals) {
      if (byStage[d.stage]) {
        byStage[d.stage].count++;
        byStage[d.stage].value += d.dealValue ?? 0;
      }
      totalValue += d.dealValue ?? 0;
      if (d.stage === "closed_won") {
        wonValue += d.dealValue ?? 0;
        wonCount++;
      }
    }
    const activeDeals = deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost");
    return {
      byStage,
      totalDeals: deals.length,
      activeDeals: activeDeals.length,
      totalPipelineValue: activeDeals.reduce((s, d) => s + (d.dealValue ?? 0), 0),
      wonValue,
      wonCount,
      avgDealSize: wonCount > 0 ? Math.round(wonValue / wonCount) : 0,
      winRate: deals.filter((d) => d.stage === "closed_won" || d.stage === "closed_lost").length > 0
        ? Math.round((wonCount / deals.filter((d) => d.stage === "closed_won" || d.stage === "closed_lost").length) * 100)
        : 0,
    };
  },
});
