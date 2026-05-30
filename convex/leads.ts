import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { audit, getMembership, requireRole, trackUsage } from "./security";
import { advanceLeadStage } from "./pipelineHelpers";

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
      status: "new_lead",
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

    // Fire attribution tracking event
    await ctx.runMutation(internal.tracking.recordEvent, {
      companyId: report.companyId,
      eventName: "Lead",
      eventCategory: "conversion",
      metadata: JSON.stringify({ source: "customer_report", leadId: String(leadId) }),
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
      status: "new_lead",
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
    status: v.union(
      // Legacy stages (still accepted, auto-normalized)
      v.literal("new"), v.literal("contacted"), v.literal("closed"),
      v.literal("appointment_set"), v.literal("demo_completed"),
      v.literal("proposal_sent"), v.literal("negotiation"), v.literal("closed_won"),
      // New unified pipeline stages
      v.literal("new_lead"), v.literal("call_to_set"), v.literal("scheduled"),
      v.literal("report_created"), v.literal("demo_done"), v.literal("forms_sent"),
      v.literal("sold"), v.literal("installed"), v.literal("closed_lost")
    ),
    force: v.optional(v.boolean()),
    lostReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");

    const lead = await ctx.db.get(args.leadId);
    if (!lead) throw new Error("Lead not found");
    if (membership.companyId !== lead.companyId) throw new Error("Access denied");

    // Use forward-only advanceLeadStage with stageHistory
    const changed = await advanceLeadStage(
      ctx, args.leadId, args.status, String(userId),
      { force: args.force }
    );

    // Set lostReason if closing as lost
    if (args.lostReason && args.status === "closed_lost") {
      await ctx.db.patch(args.leadId, { lostReason: args.lostReason });
    }

    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "lead.status_updated",
      entityType: "lead",
      entityId: String(args.leadId),
      metadata: { status: args.status, changed },
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
        status: "new_lead",
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
        q.eq("companyId", membership.companyId).eq("status", "new_lead")
      )
      .collect();

    return newLeads.length;
  },
});

// ─── Create a lead directly from the pipeline / dashboard ─────────
export const createLead = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    message: v.optional(v.string()),
    source: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    zip: v.optional(v.string()),
    dealValue: v.optional(v.number()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");
    if (!args.name.trim()) throw new Error("Name is required");

    const leadId = await ctx.db.insert("leads", {
      companyId: membership.companyId,
      name: args.name.trim(),
      email: args.email || undefined,
      phone: args.phone || undefined,
      message: args.message || undefined,
      source: args.source || "pipeline",
      status: "new_lead",
      address: args.address || undefined,
      city: args.city || undefined,
      state: args.state || undefined,
      zip: args.zip || undefined,
      dealValue: args.dealValue || undefined,
      priority: args.priority || undefined,
      stageHistory: JSON.stringify([
        { stage: "new_lead", timestamp: Date.now(), userId: String(userId) },
      ]),
    });

    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "lead.created",
      entityType: "lead",
      entityId: String(leadId),
      metadata: { source: args.source || "pipeline" },
    });

    return leadId;
  },
});

// ─── Get pipeline stats computed from leads ──────────────────────
export const getPipelineStats = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const { membership } = result;
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();

    const stages = [
      "new_lead", "call_to_set", "scheduled", "report_created",
      "demo_done", "forms_sent", "sold", "installed", "closed_lost",
    ];
    const byStage: Record<string, { count: number; value: number }> = {};
    for (const s of stages) byStage[s] = { count: 0, value: 0 };

    let totalValue = 0;
    let wonValue = 0;
    let wonCount = 0;

    for (const lead of leads) {
      const stage = lead.status || "new_lead";
      if (byStage[stage]) {
        byStage[stage].count++;
        byStage[stage].value += lead.dealValue ?? 0;
      }
      totalValue += lead.dealValue ?? 0;
      if (stage === "sold" || stage === "installed") {
        wonValue += lead.dealValue ?? 0;
        wonCount++;
      }
    }

    const activeLeads = leads.filter(
      (l) => l.status !== "sold" && l.status !== "installed" && l.status !== "closed_lost"
    );
    const closedCount = leads.filter(
      (l) => l.status === "sold" || l.status === "installed" || l.status === "closed_lost"
    ).length;

    return {
      byStage,
      totalLeads: leads.length,
      activeLeads: activeLeads.length,
      totalPipelineValue: activeLeads.reduce((s, l) => s + (l.dealValue ?? 0), 0),
      wonValue,
      wonCount,
      avgDealSize: wonCount > 0 ? Math.round(wonValue / wonCount) : 0,
      winRate:
        closedCount > 0
          ? Math.round((wonCount / closedCount) * 100)
          : 0,
    };
  },
});

// ─── Create a lead from Facebook Lead Ads (Zapier webhook) ────────
export const createFacebookLead = internalMutation({
  args: {
    companyId: v.id("companies"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    fbLeadId: v.string(),
    fbFormId: v.optional(v.string()),
    fbFormName: v.optional(v.string()),
    fbCampaignName: v.optional(v.string()),
    fbAdSetName: v.optional(v.string()),
    fbAdName: v.optional(v.string()),
    rawFbFields: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("leads", {
      companyId: args.companyId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      source: args.source,
      status: "new_lead",
      fbLeadId: args.fbLeadId,
      fbFormId: args.fbFormId,
      fbFormName: args.fbFormName,
      fbCampaignName: args.fbCampaignName,
      fbAdSetName: args.fbAdSetName,
      fbAdName: args.fbAdName,
      rawFbFields: args.rawFbFields,
      // Consent implied by Facebook Lead Ad submission — not explicit opt-in
      consentGiven: undefined,
      consentTimestamp: undefined,
    });

    // Fire attribution tracking event for Facebook leads
    // (direct insert since internalMutation can't call ctx.runMutation)
    await ctx.db.insert("trackingEvents", {
      companyId: args.companyId,
      eventName: "Lead",
      eventCategory: "conversion",
      utmSource: "facebook",
      utmMedium: "paid",
      utmCampaign: args.fbCampaignName || undefined,
      metadata: JSON.stringify({
        source: "facebook",
        leadId: String(leadId),
        fbLeadId: args.fbLeadId,
        fbFormName: args.fbFormName,
      }),
    });

    return leadId;
  },
});

// ─── Advance lead stage by reportId (replaces deals.updateDealStageByReport) ─
export const advanceLeadByReport = mutation({
  args: {
    reportId: v.id("reports"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return; // silently skip if not authenticated

    const lead = await ctx.db
      .query("leads")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .first();

    if (!lead || lead.companyId !== result.membership.companyId) return; // silently skip

    await advanceLeadStage(
      ctx,
      lead._id,
      args.stage,
      String(result.userId),
    );
  },
});
