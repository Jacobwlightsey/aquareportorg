"use node";

import { randomBytes } from "node:crypto";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

declare const process: { env: Record<string, string | undefined> };

const UNLOCKED_PLANS = new Set(["growth", "pro", "enterprise"]);

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

function computeReferralAquaScore(contaminants: any[]) {
  const hasContaminantSignal = contaminants.some((contaminant) => contaminant?.over_legal || contaminant?.over_health);
  if (!hasContaminantSignal) return 100;

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
    if (!user) throw new Error("Sign in before creating a consumer referral link.");

    const subscription: any = await ctx.runQuery(api.stripe.getSubscription);
    const activePlan = subscription?.status === "active" ? subscription.plan : "free";
    if (!UNLOCKED_PLANS.has(activePlan)) {
      throw new Error("Consumer referral links are available on Growth, Pro, and Enterprise plans.");
    }

    const report: any = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
    if (!report) throw new Error("Report not found or unavailable.");

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

    const inserted = await insertReferral(row);

    return {
      id: inserted?.id,
      referralCode,
      referralUrl,
    };
  },
});
