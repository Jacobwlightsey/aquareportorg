import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { audit, enforceReportLimit, getMembership, reportUsageStatus, requireRole, trackUsage } from "./security";

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
  return Math.max(1, Math.min(100, Math.round(aquaScore)));
}

function finiteNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
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

function isDetectedContaminant(contaminant: any) {
  return contaminant?.detected !== false && contaminant?.detection_status !== "not_detected";
}

/**
 * Unified AquaScore — matches myaquareport.com consumer scoring.
 * Uses actual detected-value / limit ratios, not flat boolean penalties.
 */
function calculateAquaScoreFromContaminants(contaminants: any[]): number | undefined {
  const detected = contaminants.filter(isDetectedContaminant);
  if (detected.length === 0) return undefined;

  let score = 100;

  for (const c of detected) {
    const val = c?.detected_level ?? c?.value ?? 0;
    const legal = c?.legal_limit;
    const health = c?.health_guideline;

    // Base penalty: every detected contaminant matters
    score -= 1;

    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) score -= 9;       // extreme violation
      else if (ratio > 1.0) score -= 5;  // over legal limit
      else if (ratio > 0.75) score -= 2; // approaching limit
      else if (ratio > 0.5) score -= 0.5;
    } else if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) score -= 7;       // extreme
      else if (ratio > 1.5) score -= 4;  // serious
      else if (ratio > 1.0) score -= 2;  // over health guideline
      else if (ratio > 0.5) score -= 0.5;
    }
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

function computeFieldReadingAdjustment(report: any): number {
  const chlorine = typeof report?.chlorine === "number" ? report.chlorine : undefined;
  const hardness = typeof report?.hardness === "number" ? report.hardness : undefined;
  const tds = typeof report?.tds === "number" ? report.tds : undefined;
  const ph = typeof report?.ph === "number" ? report.ph : undefined;

  let adjustment = 0;
  let factors = 0;

  if (chlorine !== undefined) {
    factors++;
    if (chlorine < 0.2) adjustment += 3;
    else if (chlorine <= 1) adjustment += 1;
    else if (chlorine <= 2) adjustment -= 1;
    else if (chlorine <= 4) adjustment -= 3;
    else adjustment -= 5;
  }
  if (hardness !== undefined) {
    factors++;
    if (hardness <= 1) adjustment += 3;
    else if (hardness <= 3.5) adjustment += 1;
    else if (hardness <= 7) adjustment -= 1;
    else if (hardness <= 10.5) adjustment -= 2;
    else if (hardness <= 15) adjustment -= 4;
    else adjustment -= 6;
  }
  if (tds !== undefined) {
    factors++;
    if (tds <= 50) adjustment += 3;
    else if (tds <= 150) adjustment += 2;
    else if (tds <= 300) adjustment += 0;
    else if (tds <= 500) adjustment -= 1;
    else if (tds <= 1000) adjustment -= 3;
    else adjustment -= 6;
  }
  if (ph !== undefined) {
    factors++;
    if (ph >= 6.8 && ph <= 7.4) adjustment += 3;
    else if (ph >= 6.5 && ph < 6.8) adjustment += 0;
    else if (ph < 6.5) adjustment -= 3;
    else if (ph > 7.4 && ph <= 8.5) adjustment += 0;
    else adjustment -= 3;
  }

  return factors > 0 ? Math.round((adjustment / factors) * 3) : 0;
}

