import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
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

// ─── Cron: process due follow-up messages ────────────────────────

/**
 * Called by the cron scheduler. Finds all pending follow-up messages
 * that are due (scheduledAt <= now) and marks them as sent.
 * In production this would call an email/SMS action; for now it
 * updates status so the UI reflects delivery.
 */
export const processDueFollowUps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Get all companies and process pending messages
    // Since we can't query across companies with a compound index efficiently,
    // we query all pending messages and filter by time
    const pending = await ctx.db
      .query("followUpMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lte(q.field("scheduledAt"), now)
        )
      )
      .take(100); // Process in batches of 100

    let processed = 0;
    for (const msg of pending) {
      // Send email if recipient has an email address and channel is "email"
      if (msg.channel === "email" && msg.recipientEmail) {
        // Look up lead name for personalization
        const lead = msg.leadId ? await ctx.db.get(msg.leadId) : null;
        const company = await ctx.db.get(msg.companyId);
        await ctx.scheduler.runAfter(0, api.email.sendFollowUpEmail, {
          to: msg.recipientEmail,
          customerName: lead?.name || "there",
          subject: msg.subject || "Following up",
          body: msg.body || "Just checking in on your water treatment needs.",
          companyName: (company as any)?.name,
        });
      }
      await ctx.db.patch(msg._id, {
        status: "sent",
        sentAt: now,
      });
      processed++;
    }

    return { processed };
  },
});

// Create a standalone follow-up task (not from a sequence)
export const createFollowUpTask = mutation({
  args: {
    leadId: v.optional(v.id("leads")),
    dealId: v.optional(v.id("deals")),
    reportId: v.optional(v.id("reports")),
    customerName: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");

    const followUpDate = args.scheduledAt || (Date.now() + 2 * 24 * 60 * 60 * 1000); // default 2 days

    return await ctx.db.insert("followUpMessages", {
      companyId: result.membership.companyId,
      leadId: args.leadId,
      dealId: args.dealId,
      reportId: args.reportId,
      channel: "email",
      stepIndex: 0,
      status: "pending",
      scheduledAt: followUpDate,
      subject: `Follow-up: ${args.customerName || "Customer"}`,
      body: args.notes || "Follow-up from demo session",
    });
  },
});
