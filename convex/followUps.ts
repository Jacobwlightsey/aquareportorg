import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership } from "./security";

export const getSequences = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("followUpSequences")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
  },
});

export const createSequence = mutation({
  args: {
    name: v.string(),
    trigger: v.string(),
    steps: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("followUpSequences", {
      companyId: result.membership.companyId,
      name: args.name,
      trigger: args.trigger,
      isActive: true,
      steps: args.steps,
      createdBy: result.membership.userId,
    });
  },
});

export const updateSequence = mutation({
  args: {
    sequenceId: v.id("followUpSequences"),
    name: v.optional(v.string()),
    steps: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const seq = await ctx.db.get(args.sequenceId);
    if (!seq || seq.companyId !== result.membership.companyId) throw new Error("Not found");
    const { sequenceId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    await ctx.db.patch(sequenceId, clean);
  },
});

export const deleteSequence = mutation({
  args: { sequenceId: v.id("followUpSequences") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const seq = await ctx.db.get(args.sequenceId);
    if (!seq || seq.companyId !== result.membership.companyId) throw new Error("Not found");
    await ctx.db.delete(args.sequenceId);
  },
});

export const getMessages = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let messages = await ctx.db
      .query("followUpMessages")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .take(200);
    if (args.status) messages = messages.filter((m) => m.status === args.status);
    return messages;
  },
});

export const enrollInSequence = mutation({
  args: {
    sequenceId: v.id("followUpSequences"),
    dealId: v.optional(v.id("deals")),
    reportId: v.optional(v.id("reports")),
    recipientEmail: v.optional(v.string()),
    recipientPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const seq = await ctx.db.get(args.sequenceId);
    if (!seq || !seq.isActive) throw new Error("Sequence not found or inactive");
    const steps = JSON.parse(seq.steps);
    const now = Date.now();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const scheduledAt = now + (step.delayDays || 0) * 86400000;
      await ctx.db.insert("followUpMessages", {
        companyId: result.membership.companyId,
        sequenceId: args.sequenceId,
        dealId: args.dealId,
        reportId: args.reportId,
        recipientEmail: args.recipientEmail,
        recipientPhone: args.recipientPhone,
        channel: step.channel || "email",
        stepIndex: i,
        status: "pending",
        scheduledAt,
        subject: step.subject,
        body: step.body,
      });
    }
  },
});

export const cancelMessages = mutation({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const messages = await ctx.db
      .query("followUpMessages")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    for (const m of messages) {
      if (m.dealId === args.dealId && m.status === "pending") {
        await ctx.db.patch(m._id, { status: "cancelled" });
      }
    }
  },
});
