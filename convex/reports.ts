import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, enforceReportLimit, getMembership, requireRole, trackUsage } from "./security";

function generateShareToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

function normalizeAquaScore(score: number | undefined, scoreMode: string | undefined) {
  if (score === undefined) return undefined;
  const aquaScore = scoreMode === "risk_v1" ? 100 - score : score;
  return Math.max(0, Math.min(100, Math.round(aquaScore)));
}

function parseReportContaminants(raw?: string) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calculateAquaScoreFromContaminants(contaminants: any[]) {
  const hasContaminantSignal = contaminants.some((contaminant) => contaminant?.over_legal || contaminant?.over_health);
  if (!hasContaminantSignal) return undefined;
  const legalPenalty = Math.min(30, contaminants.filter((contaminant) => contaminant?.over_legal).length * 18);
  const healthPenalty = Math.min(
    59,
    contaminants.reduce((total, contaminant) => {
      if (!contaminant?.over_health || contaminant?.over_legal) return total;
      const multiple = contaminant?.times_above_ewg ?? 1;
      if (multiple >= 100) return total + 9;
      if (multiple >= 25) return total + 7;
      if (multiple >= 10) return total + 5;
      return total + 3;
    }, 0),
  );
  const detectionPenalty = Math.min(10, contaminants.length * 0.5);
  return Math.max(0, Math.min(100, Math.round(100 - legalPenalty - healthPenalty - detectionPenalty)));
}

function withNormalizedAquaScore<T extends { waterScore?: number; scoreMode?: string; contaminants?: string }>(report: T) {
  const contaminantScore = calculateAquaScoreFromContaminants(parseReportContaminants(report.contaminants));
  return {
    ...report,
    rawWaterScore: report.waterScore,
    waterScore: contaminantScore ?? normalizeAquaScore(report.waterScore, report.scoreMode),
    scoreMode: "aqua_score_v1",
  };
}

export const saveReport = mutation({
  args: {
    zip: v.string(),
    utilityName: v.string(),
    pwsid: v.string(),
    city: v.string(),
    state: v.string(),
    populationServed: v.number(),
    waterSource: v.string(),
    totalContaminants: v.number(),
    overHealthGuidelines: v.number(),
    overLegalLimits: v.number(),
    contaminants: v.string(),
    customerName: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    waterScore: v.optional(v.number()),
    scoreMode: v.optional(v.string()),
    chlorine: v.optional(v.number()),
    hardness: v.optional(v.number()),
    tds: v.optional(v.number()),
    ph: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");
    const company = await ctx.db.get(membership.companyId);
    if (!company) throw new Error("Company not found");
    await enforceReportLimit(ctx, company);

    const shareToken = generateShareToken();

    const reportId = await ctx.db.insert("reports", {
      companyId: membership.companyId,
      generatedBy: userId,
      zip: args.zip,
      utilityName: args.utilityName,
      pwsid: args.pwsid,
      city: args.city,
      state: args.state,
      populationServed: args.populationServed,
      waterSource: args.waterSource,
      totalContaminants: args.totalContaminants,
      overHealthGuidelines: args.overHealthGuidelines,
      overLegalLimits: args.overLegalLimits,
      contaminants: args.contaminants,
      customerName: args.customerName,
      customerAddress: args.customerAddress,
      customerCity: args.customerCity,
      customerState: args.customerState,
      customerZip: args.customerZip,
      customerPhone: args.customerPhone,
      customerEmail: args.customerEmail,
      waterScore: args.waterScore,
      scoreMode: args.scoreMode,
      chlorine: args.chlorine,
      hardness: args.hardness,
      tds: args.tds,
      ph: args.ph,
      shareToken,
    });

    await trackUsage(ctx, {
      companyId: membership.companyId,
      userId,
      event: "report.created",
      metadata: { zip: args.zip, pwsid: args.pwsid },
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "report.created",
      entityType: "report",
      entityId: String(reportId),
      metadata: { zip: args.zip, utilityName: args.utilityName },
    });

    return { reportId, shareToken };
  },
});

