"use node";

import { randomBytes } from "node:crypto";
import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

const UNLOCKED_PLANS = new Set(["starter", "growth", "pro", "enterprise"]);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function makeReferralCode() {
  return `aqr_${randomBytes(9).toString("base64url")}`;
}

function parseContaminants(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const NON_CONTAMINANTS = new Set([
  "reverse osmosis", "water softener", "carbon filter", "uv disinfection",
  "ion exchange", "distillation", "filtration", "chlorination", "ozonation", "aeration",
]);

function isDetectedContaminant(contaminant: any) {
  if (contaminant?.detected === false || contaminant?.detection_status === "not_detected") return false;
  const n = (contaminant?.contaminant || contaminant?.name || "").toLowerCase().trim();
  if (NON_CONTAMINANTS.has(n)) return false;
  return true;
}

/**
 * Ratio-based AquaScore — matches reports.ts + waterScore.ts algorithm.
 * Uses detected_level / legal_limit (or health_guideline) ratios with
 * graduated penalties instead of the old flat boolean-flag approach.
 */
function computeReferralAquaScore(contaminants: any[]) {
  const detectedContaminants = contaminants.filter(isDetectedContaminant);
  let score = 100;

  for (const c of detectedContaminants) {
    const val = c?.detected_level ?? c?.value ?? 0;
    const legal = c?.legal_limit;
    const health = c?.health_guideline;
    const timesAbove = c?.times_above_ewg;

    // Base penalty
    score -= 0.5;

    // Compute legal penalty
    let legalPenalty = 0;
    if (legal && legal > 0 && val > 0) {
      const ratio = val / legal;
      if (ratio > 1.5) legalPenalty = 7;
      else if (ratio > 1.0) legalPenalty = 4;
      else if (ratio > 0.75) legalPenalty = 1;
      else if (ratio > 0.5) legalPenalty = 0.5;
    } else if (c?.over_legal) {
      legalPenalty = 4;
    }

    // Compute health penalty
    let healthPenalty = 0;
    if (health && health > 0 && val > 0) {
      const ratio = val / health;
      if (ratio > 3.0) healthPenalty = 5;
      else if (ratio > 1.5) healthPenalty = 3;
      else if (ratio > 1.0) healthPenalty = 2;
      else if (ratio > 0.5) healthPenalty = 0.5;
    } else if (c?.over_health) {
      if (timesAbove && timesAbove > 3) healthPenalty = 5;
      else if (timesAbove && timesAbove > 1.5) healthPenalty = 3;
      else healthPenalty = 2;
    }

    // Apply the worse of the two penalties
    score -= Math.max(legalPenalty, healthPenalty);
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

async function insertReferral(row: Record<string, unknown>) {
  const supabaseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(`${supabaseUrl}/rest/v1/dealer_referrals`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Could not create consumer referral: ${text || response.statusText}`);
  }

  const parsed = text ? JSON.parse(text) : [];
  return Array.isArray(parsed) ? parsed[0] : parsed;
}

export const createConsumerReferral = action({
  args: {
    reportId: v.id("reports"),
  },
  handler: async (ctx, args): Promise<{
    id: string;
    referralCode: string;
    referralUrl: string;
  }> => {
    const user: any = await ctx.runQuery(api.auth.currentUser);
    if (!user) throw new ConvexError("Sign in before creating a consumer referral link.");

    const subscription: any = await ctx.runQuery(api.stripe.getSubscription);
    const activePlan = subscription?.status === "active" ? subscription.plan : "free";

    // Allow free trial users (their 1 free report) to create referrals
    let isTrialAllowed = false;
    if (activePlan === "free") {
      const usage: any = await ctx.runQuery(api.reports.getReportUsageStatus, {});
      isTrialAllowed = usage?.isInTrialExperience === true;
    }

    if (!UNLOCKED_PLANS.has(activePlan) && !isTrialAllowed) {
      throw new ConvexError("Consumer referral links are available on Starter plans and above. Upgrade to unlock this feature.");
    }

    const report: any = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
    if (!report) throw new ConvexError("Report not found or unavailable.");

    const consumerUrl = (process.env.MYAQUAREPORT_URL || "https://myaquareport.com").replace(/\/$/, "");
    const referralCode = makeReferralCode();
    const referralUrl = `${consumerUrl}/claim/${referralCode}`;
    const contaminants = parseContaminants(report.contaminants);
    const waterScore = computeReferralAquaScore(contaminants);

    const row = {
      referral_code: referralCode,
      dealer_id: String(user._id),
      company_id: String(report.companyId),
      report_id: String(args.reportId),
      customer_name: report.customerName || null,
      customer_email: report.customerEmail || null,
      customer_phone: report.customerPhone || null,
      customer_address: report.customerAddress || null,
      customer_city: report.customerCity || null,
      customer_state: report.customerState || null,
      customer_zip: report.customerZip || report.zip || null,
      source_platform: "aquareport",
      report_data: {
        referralUrl,
        generatedAt: new Date().toISOString(),
        dealer: {
          userId: String(user._id),
          email: user.email,
          name: user.name,
        },
        company: {
          id: String(report.companyId),
          name: report.companyName,
          logoUrl: report.companyLogo,
          color: report.companyColor,
          phone: report.companyPhone,
          email: report.companyEmail,
          website: report.companyWebsite,
        },
        customer: {
          name: report.customerName,
          email: report.customerEmail,
          phone: report.customerPhone,
          address: report.customerAddress,
          city: report.customerCity,
          state: report.customerState,
          zip: report.customerZip,
        },
        report: {
          id: String(args.reportId),
          utilityName: report.utilityName,
          pwsid: report.pwsid,
          city: report.city,
          state: report.state,
          zip: report.zip,
          populationServed: report.populationServed,
          waterSource: report.waterSource,
          waterScore,
          scoreMode: report.scoreMode,
          totalContaminants: report.totalContaminants,
          overHealthGuidelines: report.overHealthGuidelines,
          overLegalLimits: report.overLegalLimits,
          contaminants,
          fieldReadings: {
            chlorine: report.chlorine,
            hardness: report.hardness,
            tds: report.tds,
            ph: report.ph,
          },
          pdfUrl: report.pdfUrl,
          flipbookUrl: report.flipbookUrl,
        },
      },
    };

    let inserted;
    try {
      inserted = await insertReferral(row);
    } catch (err: any) {
      throw new ConvexError(err?.message || "Could not create consumer referral. Please try again.");
    }

    return {
      id: inserted?.id,
      referralCode,
      referralUrl,
    };
  },
});
