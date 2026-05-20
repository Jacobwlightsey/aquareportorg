import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import {
  activePlan,
  audit,
  checkTierAccess,
  getMembership,
  requireRole,
  requireTierAccess,
  tierAccessMessage,
  trackUsage,
} from "./security";

declare const process: { env: Record<string, string | undefined> };

const SYSTEM_SCORE: Record<string, number> = {
  "Excalibur Chlor-A-Soft": 94,
  "Excalibur Premium": 91,
  "SpringWell CF1": 88,
  "AquaOx FCS-2": 86,
  "Pelican PC600": 80,
  "US Water Matrixx": 84,
  "Kind Water E-2000": 82,
  "Pentair Pelican Whole House": 80,
};

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function supabaseBase() {
  return {
    url: env("SUPABASE_URL").replace(/\/$/, ""),
    key: env("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

async function supabaseTable<T>(
  path: string,
  options: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const { url, key } = supabaseBase();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${options.method || "GET"} ${path} failed (${response.status}): ${text || response.statusText}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

function referralCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  const token = Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `aqr_${token}`;
}

function consumerUrl() {
  return (process.env.MYAQUAREPORT_URL || "https://myaquareport.com").replace(/\/$/, "");
}

async function findReferral(input: {
  companyId: string;
  customerEmail?: string;
  customerAddress?: string;
  customerZip?: string;
}) {
  const filters: string[] = [`company_id=eq.${encodeURIComponent(input.companyId)}`];
  if (input.customerEmail) {
    filters.push(`customer_email=eq.${encodeURIComponent(input.customerEmail.toLowerCase())}`);
  } else if (input.customerAddress && input.customerZip) {
    filters.push(`customer_zip=eq.${encodeURIComponent(input.customerZip)}`);
    filters.push(`customer_address=eq.${encodeURIComponent(input.customerAddress)}`);
  } else {
    return null;
  }
  const rows = await supabaseTable<any[]>(`dealer_referrals?${filters.join("&")}&select=*&order=created_at.desc&limit=1`);
  return rows?.[0] || null;
}

async function ensureReferral(input: {
  dealerId: string;
  companyId: string;
  companyName?: string;
  customerName: string;
  customerAddress: string;
  customerZip: string;
  customerEmail?: string;
  customerPhone?: string;
  reportData?: Record<string, unknown>;
}) {
  const existing = await findReferral(input);
  if (existing?.referral_code) {
    return {
      id: existing.id,
      referralCode: existing.referral_code,
      referralUrl: `${consumerUrl()}/claim/${existing.referral_code}`,
      customerEmail: existing.customer_email,
      isNew: false,
    };
  }

  const code = referralCode();
  const referralUrl = `${consumerUrl()}/claim/${code}`;
  const inserted = await supabaseTable<any[]>("dealer_referrals", {
    method: "POST",
    prefer: "return=representation",
    body: {
      referral_code: code,
      dealer_id: input.dealerId,
      company_id: input.companyId,
      customer_name: input.customerName,
      customer_email: input.customerEmail?.toLowerCase() || null,
      customer_phone: input.customerPhone || null,
      customer_address: input.customerAddress,
      customer_zip: input.customerZip,
      source_platform: "aquareport",
      claimed: false,
      report_data: {
        referralUrl,
        generatedAt: new Date().toISOString(),
        company: {
          id: input.companyId,
          name: input.companyName,
        },
        customer: {
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
          address: input.customerAddress,
          zip: input.customerZip,
        },
        ...(input.reportData || {}),
      },
    },
  });

  return {
    id: inserted?.[0]?.id,
    referralCode: code,
    referralUrl,
    customerEmail: input.customerEmail?.toLowerCase() || null,
    isNew: true,
  };
}

export const getDealerContext = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const user: any = await ctx.db.get(result.userId);
    const company: any = await ctx.db.get(result.membership.companyId);
    if (!company) return null;
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    const serviceZips = Array.from(new Set(reports.map((report) => report.zip).filter(Boolean))).slice(0, 100);
    const plan = activePlan(company);

    return {
      userId: String(result.userId),
      companyId: String(result.membership.companyId),
      companyName: company.name,
      userName: user?.name,
      userEmail: user?.email,
      role: result.membership.role,
      plan,
      serviceZips,
      access: {
        inHomeTests: checkTierAccess(company, "verify_in_home_results"),
        filtration: checkTierAccess(company, "verify_filtration_installs"),
        leadPipeline: checkTierAccess(company, "lead_pipeline"),
      },
      messages: {
        growth: tierAccessMessage("verify_in_home_results"),
        pro: tierAccessMessage("lead_pipeline"),
      },
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, "sales_rep");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireRole(ctx, "sales_rep");
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const createInHomeTest = action({
  args: {
    customerName: v.string(),
    customerAddress: v.string(),
    customerZip: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    readings: v.object({
      chlorine_free: v.optional(v.number()),
      chlorine_total: v.optional(v.number()),
      tds: v.optional(v.number()),
      ph: v.optional(v.number()),
      hardness: v.optional(v.number()),
      iron: v.optional(v.number()),
      lead: v.optional(v.number()),
      nitrate: v.optional(v.number()),
    }),
    equipmentUsed: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    filtrationRecommendation: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ referralUrl: string; verificationId?: string; referralId?: string }> => {
    const context: any = await ctx.runQuery(api.dealerShared.getDealerContext);
    if (!context) throw new Error("Not authenticated or no company membership.");
    const allowed = await ctx.runMutation(api.dealerShared.assertTierAccess, { feature: "verify_in_home_results" });
    if (!allowed) throw new Error(tierAccessMessage("verify_in_home_results"));

    const referral = await ensureReferral({
      dealerId: context.userId,
      companyId: context.companyId,
      companyName: context.companyName,
      customerName: args.customerName,
      customerAddress: args.customerAddress,
      customerZip: args.customerZip,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      reportData: {
        verification: {
          type: "in_home_test",
          readings: args.readings,
          equipmentUsed: args.equipmentUsed,
          filtrationRecommendation: args.filtrationRecommendation,
        },
      },
    });

    const inserted = await supabaseTable<any[]>("dealer_verifications", {
      method: "POST",
      prefer: "return=representation",
      body: {
        dealer_id: context.userId,
        referral_id: referral.id || null,
        type: "in_home_test",
        customer_name: args.customerName,
        customer_address: args.customerAddress,
        customer_zip: args.customerZip,
        customer_email: args.customerEmail.toLowerCase(),
        customer_phone: args.customerPhone || null,
        readings: args.readings,
        equipment_used: args.equipmentUsed || null,
        photos: args.photos || [],
        filtration_system: args.filtrationRecommendation || null,
        notes: args.notes || null,
        created_at: new Date().toISOString(),
      },
    });

    await ctx.runMutation(api.dealerShared.recordSharedEvent, {
      feature: "verify_in_home_results",
      entityId: inserted?.[0]?.id || referral.id || "",
      metadata: JSON.stringify({ customerZip: args.customerZip, referralUrl: referral.referralUrl }),
    });

    await ctx.runAction(api.email.sendHomeTestReadyEmail, {
      to: args.customerEmail.toLowerCase(),
      referralUrl: referral.referralUrl,
    }).catch((error: unknown) => {
      console.warn("Home test email failed", error);
    });

    return { referralUrl: referral.referralUrl, verificationId: inserted?.[0]?.id, referralId: referral.id };
  },
});

export const saveReportInHomeTest = action({
  args: {
    reportId: v.id("reports"),
    readings: v.object({
      chlorine: v.optional(v.number()),
      hardness: v.optional(v.number()),
      tds: v.optional(v.number()),
      ph: v.optional(v.number()),
    }),
    waterScore: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ referralUrl: string; verificationId?: string; referralId?: string }> => {
    const context: any = await ctx.runQuery(api.dealerShared.getDealerContext);
    if (!context) throw new Error("Not authenticated or no company membership.");
    const allowed = await ctx.runMutation(api.dealerShared.assertTierAccess, { feature: "verify_in_home_results" });
    if (!allowed) throw new Error(tierAccessMessage("verify_in_home_results"));

    const report: any = await ctx.runQuery(api.reports.getReport, { reportId: args.reportId });
    if (!report) throw new Error("Report not found.");

    await ctx.runMutation(api.reports.updateInHomeReadings, {
      reportId: args.reportId,
      waterScore: args.waterScore,
      chlorine: args.readings.chlorine,
      hardness: args.readings.hardness,
      tds: args.readings.tds,
      ph: args.readings.ph,
    });

    const referral = await ensureReferral({
      dealerId: context.userId,
      companyId: context.companyId,
      companyName: context.companyName,
      customerName: report.customerName || "Homeowner",
      customerAddress: report.customerAddress || `${report.city}, ${report.state} ${report.zip}`,
      customerZip: report.customerZip || report.zip,
      customerEmail: report.customerEmail,
      customerPhone: report.customerPhone,
      reportData: {
        report: {
          id: String(args.reportId),
          utilityName: report.utilityName,
          pwsid: report.pwsid,
          city: report.city,
          state: report.state,
          zip: report.zip,
          waterScore: args.waterScore,
          scoreMode: "aqua_score_v1",
        },
        verification: {
          type: "in_home_test",
          readings: args.readings,
        },
      },
    });

    const inserted = await supabaseTable<any[]>("dealer_verifications", {
      method: "POST",
      prefer: "return=representation",
      body: {
        dealer_id: context.userId,
        referral_id: referral.id || null,
        type: "in_home_test",
        customer_name: report.customerName || "Homeowner",
        customer_address: report.customerAddress || null,
        customer_zip: report.customerZip || report.zip,
        customer_email: report.customerEmail?.toLowerCase() || null,
        customer_phone: report.customerPhone || null,
        readings: {
          chlorine_total: args.readings.chlorine,
          hardness: args.readings.hardness,
          tds: args.readings.tds,
          ph: args.readings.ph,
        },
        equipment_used: "AquaReport dealer field entry",
        photos: [],
        filtration_system: null,
        notes: `Saved from dealer report ${String(args.reportId)}`,
        created_at: new Date().toISOString(),
      },
    });

    await ctx.runMutation(api.dealerShared.recordSharedEvent, {
      feature: "verify_in_home_results",
      entityId: inserted?.[0]?.id || referral.id || "",
      metadata: JSON.stringify({ reportId: String(args.reportId), referralUrl: referral.referralUrl }),
    });

    return { referralUrl: referral.referralUrl, verificationId: inserted?.[0]?.id, referralId: referral.id };
  },
});

export const createFiltrationVerification = action({
  args: {
    customerName: v.string(),
    customerAddress: v.string(),
    customerZip: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    systemName: v.string(),
    systemType: v.union(v.literal("whole_home"), v.literal("point_of_use")),
    installDate: v.string(),
    photos: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ referralUrl: string; recordId?: string; referralId?: string }> => {
    const context: any = await ctx.runQuery(api.dealerShared.getDealerContext);
    if (!context) throw new Error("Not authenticated or no company membership.");
    const allowed = await ctx.runMutation(api.dealerShared.assertTierAccess, { feature: "verify_filtration_installs" });
    if (!allowed) throw new Error(tierAccessMessage("verify_filtration_installs"));

    const referral = await ensureReferral({
      dealerId: context.userId,
      companyId: context.companyId,
      companyName: context.companyName,
      customerName: args.customerName,
      customerAddress: args.customerAddress,
      customerZip: args.customerZip,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      reportData: {
        filtration: {
          systemName: args.systemName,
          systemType: args.systemType,
          installedAt: args.installDate,
        },
      },
    });

    const inserted = await supabaseTable<any[]>("filtration_records", {
      method: "POST",
      prefer: "return=representation",
      body: {
        consumer_id: null,
        dealer_id: context.userId,
        referral_id: referral.id || null,
        customer_name: args.customerName,
        customer_address: args.customerAddress,
        customer_zip: args.customerZip,
        system_name: args.systemName,
        system_type: args.systemType,
        filter_truth_score: SYSTEM_SCORE[args.systemName] || null,
        verification_status: "verified",
        verified_by: context.userId,
        installed_at: args.installDate || null,
        verified_at: new Date().toISOString(),
        photos: args.photos || [],
        notes: args.notes || null,
        created_at: new Date().toISOString(),
      },
    });

    await ctx.runMutation(api.dealerShared.recordSharedEvent, {
      feature: "verify_filtration_installs",
      entityId: inserted?.[0]?.id || referral.id || "",
      metadata: JSON.stringify({ customerZip: args.customerZip, systemName: args.systemName, referralUrl: referral.referralUrl }),
    });

    const email = args.customerEmail?.toLowerCase() || referral.customerEmail;
    if (email) {
      await ctx.runAction(api.email.sendFiltrationVerifiedEmail, {
        to: email,
        systemName: args.systemName,
      }).catch((error: unknown) => {
        console.warn("Filtration verification email failed", error);
      });
    }

    return { referralUrl: referral.referralUrl, recordId: inserted?.[0]?.id, referralId: referral.id };
  },
});

export const listConsumerLeads = action({
  args: {
    status: v.optional(v.string()),
    zip: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ serviceZips: string[]; available: any[]; mine: any[] }> => {
    const context: any = await ctx.runQuery(api.dealerShared.getDealerContext);
    if (!context) throw new Error("Not authenticated or no company membership.");
    const allowed = await ctx.runMutation(api.dealerShared.assertTierAccess, { feature: "lead_pipeline" });
    if (!allowed) throw new Error(tierAccessMessage("lead_pipeline"));

    const serviceZips = args.zip ? [args.zip] : context.serviceZips;
    if (!serviceZips.length) return { serviceZips: [], available: [], mine: [] };

    const zipFilter = serviceZips.map((zip: string) => `"${zip}"`).join(",");
    const status = args.status || "new";
    const available = await supabaseTable<any[]>(
      `consumer_leads?zip=in.(${encodeURIComponent(zipFilter)})&status=eq.${encodeURIComponent(status)}&select=*&order=created_at.desc&limit=100`,
    );
    const mine = await supabaseTable<any[]>(
      `consumer_leads?claimed_by=eq.${encodeURIComponent(context.userId)}&select=*&order=created_at.desc&limit=100`,
    );
    return { serviceZips, available: available || [], mine: mine || [] };
  },
});

export const claimConsumerLead = action({
  args: { leadId: v.string() },
  handler: async (ctx, args): Promise<{ ok: boolean; lead?: any }> => {
    const context: any = await ctx.runQuery(api.dealerShared.getDealerContext);
    if (!context) throw new Error("Not authenticated or no company membership.");
    const allowed = await ctx.runMutation(api.dealerShared.assertTierAccess, { feature: "lead_pipeline" });
    if (!allowed) throw new Error(tierAccessMessage("lead_pipeline"));

    const rows = await supabaseTable<any[]>(
      `consumer_leads?id=eq.${encodeURIComponent(args.leadId)}&status=eq.new`,
      {
        method: "PATCH",
        prefer: "return=representation",
        body: {
          status: "claimed",
          claimed_by: context.userId,
          claimed_at: new Date().toISOString(),
        },
      },
    );
    const lead = rows?.[0];
    if (!lead) throw new Error("This lead has already been claimed or is no longer available.");

    await ctx.runMutation(api.dealerShared.recordSharedEvent, {
      feature: "lead_pipeline",
      entityId: args.leadId,
      metadata: JSON.stringify({ zip: lead.zip }),
    });

    if (lead.consumer_email) {
      await ctx.runAction(api.email.sendConsumerLeadClaimedEmail, {
        to: lead.consumer_email,
      }).catch((error: unknown) => {
        console.warn("Lead claimed email failed", error);
      });
    }

    return { ok: true, lead };
  },
});

export const assertTierAccess = mutation({
  args: { feature: v.string() },
  handler: async (ctx, args) => {
    const { membership } = await requireRole(ctx, "sales_rep");
    await requireTierAccess(ctx, membership.companyId, args.feature);
    return true;
  },
});

export const recordSharedEvent = mutation({
  args: {
    feature: v.string(),
    entityId: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "sales_rep");
    await trackUsage(ctx, {
      companyId: membership.companyId,
      userId,
      event: `shared.${args.feature}`,
      metadata: args.metadata ? JSON.parse(args.metadata) : undefined,
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: `shared.${args.feature}`,
      entityType: "supabase",
      entityId: args.entityId,
      metadata: args.metadata ? JSON.parse(args.metadata) : undefined,
    });
  },
});