export const getMyReports = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      reports.map(async (r) => {
        const user = r.generatedBy ? await ctx.db.get(r.generatedBy) : null;
        return {
          ...withNormalizedAquaScore(r),
          generatedByName: (user as any)?.name || "Unknown",
        };
      })
    );

    return enriched;
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const report = await ctx.db.get(args.reportId);
    if (!report) return null;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!membership || membership.companyId !== report.companyId) return null;

    const user = report.generatedBy ? await ctx.db.get(report.generatedBy) : null;
    const company = await ctx.db.get(report.companyId);

    return {
      ...withNormalizedAquaScore(report),
      generatedByName: (user as any)?.name || "Unknown",
      companyName: company?.name || "Unknown",
      companyLogo: company?.logoUrl,
      companyColor: company?.primaryColor || "#2563eb",
      companyPhone: company?.phone,
      companyEmail: company?.email,
      companyWebsite: company?.website,
      solutionProductName: company?.solutionProductName,
      solutionProductImage: company?.solutionProductImage,
      solutionProductDescription: company?.solutionProductDescription,
      solutionProductBullets: company?.solutionProductBullets,
      additionalProducts: company?.additionalProducts,
      testNotes: report.testNotes,
      repName: report.repName,
      repDate: report.repDate,
      repPhone: report.repPhone,
    };
  },
});

// Public query — no auth, lookup by share token
export const getPublicReport = query({
  args: { shareToken: v.string() },
  handler: async (ctx, args) => {
    const report = await ctx.db
      .query("reports")
      .withIndex("by_shareToken", (q) => q.eq("shareToken", args.shareToken))
      .first();

    if (!report) return null;

    const company = await ctx.db.get(report.companyId);
    const contaminantScore = calculateAquaScoreFromContaminants(parseReportContaminants(report.contaminants));

    return {
      utilityName: report.utilityName,
      pwsid: report.pwsid,
      city: report.city,
      state: report.state,
      zip: report.zip,
      populationServed: report.populationServed,
      waterSource: report.waterSource,
      totalContaminants: report.totalContaminants,
      overHealthGuidelines: report.overHealthGuidelines,
      overLegalLimits: report.overLegalLimits,
      contaminants: report.contaminants,
      customerName: report.customerName,
      customerAddress: report.customerAddress,
      customerCity: report.customerCity,
      customerState: report.customerState,
      customerZip: report.customerZip,
      rawWaterScore: report.waterScore,
      waterScore: contaminantScore ?? normalizeAquaScore(report.waterScore, report.scoreMode),
      scoreMode: "aqua_score_v1",
      chlorine: report.chlorine,
      hardness: report.hardness,
      tds: report.tds,
      ph: report.ph,
      pdfUrl: report.pdfUrl,
      flipbookUrl: report.flipbookUrl,
      flipbookThumbnail: report.flipbookThumbnail,
      flipbookId: report.flipbookId,
      createdAt: report._creationTime,
      companyName: company?.name || "AquaReport",
      companyLogo: company?.logoUrl,
      companyColor: company?.primaryColor || "#2563eb",
      companyPhone: company?.phone,
      companyEmail: company?.email,
      companyWebsite: company?.website,
      solutionProductName: company?.solutionProductName,
      solutionProductImage: company?.solutionProductImage,
      solutionProductDescription: company?.solutionProductDescription,
      solutionProductBullets: company?.solutionProductBullets,
      additionalProducts: company?.additionalProducts,
      customerPhone: report.customerPhone,
      testNotes: report.testNotes,
      repName: report.repName,
      repDate: report.repDate,
      repPhone: report.repPhone,
    };
  },
});

export const updateReportUrls = mutation({
  args: {
    reportId: v.id("reports"),
    pdfStorageId: v.id("_storage"),
    pdfUrl: v.string(),
    flipbookUrl: v.optional(v.string()),
    flipbookThumbnail: v.optional(v.string()),
    flipbookId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireRole(ctx, "sales_rep");
    const report = await ctx.db.get(args.reportId);
    if (!report || report.companyId !== membership.companyId) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      pdfStorageId: args.pdfStorageId,
      pdfUrl: args.pdfUrl,
      flipbookUrl: args.flipbookUrl,
      flipbookThumbnail: args.flipbookThumbnail,
      flipbookId: args.flipbookId,
    });
  },
});

