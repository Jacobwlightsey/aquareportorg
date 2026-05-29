import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership } from "./security";

export const getContracts = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("contracts")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .order("desc")
      .collect();
  },
});

export const getContractByToken = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!contract) return null;
    const company = await ctx.db.get(contract.companyId);
    return { ...contract, company };
  },
});

export const createContract = mutation({
  args: {
    proposalId: v.optional(v.id("proposals")),
    dealId: v.optional(v.id("deals")),
    customerName: v.string(),
    customerEmail: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    equipment: v.string(),
    totalPrice: v.number(),
    monthlyPayment: v.optional(v.number()),
    paymentTerms: v.optional(v.string()),
    depositAmount: v.optional(v.number()),
    installDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const shareToken = "ctr_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const contractId = await ctx.db.insert("contracts", {
      companyId: result.membership.companyId,
      ...args,
      status: "draft",
      shareToken,
      createdBy: result.membership.userId,
    });

    // Auto-create install appointment if installDate is provided (#16)
    if (args.installDate) {
      await ctx.db.insert("appointments", {
        companyId: result.membership.companyId,
        assignedTo: result.membership.userId,
        customerName: args.customerName,
        customerEmail: args.customerEmail,
        customerAddress: args.customerAddress,
        scheduledAt: args.installDate,
        durationMinutes: 120,
        type: "install",
        status: "scheduled",
        notes: `Install for contract ${shareToken}`,
      });
    }

    return contractId;
  },
});

export const signContract = mutation({
  args: {
    shareToken: v.string(),
    signature: v.string(),
    signerType: v.string(), // "customer" | "dealer"
  },
  handler: async (ctx, args) => {
    const contract = await ctx.db
      .query("contracts")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!contract) throw new Error("Not found");
    if (args.signerType === "customer") {
      await ctx.db.patch(contract._id, {
        customerSignature: args.signature,
        customerSignedAt: Date.now(),
        status: "signed",
      });
    } else {
      await ctx.db.patch(contract._id, {
        dealerSignature: args.signature,
        dealerSignedAt: Date.now(),
        status: contract.customerSignature ? "completed" : "countersigned",
      });
    }
  },
});

export const updateContractStatus = mutation({
  args: {
    contractId: v.id("contracts"),
    status: v.string(),
    depositPaid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const contract = await ctx.db.get(args.contractId);
    if (!contract || contract.companyId !== result.membership.companyId) throw new Error("Not found");
    const update: any = { status: args.status };
    if (args.depositPaid !== undefined) update.depositPaid = args.depositPaid;
    await ctx.db.patch(args.contractId, update);
  },
});
