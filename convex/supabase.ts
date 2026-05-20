import { action } from "./_generated/server";
import { v } from "convex/values";
import { requireEnv } from "./security";

async function supabaseRpc(fn: string, body: Record<string, unknown>) {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Supabase RPC ${fn} failed with ${res.status}`);
  }
  return res.json();
}

function unwrapReportRow(row: any) {
  if (!row || typeof row !== "object") return row;
  if (row.utility_info?.utility_name) return row;
  if (row.aquareport_build_report_from_legacy?.utility_info) return row.aquareport_build_report_from_legacy;
  if (row.get_water_report?.utility_info) return row.get_water_report;
  if (row.zip_water_report?.utility_info) return row.zip_water_report;
  const values = Object.values(row);
  const jsonValue = values.find((value: any) => value?.utility_info?.utility_name);
  return jsonValue || row;
}

function normalizeReportData(data: any) {
  if (Array.isArray(data)) return data.map(unwrapReportRow);
  return unwrapReportRow(data);
}

// Lookup all utilities for a ZIP
export const lookupByZip = action({
  args: { zip: v.string() },
  handler: async (_ctx, { zip }) => {
    const data = await supabaseRpc("lookup_by_zip", { p_zip: zip });
    return Array.isArray(data) ? data : [];
  },
});

// Get water report for a specific ZIP (returns the primary/largest utility)
export const zipWaterReport = action({
  args: { zip: v.string() },
  handler: async (_ctx, { zip }) => {
    const data = await supabaseRpc("zip_water_report", { p_zip: zip });
    const reports = normalizeReportData(data);
    if (Array.isArray(reports) && reports.length > 0 && reports[0]?.utility_info?.utility_name) {
      return reports[0];
    }
    return null;
  },
});

// Get water report for a specific utility by PWSID
export const getWaterReport = action({
  args: { pwsid: v.string() },
  handler: async (_ctx, { pwsid }) => {
    const data = await supabaseRpc("get_water_report", { p_pwsid: pwsid });
    const reports = normalizeReportData(data);
    if (Array.isArray(reports) && reports.length > 0 && reports[0]?.utility_info?.utility_name) {
      return reports[0];
    }
    return null;
  },
});

// Search utilities by name
export const searchUtilities = action({
  args: { name: v.string(), state: v.optional(v.string()) },
  handler: async (_ctx, { name, state }) => {
    const data = await supabaseRpc("search_utilities", {
      p_name: name,
      p_state: state || null,
    });
    return Array.isArray(data) ? data : [];
  },
});