export const updateInHomeReadings = mutation({
  args: {
    reportId: v.id("reports"),
    chlorine: v.optional(v.number()),
    hardness: v.optional(v.number()),
    tds: v.optional(v.number()),
    ph: v.optional(v.number()),
    waterScore: v.optional(v.number()),
    testNotes: v.optional(v.string()),
    repName: v.optional(v.string()),
    repDate: v.optional(v.string()),
    repPhone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");
    const report = await ctx.db.get(args.reportId);
    if (!report || report.companyId !== membership.companyId) {
      throw new Error("Report not found");
    }

    await ctx.db.patch(args.reportId, {
      chlorine: args.chlorine,
      hardness: args.hardness,
      tds: args.tds,
      ph: args.ph,
      testNotes: args.testNotes,
      repName: args.repName,
      repDate: args.repDate,
      repPhone: args.repPhone,
      waterScore: args.waterScore,
      scoreMode: "aqua_score_v1",
    });

    await trackUsage(ctx, {
      companyId: membership.companyId,
      userId,
      event: "report.in_home_readings_updated",
      metadata: { reportId: String(args.reportId) },
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "report.in_home_readings_updated",
      entityType: "report",
      entityId: String(args.reportId),
      metadata: {
        chlorine: args.chlorine,
        hardness: args.hardness,
        tds: args.tds,
        ph: args.ph,
      },
    });
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!membership) return null;

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();

    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const thisMonth = reports.filter((r) => r._creationTime >= thirtyDaysAgo);
    const thisWeek = reports.filter((r) => r._creationTime >= sevenDaysAgo);

    const uniqueZips = new Set(reports.map((r) => r.zip));
    const uniqueStates = new Set(reports.map((r) => r.state));

    const contaminantCounts: Record<string, number> = {};
    for (const r of reports) {
      try {
        const contams = JSON.parse(r.contaminants);
        for (const c of contams) {
          if (c.over_health) {
            contaminantCounts[c.contaminant] =
              (contaminantCounts[c.contaminant] || 0) + 1;
          }
        }
      } catch {
        // skip
      }
    }

    const topContaminants = Object.entries(contaminantCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalReports: reports.length,
      thisMonth: thisMonth.length,
      thisWeek: thisWeek.length,
      teamSize: members.length,
      uniqueZips: uniqueZips.size,
      uniqueStates: uniqueStates.size,
      topContaminants,
      highRiskZipCount: uniqueZips.size,
      conversionRate: reports.length ? Math.round((members.length / reports.length) * 100) : 0,
    };
  },
});

export const getRecentActivity = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .order("desc")
      .take(limit);

    return await Promise.all(
      logs.map(async (log) => {
        const actor = log.actorId ? await ctx.db.get(log.actorId) : null;
        let metadata: Record<string, unknown> = {};
        try {
          metadata = log.metadata ? JSON.parse(log.metadata) : {};
        } catch {
          metadata = {};
        }
        return {
          id: log._id,
          createdAt: log._creationTime,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          actorName: (actor as any)?.name || (actor as any)?.email || "A teammate",
          metadata,
        };
      })
    );
  },
});

export const getTerritoryInsights = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;
    const stored = await ctx.db
      .query("territoryInsights")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    if (stored.length > 0) return stored.sort((a, b) => b.riskScore - a.riskScore);

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();

    const byZip = new Map<string, any>();
    for (const report of reports) {
      const entry = byZip.get(report.zip) || {
        zip: report.zip,
        city: report.city,
        state: report.state,
        riskScore: 0,
        totalReports: 0,
        totalLeads: 0,
        conversionRate: 0,
        topContaminants: "[]",
        contaminantCounts: {},
        updatedAt: Date.now(),
      };
      entry.totalReports += 1;
      entry.riskScore += (report.overLegalLimits * 20) + (report.overHealthGuidelines * 5);
      try {
        const contaminants = JSON.parse(report.contaminants);
        for (const contaminant of contaminants) {
          if (contaminant.over_legal || contaminant.over_health) {
            const name = contaminant.contaminant || "Unknown contaminant";
            entry.contaminantCounts[name] = (entry.contaminantCounts[name] || 0) + 1;
          }
        }
      } catch {
        // Ignore malformed legacy contaminant payloads.
      }
      byZip.set(report.zip, entry);
    }
    for (const lead of leads) {
      const report = lead.reportShareToken
        ? await ctx.db
            .query("reports")
            .withIndex("by_shareToken", (q) => q.eq("shareToken", lead.reportShareToken))
            .first()
        : null;
      if (report && byZip.has(report.zip)) byZip.get(report.zip).totalLeads += 1;
    }

    return Array.from(byZip.values())
      .map((entry) => ({
        zip: entry.zip,
        city: entry.city,
        state: entry.state,
        totalReports: entry.totalReports,
        totalLeads: entry.totalLeads,
        updatedAt: entry.updatedAt,
        riskScore: Math.min(100, Math.round(entry.riskScore / Math.max(1, entry.totalReports))),
        conversionRate: entry.totalReports
          ? Math.round((entry.totalLeads / entry.totalReports) * 100)
          : 0,
        topContaminants: JSON.stringify(
          Object.entries(entry.contaminantCounts)
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }))
        ),
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  },
});

export const deleteReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "manager");

    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found");

    if (!membership || membership.companyId !== report.companyId)
      throw new Error("Access denied");

    await ctx.db.delete(args.reportId);
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "report.deleted",
      entityType: "report",
      entityId: String(args.reportId),
    });
  },
});
