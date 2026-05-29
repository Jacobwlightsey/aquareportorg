"use node";

import { Buffer } from "node:buffer";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { buildReportHtml } from "./lib/reportTemplate";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const apiKey = optionalEnv("PDFSHIFT_API_KEY");
  if (!apiKey) {
    throw new Error("PDF_PROVIDER_NOT_CONFIGURED");
  }
  const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({
      source: html,
      format: "Letter",
      landscape: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`PDF generation failed with ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function createFlipbook(pdfUrl: string, title: string, subtitle: string) {
  const clientId = requiredEnv("HEYZINE_CLIENT_ID");
  const apiKey = process.env.HEYZINE_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch("https://heyzine.com/api1/rest", {
    method: "POST",
    headers,
    body: JSON.stringify({
      pdf: pdfUrl,
      client_id: clientId,
      title,
      subtitle,
      download: true,
      full_screen: true,
      share: true,
      prev_next: true,
      page_effect: "magazine",
      background_color: "0b1a2e",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Heyzine flipbook creation failed with ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const data = await response.json();
  return {
    id: typeof data.id === "string" ? data.id : undefined,
    url: typeof data.url === "string" ? data.url : undefined,
    thumbnail: typeof data.thumbnail === "string" ? data.thumbnail : undefined,
  };
}

const NON_CONTAMINANTS = new Set([
  "reverse osmosis", "water softener", "carbon filter", "uv disinfection",
  "ion exchange", "distillation", "filtration", "chlorination", "ozonation", "aeration",
]);

function isDetectedContaminant(c: any): boolean {
  if (c?.detected === false || c?.detection_status === "not_detected") return false;
  const n = (c?.contaminant || c?.name || "").toLowerCase().trim();
  if (NON_CONTAMINANTS.has(n)) return false;
  return true;
}

/**
 * Unified AquaScore — matches myaquareport.com consumer scoring.
 * Uses actual detected-value / limit ratios, not flat boolean penalties.
 */
function computePdfAquaScore(contaminants: any[]) {
  const detected = contaminants.filter(isDetectedContaminant);
  let score = 100;

  for (const c of detected) {
    const val = c?.detected_level ?? c?.value ?? 0;
    const legal = c?.legal_limit;
    const health = c?.health_guideline;

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
      const timesAbove = c?.times_above_ewg;
      if (timesAbove && timesAbove > 3) healthPenalty = 5;
      else if (timesAbove && timesAbove > 1.5) healthPenalty = 3;
      else healthPenalty = 2;
    }

    // Apply the worse of the two penalties
    score -= Math.max(legalPenalty, healthPenalty);
  }

  return Math.max(1, Math.min(100, Math.round(score)));
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Field-reading adjustment — must mirror frontend waterScore.ts logic.
 */
function computePdfFieldReadingAdjustment(report: any): number {
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

export const generateReportPdf = action({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    if (!optionalEnv("PDFSHIFT_API_KEY")) {
      return {
        ok: false,
        reason: "PDF_PROVIDER_NOT_CONFIGURED",
        message: "Add PDFSHIFT_API_KEY in Convex environment variables to generate PDF and Heyzine flipbooks.",
      };
    }

    const report: any = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
    if (!report) throw new Error("Report not found");

    let contaminants: any[] = [];
    try {
      contaminants = JSON.parse(report.contaminants);
    } catch {
      contaminants = [];
    }

    const city = report.customerCity || report.city || "";
    const state = report.customerState || report.state || "";
    const zip = report.customerZip || report.zip || "";

    // Compute score: contaminant-based + field reading adjustment (matches frontend)
    const baseScore = computePdfAquaScore(contaminants);
    const fieldAdj = computePdfFieldReadingAdjustment(report);
    const finalScore = Math.max(1, Math.min(100, Math.round(baseScore + fieldAdj)));

    const html = buildReportHtml({
      customerName: report.customerName || "Homeowner",
      customerAddress: report.customerAddress,
      customerCityStateZip: `${city}, ${state} ${zip}`,
      customerPhone: report.customerPhone,
      companyName: report.companyName || "AquaReport",
      companyPhone: report.companyPhone,
      accentColor: report.companyColor || "#2563eb",
      score: finalScore,
      utilityName: report.utilityName,
      waterSource: report.waterSource || "Unknown",
      populationServed: finiteNumber(report.populationServed),
      city,
      state,
      zip,
      contaminants,
      overHealth: finiteNumber(report.overHealthGuidelines),
      overLegal: finiteNumber(report.overLegalLimits),
      chlorine: report.chlorine,
      hardness: report.hardness,
      tds: report.tds,
      ph: report.ph,
      testNotes: report.testNotes,
      repName: report.repName,
      repDate: report.repDate,
      repPhone: report.repPhone,
      products: report.additionalProducts,
    });

    const pdfBuffer = await htmlToPdf(html);
    const pdfStorageId = await ctx.storage.store(
      new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" }),
    );
    const pdfUrl = await ctx.storage.getUrl(pdfStorageId);
    if (!pdfUrl) throw new Error("Could not create public PDF URL");

    const flipbook = await createFlipbook(
      pdfUrl,
      `${report.customerName || "Homeowner"} Water Quality Report`,
      `${city}, ${state} ${zip}`,
    );

    await ctx.runMutation(api.reports.updateReportUrls, {
      reportId: args.reportId,
      pdfStorageId,
      pdfUrl,
      flipbookUrl: flipbook.url,
      flipbookThumbnail: flipbook.thumbnail,
      flipbookId: flipbook.id,
      waterScore: finalScore,
    });

    return {
      ok: true,
      pdfUrl,
      flipbookUrl: flipbook.url,
      flipbookThumbnail: flipbook.thumbnail,
      flipbookId: flipbook.id,
    };
  },
});
