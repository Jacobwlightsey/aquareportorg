import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership, requireRole } from "./security";
import { advanceLeadStage } from "./pipelineHelpers";

/** Get all contracts with install scheduling data for the company */
export const getInstalls = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    // Only return contracts that have signed status or install scheduling started
    return contracts.filter(
      (c) => c.status === "signed" || c.status === "countersigned" || c.status === "completed" || c.installStatus
    );
  },
});

/** Sales rep suggests install dates for a contract */
export const suggestInstallDates = mutation({
  args: {
    contractId: v.id("contracts"),
    dates: v.array(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "sales_rep");
    await ctx.db.patch(args.contractId, {
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
    const contracts = await ctx.db
      .query("contracts")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .collect();
    const contract = contracts[0];
    if (!contract) throw new Error("Contract not found");
    if (!contract.suggestedInstallDates?.includes(args.selectedDate)) {
      throw new Error("Invalid date selection");
    }
    await ctx.db.patch(contract._id, {
      customerSelectedDate: args.selectedDate,
      installStatus: "customer_selected",
    });
  },
});

/** Owner approves the install date */
export const approveInstall = mutation({
  args: {
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "owner");
    const contract = await ctx.db.get(args.contractId);
    if (!contract || !contract.customerSelectedDate) {
      throw new Error("No date selected");
    }
    await ctx.db.patch(args.contractId, {
      installDate: contract.customerSelectedDate,
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
    contractId: v.id("contracts"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, "owner");
    await ctx.db.patch(args.contractId, {
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
    contractId: v.id("contracts"),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, "owner");
    const contract = await ctx.db.get(args.contractId);
    await ctx.db.patch(args.contractId, {
      installStatus: "completed",
    });
    // Auto-advance lead to "installed"
    if (contract?.leadId) {
      await advanceLeadStage(ctx, contract.leadId, "installed", String(userId));
    }
  },
});
