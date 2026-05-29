import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership, requireRole } from "./security";

/** Get all proposals with install scheduling data for the company */
export const getInstalls = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    // Only return proposals that have signed status or install scheduling started
    return proposals.filter(
      (p) => p.status === "signed" || p.status === "countersigned" || p.status === "completed" || p.installStatus
    );
  },
});

/** Sales rep suggests install dates for a proposal */
export const suggestInstallDates = mutation({
  args: {
    proposalId: v.id("proposals"),
    dates: v.array(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "sales_rep");
    await ctx.db.patch(args.proposalId, {
      suggestedInstallDates: args.dates,
      installStatus: "dates_sent",
      installNotes: args.notes,
    });
  },
});

/** Customer selects a date (via share token — no auth required) */
export const customerSelectDate = mutation({
  args: {
    shareToken: v.string(),
    selectedDate: v.number(),
  },
  handler: async (ctx, args) => {
    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .collect();
    const proposal = proposals[0];
    if (!proposal) throw new Error("Proposal not found");
    if (!proposal.suggestedInstallDates?.includes(args.selectedDate)) {
      throw new Error("Invalid date selection");
    }
    await ctx.db.patch(proposal._id, {
      customerSelectedDate: args.selectedDate,
      installStatus: "customer_selected",
    });
  },
});

/** Owner approves the install date */
export const approveInstall = mutation({
  args: {
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "owner");
    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal || !proposal.customerSelectedDate) {
      throw new Error("No date selected");
    }
    await ctx.db.patch(args.proposalId, {
      installDate: proposal.customerSelectedDate,
      installApproved: true,
      installApprovedBy: userId,
      installApprovedAt: Date.now(),
      installStatus: "approved",
    });
  },
});

/** Owner rejects / requests reschedule */
export const rejectInstall = mutation({
  args: {
    proposalId: v.id("proposals"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "owner");
    await ctx.db.patch(args.proposalId, {
      customerSelectedDate: undefined,
      installApproved: false,
      installStatus: "dates_sent",
      installNotes: args.notes || "Please select a different date.",
    });
  },
});

/** Mark install as completed */
export const completeInstall = mutation({
  args: {
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "owner");
    await ctx.db.patch(args.proposalId, {
      installStatus: "completed",
    });
  },
});
