import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getMembership } from "./security";
import { api, internal } from "./_generated/api";

export const getProposals = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("proposals")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .collect();
  },
});

export const getProposal = query({
  args: { proposalId: v.id("proposals") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.companyId !== result.membership.companyId) return null;
    return proposal;
  },
});

export const getProposalByToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("proposals")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!proposal) return null;
    const company = await ctx.db.get(proposal.companyId);
    return { ...proposal, company };
  },
});

export const createProposal = mutation({
  args: {
    dealId: v.optional(v.id("deals")),
    reportId: v.optional(v.id("reports")),
    demoSessionId: v.optional(v.id("demoSessions")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    equipment: v.string(),
    totalPrice: v.number(),
    discounts: v.optional(v.string()),
    monthlyPayment: v.optional(v.number()),
    waterScore: v.optional(v.number()),
    projectedScore: v.optional(v.number()),
    contaminantSummary: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { membership } = result;
    const shareToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const id = await ctx.db.insert("proposals", {
      companyId: membership.companyId,
      ...args,
      status: "draft",
      shareToken,
      createdBy: membership.userId,
    });
    // Auto-update deal stage if linked
    if (args.dealId) {
      const deal = await ctx.db.get(args.dealId);
      if (deal && deal.companyId === membership.companyId && deal.stage !== "closed_won") {
        const history = deal.stageHistory ? JSON.parse(deal.stageHistory) : [];
        history.push({ stage: "proposal_sent", timestamp: Date.now(), userId: String(membership.userId) });
        await ctx.db.patch(args.dealId, {
          stage: "proposal_sent",
          stageHistory: JSON.stringify(history),
        });
      }
    }
    return id;
  },
});

export const updateProposal = mutation({
  args: {
    proposalId: v.id("proposals"),
    equipment: v.optional(v.string()),
    totalPrice: v.optional(v.number()),
    discounts: v.optional(v.string()),
    monthlyPayment: v.optional(v.number()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || proposal.companyId !== result.membership.companyId) throw new Error("Not found");
    const { proposalId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    if ((clean as any).status === "sent") (clean as any).sentAt = Date.now();
    await ctx.db.patch(proposalId, clean);
  },
});

export const markProposalViewed = mutation({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("proposals")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!proposal) return;
    if (!proposal.viewedAt) {
      await ctx.db.patch(proposal._id, { viewedAt: Date.now(), status: "viewed" });
    }
  },
});

export const acceptProposal = mutation({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("proposals")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!proposal) throw new Error("Not found");
    await ctx.db.patch(proposal._id, { acceptedAt: Date.now(), status: "accepted" });
  },
});
