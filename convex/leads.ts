import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { audit, getMembership, requireRole, trackUsage } from "./security";

export const submitLead = mutation({
  args: {
    shareToken: v.string(),
    name: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.name.trim()) throw new Error("Name is required");

    const report = await ctx.db
      .query("reports")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();
    if (!report) throw new Error("Report not found");

    const leadId = await ctx.db.insert("leads", {
      companyId: report.companyId,
      reportShareToken: args.shareToken,
      name: args.name.trim(),
      phone: args.phone,
      email: args.email,
      message: args.message,
      status: "new",
      utilityCityState: `${report.utilityName} - ${report.city}, ${report.state}`,
      source: "customer_report",
    });

    await trackUsage(ctx, {
      companyId: report.companyId,
      publicKey: args.shareToken,
      event: "lead.created",
      metadata: { source: "customer_report" },
    });
    await audit(ctx, {
      companyId: report.companyId,
      action: "lead.created",
      entityType: "lead",
      entityId: String(leadId),
      metadata: { source: "customer_report" },
    });

    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const recipients = members
      .filter((member) => ["owner", "admin", "manager", "sales_rep", "rep"].includes(member.role))
      .map((member) => member.email)
      .filter((email): email is string => Boolean(email));
    await ctx.scheduler.runAfter(0, api.email.sendLeadNotification, {
      to: Array.from(new Set(recipients)),
      leadName: args.name.trim(),
      leadEmail: args.email,
      leadPhone: args.phone,
      utility: `${report.utilityName} - ${report.city}, ${report.state}`,
    });

    return leadId;
  },
});

export const submitEnterpriseLead = mutation({
  args: {
    name: v.string(),
    companyName: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    if (!name) throw new Error("Name is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Valid email is required");

    const userId = await getAuthUserId(ctx);
    const leadId = await ctx.db.insert("enterpriseLeads", {
      name,
      companyName: args.companyName?.trim() || undefined,
      email,
      phone: args.phone?.trim() || undefined,
      message: args.message?.trim() || undefined,
      source: args.source || "enterprise_pricing",
      status: "new",
      submittedByUserId: userId || undefined,
    });

    await audit(ctx, {
      actorId: userId || undefined,
      action: "enterprise_lead.created",
      entityType: "enterpriseLead",
      entityId: String(leadId),
      metadata: { source: args.source || "enterprise_pricing", email },
    });

    return leadId;
  },
});

export const getLeads = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;

    return await ctx.db
      .query("leads")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .order("desc")
      .collect();
  },
});

export const getEnterpriseLeads = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    if (!["owner", "admin"].includes(result.membership.role)) return [];

    return await ctx.db.query("enterpriseLeads").order("desc").collect();
  },
});

export const updateLeadStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (membership.companyId !== lead.companyId) throw new Error("Access denied");

    await ctx.db.patch(args.leadId, { status: args.status });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "lead.status_updated",
      entityType: "lead",
      entityId: String(args.leadId),
      metadata: { status: args.status },
    });
  },
});

export const updateEnterpriseLeadStatus = mutation({
  args: {
    leadId: v.id("enterpriseLeads"),
    status: v.union(v.literal("new"), v.literal("contacted"), v.literal("closed")),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "admin");
    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Enterprise lead not found");

    await ctx.db.patch(args.leadId, { status: args.status });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "enterprise_lead.status_updated",
      entityType: "enterpriseLead",
      entityId: String(args.leadId),
      metadata: { status: args.status },
    });
  },
});

export const importLeads = mutation({
  args: {
    leads: v.array(v.object({
      name: v.string(),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      message: v.optional(v.string()),
      source: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "manager");
    const rows = args.leads.slice(0, 500);
    let imported = 0;
    let skippedDuplicate = 0;
    let skippedInvalid = 0;

    // Pre-load existing emails for duplicate detection
    const existingLeads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q: any) => q.eq("companyId", membership.companyId))
      .collect();
    const existingEmails = new Set(
      existingLeads
        .map((l: any) => l.email?.toLowerCase())
        .filter(Boolean)
    );

    for (const lead of rows) {
      const name = lead.name?.trim();
      if (!name) { skippedInvalid++; continue; }

      // Normalize email — strip whitespace, lowercase
      const email = lead.email?.trim().toLowerCase().replace(/\s+/g, "") || undefined;

      // Basic email validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skippedInvalid++;
        continue;
      }

      // Skip duplicate emails within this company
      if (email && existingEmails.has(email)) {
        skippedDuplicate++;
        continue;
      }

      // Normalize phone — strip non-digit chars except leading +
      let phone = lead.phone?.trim() || undefined;
      if (phone) {
        phone = phone.replace(/[^\d+]/g, "");
        if (phone.length < 7) phone = undefined;
      }

      await ctx.db.insert("leads", {
        companyId: membership.companyId,
        name,
        email,
        phone,
        message: lead.message?.trim() || undefined,
        status: "new",
        source: lead.source || "crm_csv_import",
      });

      if (email) existingEmails.add(email);
      imported += 1;
    }

    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "leads.imported",
      entityType: "lead",
      metadata: { imported, attempted: rows.length, skippedDuplicate, skippedInvalid, source: "crm_csv_import" },
    });

    return { imported, attempted: rows.length, skippedDuplicate, skippedInvalid };
  },
});

export const getNewLeadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!membership) return 0;

    const newLeads = await ctx.db
      .query("leads")
      .withIndex("by_status", (q) =>
        q.eq("companyId", membership.companyId).eq("status", "new")
      )
      .collect();

    return newLeads.length;
  },
});