function withNormalizedAquaScore<T extends { waterScore?: number; scoreMode?: string; contaminants?: string }>(report: T) {
  const contaminantScore = calculateAquaScoreFromContaminants(parseReportContaminants(report.contaminants));
  const fieldAdj = computeFieldReadingAdjustment(report);
  const baseScore = contaminantScore ?? normalizeAquaScore(report.waterScore, report.scoreMode);
  const finalScore = baseScore !== undefined ? Math.max(1, Math.min(100, Math.round(baseScore + fieldAdj))) : undefined;
  return {
    ...report,
    rawWaterScore: report.waterScore,
    waterScore: finalScore,
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
    populationServed: v.union(v.number(), v.string(), v.null()),
    waterSource: v.union(v.string(), v.null()),
    totalContaminants: v.union(v.number(), v.string(), v.null()),
    overHealthGuidelines: v.union(v.number(), v.string(), v.null()),
    overLegalLimits: v.union(v.number(), v.string(), v.null()),
    contaminants: v.string(),
    customerName: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerCity: v.optional(v.string()),
    customerState: v.optional(v.string()),
    customerZip: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    waterScore: v.optional(v.union(v.number(), v.string(), v.null())),
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
      populationServed: finiteNumber(args.populationServed),
      waterSource: args.waterSource || "unknown",
      totalContaminants: finiteNumber(args.totalContaminants),
      overHealthGuidelines: finiteNumber(args.overHealthGuidelines),
      overLegalLimits: finiteNumber(args.overLegalLimits),
      contaminants: args.contaminants,
      customerName: optionalString(args.customerName),
      customerAddress: optionalString(args.customerAddress),
      customerCity: optionalString(args.customerCity),
      customerState: optionalString(args.customerState),
      customerZip: optionalString(args.customerZip),
      customerPhone: optionalString(args.customerPhone),
      customerEmail: optionalString(args.customerEmail),
      waterScore: calculateAquaScoreFromContaminants(parseReportContaminants(args.contaminants))
        ?? (args.waterScore === null || args.waterScore === undefined ? undefined : finiteNumber(args.waterScore)),
      scoreMode: "aqua_score_v1",
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

    // Auto-create consumer referral (non-blocking, runs as background action)
    await ctx.scheduler.runAfter(0, internal.dealerShared.autoCreateReferralForReport, {
      reportId: String(reportId),
      companyId: String(membership.companyId),
      companyName: (company as any)?.name || "",
      dealerId: String(userId),
      customerName: optionalString(args.customerName),
      customerAddress: optionalString(args.customerAddress),
      customerZip: optionalString(args.customerZip) || args.zip,
      customerEmail: optionalString(args.customerEmail),
      customerPhone: optionalString(args.customerPhone),
      utilityName: args.utilityName,
      city: args.city,
      state: args.state,
      zip: args.zip,
      waterScore: calculateAquaScoreFromContaminants(parseReportContaminants(args.contaminants))
        ?? (args.waterScore === null || args.waterScore === undefined ? undefined : finiteNumber(args.waterScore)),
    });

    // Auto-create lead + deal so pipeline/funnel updates automatically
    await ctx.scheduler.runAfter(0, internal.deals.autoCreateLeadAndDeal, {
      companyId: membership.companyId,
      reportId,
      userId,
      customerName: optionalString(args.customerName),
      customerEmail: optionalString(args.customerEmail),
      customerPhone: optionalString(args.customerPhone),
      customerAddress: optionalString(args.customerAddress),
      shareToken,
      city: args.city,
      state: args.state,
      waterScore: calculateAquaScoreFromContaminants(parseReportContaminants(args.contaminants))
        ?? (args.waterScore === null || args.waterScore === undefined ? undefined : finiteNumber(args.waterScore)),
      source: "report",
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

export const getReportUsageStatus = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const company = await ctx.db.get(result.membership.companyId);
    if (!company) return null;
    const usage = await reportUsageStatus(ctx, company);
    const companyRecord = company as any;
    const plan = companyRecord.stripePlan || "free";
    const isActive = companyRecord.stripeStatus === "active";
    const effectivePlan = isActive ? plan : "free";

    // Count total reports ever created (not just this month) — for free trial tracking
    const allReports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q: any) => q.eq("companyId", result.membership.companyId))
      .collect();
    const totalReportsEver = allReports.length;

    // Free trial state
    const isFree = effectivePlan === "free";
    const hasUsedFreeTrial = isFree && totalReportsEver >= 1;
    const freeTrialRemaining = isFree ? Math.max(0, 1 - totalReportsEver) : null;
    // Trial experience: they've created their 1 free report and should still have
    // full Growth-level access to demo, verify, flipbook etc. for that report.
    // Lock out only when they try to create a 2nd report.
    const isInTrialExperience = isFree && totalReportsEver === 1;

    return {
      plan: effectivePlan,
      status: companyRecord.stripeStatus || "none",
      limit: Number.isFinite(usage.limit) ? usage.limit : null,
      used: usage.used,
      remaining: Number.isFinite(usage.remaining) ? usage.remaining : null,
      totalReportsEver,
      isFree,
      hasUsedFreeTrial,
      freeTrialRemaining,
      isInTrialExperience,
    };
  },
});

