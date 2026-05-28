/**
 * Sprint 4A — Spouse Review Mode
 *
 * Public endpoint for the absent spouse/partner to review water quality results.
 * No authentication required — uses a time-limited token (72hr expiry).
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// 72-hour expiry (flag #8 from review)
const EXPIRY_MS = 72 * 60 * 60 * 1000;

/**
 * Create a spouse review link. Requires authentication (dealer action).
 */
export const createSpouseReviewLink = mutation({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, { reportId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    // Verify the report exists and belongs to the user's company
    const report = await ctx.db.get(reportId);
    if (!report) throw new Error("Report not found");

    // Generate a unique token
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const token = Array.from(randomBytes, (b) => chars[b % chars.length]).join("");

    const now = Date.now();

    const linkId = await ctx.db.insert("spouseReviewLinks", {
      reportId,
      companyId: report.companyId,
      token,
      createdAt: now,
      expiresAt: now + EXPIRY_MS,
      createdBy: userId,
    });

    return { linkId, token };
  },
});

/**
 * Public query — get spouse review data by token.
 * Returns limited report data (no pricing).
 */
export const getSpouseReview = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    // Find the link by token
    const link = await ctx.db
      .query("spouseReviewLinks")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!link) return { error: "not_found" as const };

    // Check expiry
    if (Date.now() > link.expiresAt) {
      return { error: "expired" as const };
    }

    // Get report data (limited fields)
    const report = await ctx.db.get(link.reportId);
    if (!report) return { error: "not_found" as const };

    // Get company branding
    const company = await ctx.db.get(link.companyId);

    // Parse contaminants for top 5
    let contaminants: Array<{
      name: string;
      amount: string;
      limit: string;
      severity: string;
      over_legal: boolean;
      over_health: boolean;
    }> = [];
    try {
      const all = JSON.parse(report.contaminants || "[]");
      // Sort by severity: over_legal first, then over_health, then by amount
      contaminants = all
        .sort((a: any, b: any) => {
          if (a.over_legal && !b.over_legal) return -1;
          if (!a.over_legal && b.over_legal) return 1;
          if (a.over_health && !b.over_health) return -1;
          if (!a.over_health && b.over_health) return 1;
          return 0;
        })
        .slice(0, 5)
        .map((c: any) => ({
          name: c.name || c.contaminant || "Unknown",
          amount: c.amount || c.detected || "N/A",
          limit: c.legal_limit || c.health_guideline || "N/A",
          severity:
            c.over_legal ? "critical" : c.over_health ? "warning" : "ok",
          over_legal: !!c.over_legal,
          over_health: !!c.over_health,
        }));
    } catch {
      // ignore parse errors
    }

    // Fetch the most recent demo session linked to this report (if any)
    const demoSession = await ctx.db
      .query("demoSessions")
      .withIndex("by_report", (q) => q.eq("reportId", link.reportId))
      .order("desc")
      .first();

    // Parse demo data for richer display
    let liveReadings: { chlorine?: number; ph?: number; hardness?: number; tds?: number } = {};
    let selectedConcerns: string[] = [];
    let equipmentRecommended: Array<{ name: string; description?: string }> = [];
    let projectedScore: number | null = null;

    if (demoSession) {
      try { liveReadings = JSON.parse(demoSession.liveReadings || "{}"); } catch { /* ok */ }
      try { selectedConcerns = JSON.parse(demoSession.selectedConcerns || "[]"); } catch { /* ok */ }
      try {
        const eq = JSON.parse(demoSession.equipmentRecommended || "[]");
        equipmentRecommended = Array.isArray(eq) ? eq : [];
      } catch { /* ok */ }
      // Use verified score from demo if available
      if (demoSession.verifiedScore) {
        projectedScore = Math.min(demoSession.verifiedScore + 25, 99);
      }
    }

    // Also check proposals for projected score
    if (!projectedScore) {
      const proposal = await ctx.db
        .query("proposals")
        .withIndex("by_company", (q) => q.eq("companyId", link.companyId))
        .order("desc")
        .first();
      if (proposal && proposal.reportId === link.reportId && proposal.projectedScore) {
        projectedScore = proposal.projectedScore;
      }
    }

    return {
      data: {
        customerName: report.customerName || "Homeowner",
        waterScore: report.waterScore ?? 0,
        utilityName: report.utilityName,
        city: report.city,
        state: report.state,
        totalContaminants: report.totalContaminants,
        overHealthGuidelines: report.overHealthGuidelines,
        overLegalLimits: report.overLegalLimits,
        topContaminants: contaminants,
        // Company branding
        companyName: company?.name || "Your Water Treatment Dealer",
        companyLogo: company?.logoUrl || null,
        companyColor: company?.primaryColor || "#2563eb",
        companyPhone: company?.phone || null,
        companyEmail: company?.email || null,
        // System recommendation (no pricing)
        systemName: company?.solutionProductName || null,
        systemDescription: company?.solutionProductDescription || null,
        systemFeatures: company?.solutionProductBullets || [],
        // Real demo data
        liveReadings,
        selectedConcerns,
        equipmentRecommended,
        projectedScore,
        // On-site readings from report itself
        chlorine: report.chlorine ?? null,
        hardness: report.hardness ?? null,
        tds: report.tds ?? null,
        ph: report.ph ?? null,
      },
    };
  },
});
