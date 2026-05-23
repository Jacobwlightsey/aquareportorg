import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership } from "./security";

// ─── Service Agreements ──────────────────────────────────────────

export const getServiceAgreements = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let agreements = await ctx.db
      .query("serviceAgreements")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    if (args.status) agreements = agreements.filter((a) => a.status === args.status);
    return agreements;
  },
});

export const createServiceAgreement = mutation({
  args: {
    dealId: v.optional(v.id("deals")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    equipmentInstalled: v.string(),
    installDate: v.number(),
    monthlyFee: v.number(),
    filterSchedule: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const renewalDate = args.installDate + 365 * 86400000;
    const filterSched = args.filterSchedule ? JSON.parse(args.filterSchedule) : null;
    const nextServiceDate = filterSched
      ? args.installDate + (filterSched.intervalMonths || 6) * 30 * 86400000
      : args.installDate + 180 * 86400000;
    return await ctx.db.insert("serviceAgreements", {
      companyId: result.membership.companyId,
      ...args,
      status: "active",
      renewalDate,
      nextServiceDate,
      serviceHistory: JSON.stringify([]),
    });
  },
});

export const logServiceVisit = mutation({
  args: {
    agreementId: v.id("serviceAgreements"),
    serviceType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const agreement = await ctx.db.get(args.agreementId);
    if (!agreement || agreement.companyId !== result.membership.companyId) throw new Error("Not found");
    const history = agreement.serviceHistory ? JSON.parse(agreement.serviceHistory) : [];
    history.push({ type: args.serviceType, date: Date.now(), notes: args.notes || "" });
    const filterSched = agreement.filterSchedule ? JSON.parse(agreement.filterSchedule) : null;
    const nextDate = filterSched
      ? Date.now() + (filterSched.intervalMonths || 6) * 30 * 86400000
      : Date.now() + 180 * 86400000;
    await ctx.db.patch(args.agreementId, {
      lastServiceDate: Date.now(),
      nextServiceDate: nextDate,
      serviceHistory: JSON.stringify(history),
    });
  },
});

// ─── Service Reminders ───────────────────────────────────────────

export const getReminders = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let reminders = await ctx.db
      .query("serviceReminders")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    if (args.status) reminders = reminders.filter((r) => r.status === args.status);
    return reminders.sort((a, b) => a.dueDate - b.dueDate);
  },
});

export const createReminder = mutation({
  args: {
    agreementId: v.optional(v.id("serviceAgreements")),
    dealId: v.optional(v.id("deals")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    reminderType: v.string(),
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("serviceReminders", {
      companyId: result.membership.companyId,
      ...args,
      status: "pending",
    });
  },
});

export const completeReminder = mutation({
  args: { reminderId: v.id("serviceReminders") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    await ctx.db.patch(args.reminderId, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

export const snoozeReminder = mutation({
  args: { reminderId: v.id("serviceReminders"), newDueDate: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.reminderId, {
      status: "pending",
      dueDate: args.newDueDate,
    });
  },
});

// ─── Review Requests ─────────────────────────────────────────────

export const getReviewRequests = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("reviewRequests")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .collect();
  },
});

export const createReviewRequest = mutation({
  args: {
    dealId: v.optional(v.id("deals")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    delayDays: v.number(),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const company = await ctx.db.get(result.membership.companyId);
    return await ctx.db.insert("reviewRequests", {
      companyId: result.membership.companyId,
      ...args,
      status: "pending",
      scheduledAt: Date.now() + args.delayDays * 86400000,
      googleReviewUrl: (company as any)?.googleReviewUrl,
    });
  },
});

export const recordReviewFeedback = mutation({
  args: {
    requestId: v.id("reviewRequests"),
    rating: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const status = args.rating >= 4 ? "positive_review" : "negative_feedback";
    await ctx.db.patch(args.requestId, {
      status,
      rating: args.rating,
      feedback: args.feedback,
    });
  },
});

// ─── Testimonials ────────────────────────────────────────────────

export const getTestimonials = query({
  args: { approvedOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let testimonials = await ctx.db
      .query("testimonials")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    if (args.approvedOnly) testimonials = testimonials.filter((t) => t.approved);
    return testimonials;
  },
});

export const createTestimonial = mutation({
  args: {
    customerName: v.string(),
    quote: v.string(),
    rating: v.optional(v.number()),
    source: v.string(),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("testimonials", {
      companyId: result.membership.companyId,
      ...args,
      approved: true,
    });
  },
});

export const toggleTestimonialApproval = mutation({
  args: { testimonialId: v.id("testimonials"), approved: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testimonialId, { approved: args.approved });
  },
});

// ─── Referral Rewards ────────────────────────────────────────────

export const getReferralRewards = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("referralRewards")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .collect();
  },
});

export const createReferralReward = mutation({
  args: {
    referrerName: v.string(),
    referrerEmail: v.optional(v.string()),
    referrerPhone: v.optional(v.string()),
    referralCode: v.string(),
    rewardType: v.string(),
    rewardAmount: v.number(),
    dealId: v.optional(v.id("deals")),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    return await ctx.db.insert("referralRewards", {
      companyId: result.membership.companyId,
      ...args,
      status: "pending",
    });
  },
});

export const redeemReward = mutation({
  args: { rewardId: v.id("referralRewards") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.rewardId, {
      status: "redeemed",
      redeemedAt: Date.now(),
    });
  },
});
