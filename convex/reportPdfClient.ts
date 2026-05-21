"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
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

/**
 * Accept a client-side generated PDF (already stored in Convex storage),
 * generate a flipbook from it, and update the report record.
 */
export const finalizePdf = action({
  args: {
    reportId: v.id("reports"),
    pdfStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get public URL for the stored PDF
    const pdfUrl = await ctx.storage.getUrl(args.pdfStorageId);
    if (!pdfUrl) throw new Error("Could not get public URL for uploaded PDF");

    // Fetch report info for flipbook title
    const report: any = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
    if (!report) throw new Error("Report not found");

    const city = report.customerCity || report.city || "";
    const state = report.customerState || report.state || "";
    const zip = report.customerZip || report.zip || "";

    // Create flipbook from uploaded PDF
    const flipbook = await createFlipbook(
      pdfUrl,
      `${report.customerName || "Homeowner"} Water Quality Report`,
      `${city}, ${state} ${zip}`,
    );

    // Update report with PDF + flipbook URLs
    await ctx.runMutation(api.reports.updateReportUrls, {
      reportId: args.reportId,
      pdfStorageId: args.pdfStorageId,
      pdfUrl,
      flipbookUrl: flipbook.url,
      flipbookThumbnail: flipbook.thumbnail,
      flipbookId: flipbook.id,
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
