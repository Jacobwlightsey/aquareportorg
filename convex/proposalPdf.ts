/**
 * Sprint 4D — Proposal PDF generation action.
 *
 * Uses the same PDFShift pipeline as reportPdf.ts but with a proposal template.
 */
"use node";

import { Buffer } from "node:buffer";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { buildProposalHtml } from "./lib/proposalTemplate";

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value : undefined;
}

async function htmlToPdf(html: string): Promise<Buffer> {
  const apiKey = optionalEnv("PDFSHIFT_API_KEY");
  if (!apiKey) throw new Error("PDF_PROVIDER_NOT_CONFIGURED");

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
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Proposal PDF generation failed with ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

export const generateProposalPdf = action({
  args: {
    reportId: v.id("reports"),
    showPricing: v.optional(v.boolean()),
    monthlyPrice: v.optional(v.string()),
    totalPrice: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!optionalEnv("PDFSHIFT_API_KEY")) {
      return {
        ok: false,
        reason: "PDF_PROVIDER_NOT_CONFIGURED",
        message:
          "Add PDFSHIFT_API_KEY in Convex environment variables to generate proposal PDFs.",
      };
    }

    const report: any = await ctx.runQuery(api.reports.getReport, {
      reportId: args.reportId,
    });
    if (!report) throw new Error("Report not found");

    // reports.getReport already joins company data onto the report object
    // (companyName, companyLogo, companyColor, companyPhone, companyEmail, etc.)

    let contaminants: any[] = [];
    try {
      contaminants = JSON.parse(report.contaminants || "[]");
    } catch {
      contaminants = [];
    }

    // Top contaminants (sorted by severity)
    const topContaminants = contaminants
      .filter(
        (c: any) =>
          c?.detected !== false && c?.detection_status !== "not_detected"
      )
      .sort((a: any, b: any) => {
        if (a.over_legal && !b.over_legal) return -1;
        if (!a.over_legal && b.over_legal) return 1;
        if (a.over_health && !b.over_health) return -1;
        if (!a.over_health && b.over_health) return 1;
        return 0;
      })
      .slice(0, 8)
      .map((c: any) => ({
        name: c.name || c.contaminant || "Unknown",
        detected: c.amount || c.detected || "N/A",
        limit: c.legal_limit || c.health_guideline || "N/A",
        severity: c.over_legal
          ? "critical"
          : c.over_health
            ? "warning"
            : "ok",
      }));

    const html = buildProposalHtml({
      customerName: report.customerName || "Homeowner",
      customerAddress: report.customerAddress,
      customerCity: report.customerCity || report.city,
      customerState: report.customerState || report.state,
      customerZip: report.customerZip || report.zip,
      customerPhone: report.customerPhone,
      customerEmail: report.customerEmail,
      companyName: report.companyName || "Water Treatment Dealer",
      companyPhone: report.companyPhone,
      companyEmail: report.companyEmail,
      companyLogo: report.companyLogo,
      accentColor: report.companyColor || "#2563eb",
      waterScore: report.waterScore ?? 0,
      utilityName: report.utilityName,
      city: report.customerCity || report.city || "",
      state: report.customerState || report.state || "",
      totalContaminants: report.totalContaminants || 0,
      overHealthGuidelines: report.overHealthGuidelines || 0,
      overLegalLimits: report.overLegalLimits || 0,
      topContaminants,
      systemName: report.solutionProductName,
      systemDescription: report.solutionProductDescription,
      systemFeatures: report.solutionProductBullets,
      showPricing: args.showPricing,
      monthlyPrice: args.monthlyPrice,
      totalPrice: args.totalPrice,
      repName: report.repName,
      repPhone: report.repPhone,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const pdfBuffer = await htmlToPdf(html);
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" })
    );
    const pdfUrl = await ctx.storage.getUrl(storageId);
    if (!pdfUrl) throw new Error("Could not create public PDF URL");

    return {
      ok: true,
      pdfUrl,
      storageId,
    };
  },
});