export const getReport = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    let report;
    try {
      report = await ctx.db.get(args.reportId);
    } catch {
      return null;
    }
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
      customProposalUrl: (company as any)?.customProposalUrl,
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
    const fieldAdj = computeFieldReadingAdjustment(report);
    const baseScore = contaminantScore ?? normalizeAquaScore(report.waterScore, report.scoreMode);
    const finalScore = baseScore !== undefined ? Math.max(1, Math.min(100, Math.round(baseScore + fieldAdj))) : undefined;

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
      waterScore: finalScore,
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
    waterScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireRole(ctx, "sales_rep");
    const report = await ctx.db.get(args.reportId);
    if (!report || report.companyId !== membership.companyId) {
      throw new Error("Report not found");
    }

    const patch: any = {
      pdfStorageId: args.pdfStorageId,
      pdfUrl: args.pdfUrl,
      flipbookUrl: args.flipbookUrl,
      flipbookThumbnail: args.flipbookThumbnail,
      flipbookId: args.flipbookId,
    };
    if (args.waterScore !== undefined) {
      patch.waterScore = args.waterScore;
      patch.scoreMode = "aqua_score_v1";
    }
    await ctx.db.patch(args.reportId, patch);
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
      testNotes: optionalString(args.testNotes),
      repName: optionalString(args.repName),
      repDate: optionalString(args.repDate),
      repPhone: optionalString(args.repPhone),
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

// ─── Customer Hub: all linked records for a report ───────────────

export const getCustomerHub = query({
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

    // Deals linked to this report
    const deals = await ctx.db
      .query("deals")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    const dealIds = new Set(deals.map((d) => d._id));

    // Appointments linked to this report's deals
    const allAppts = await ctx.db
      .query("appointments")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const appointments = allAppts.filter(
      (a) => a.reportId === args.reportId || (a.dealId && dealIds.has(a.dealId))
    );

    // Follow-up messages linked to this report
    const allMessages = await ctx.db
      .query("followUpMessages")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const followUps = allMessages.filter(
      (m) => m.reportId === args.reportId || (m.dealId && dealIds.has(m.dealId as any))
    );

    // Proposals linked to this report or its deals
    const allProposals = await ctx.db
      .query("proposals")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const proposals = allProposals.filter(
      (p) => p.reportId === args.reportId || (p.dealId && dealIds.has(p.dealId))
    );

    // Retention: service agreements + reminders + review requests for same customer name
    const custName = report.customerName?.toLowerCase().trim();
    const allAgreements = await ctx.db
      .query("serviceAgreements")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const agreements = custName
      ? allAgreements.filter((a) => a.customerName?.toLowerCase().trim() === custName)
      : [];

    const allReminders = await ctx.db
      .query("serviceReminders")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const reminders = custName
      ? allReminders.filter((r) => r.customerName?.toLowerCase().trim() === custName)
      : [];

    const allReviews = await ctx.db
      .query("reviewRequests")
      .withIndex("by_company", (q) => q.eq("companyId", report.companyId))
      .collect();
    const reviews = allReviews.filter(
      (r) => (r.dealId && dealIds.has(r.dealId)) || (custName && r.customerName?.toLowerCase().trim() === custName)
    );

    return {
      deals,
      appointments: appointments.sort((a, b) => a.scheduledAt - b.scheduledAt),
      followUps: followUps.sort((a, b) => a.scheduledAt - b.scheduledAt),
      proposals: proposals.sort((a, b) => (b as any)._creationTime - (a as any)._creationTime),
      agreements,
      reminders: reminders.sort((a, b) => a.dueDate - b.dueDate),
      reviews: reviews.sort((a, b) => a.scheduledAt - b.scheduledAt),
    };
  },
});
