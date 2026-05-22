import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalAction, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import {
  activePlan,
  audit,
  checkTierAccess,
  getMembership,
  isInFreeTrial,
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
    const freeTrial = await isInFreeTrial(ctx, company);

    return {
      userId: String(result.userId),
      companyId: String(result.membership.companyId),
      companyName: company.name,
      userName: user?.name,
      userEmail: user?.email,
      role: result.membership.role,
      plan,
      isFreeTrial: freeTrial,
      serviceZips,
      access: {
        inHomeTests: checkTierAccess(company, "verify_in_home_results", freeTrial),
        filtration: checkTierAccess(company, "verify_filtration_installs", freeTrial),
        leadPipeline: checkTierAccess(company, "lead_pipeline", freeTrial),
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

    // Sync score to consumer_scores in Supabase (Item 8)
    if (report.customerEmail) {
      try {
        const scorePayload = {
          consumer_email: report.customerEmail.toLowerCase(),
          zip: report.customerZip || report.zip,
          aqua_score: args.waterScore ?? 0,
          tier: (args.waterScore ?? 0) >= 80 ? "safe" : (args.waterScore ?? 0) >= 50 ? "moderate" : "at_risk",
          status: "verified",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Upsert by consumer_email
        await supabaseTable("consumer_scores?consumer_email=eq." + encodeURIComponent(report.customerEmail.toLowerCase()), {
          method: "DELETE",
        }).catch(() => {});
        await supabaseTable("consumer_scores", {
          method: "POST",
          prefer: "return=representation",
          body: scorePayload,
        });
        console.log(`Score synced to consumer_scores for ${report.customerEmail}`);
      } catch (err) {
        console.warn("Consumer score sync failed (non-fatal):", err);
      }
    }

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

// ============ Demo analytics & config functions for deployed frontend ============

export const getDemoAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member) return null;

    const sessions = await ctx.db
      .query("demoSessions")
      .withIndex("by_company", (q) => q.eq("companyId", member.companyId))
      .collect();
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("companyId", member.companyId))
      .collect();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q) => q.eq("companyId", member.companyId))
      .collect();

    const totalDemos = sessions.length;
    const sold = sessions.filter((s) => s.outcome === "sold").length;
    const followUp = sessions.filter((s) => s.outcome === "follow_up").length;
    const notInterested = sessions.filter((s) => s.outcome === "not_interested").length;
    const noShow = sessions.filter((s) => s.outcome === "no_show").length;

    return {
      totalDemos,
      totalReports: reports.length,
      totalLeads: leads.length,
      sold,
      followUp,
      notInterested,
      noShow,
      conversionRate: totalDemos > 0 ? Math.round((sold / totalDemos) * 100) : 0,
      avgDuration: totalDemos > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / totalDemos)
        : 0,
    };
  },
});

export const getEnhancedDemoAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member) return null;

    const sessions = await ctx.db
      .query("demoSessions")
      .withIndex("by_company", (q) => q.eq("companyId", member.companyId))
      .collect();
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_company", (q) => q.eq("companyId", member.companyId))
      .collect();

    // Best demo days
    const dayMap: Record<string, { count: number; sold: number }> = {};
    for (const s of sessions) {
      const day = new Date(s._creationTime).toLocaleDateString("en-US", { weekday: "long" });
      if (!dayMap[day]) dayMap[day] = { count: 0, sold: 0 };
      dayMap[day].count++;
      if (s.outcome === "sold") dayMap[day].sold++;
    }
    const bestDemoDays = Object.entries(dayMap)
      .map(([day, data]) => ({ day, ...data, closeRate: data.count > 0 ? Math.round((data.sold / data.count) * 100) : 0 }))
      .sort((a, b) => b.closeRate - a.closeRate);

    // Lead sources
    const sourceMap: Record<string, number> = {};
    for (const l of leads) {
      const src = l.source || "direct";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    }
    const leadSources = Object.entries(sourceMap).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count);

    // Rep leaderboard
    const repMap: Record<string, { name: string; demos: number; sold: number }> = {};
    for (const s of sessions) {
      const key = s.userId ? String(s.userId) : "unknown";
      if (!repMap[key]) repMap[key] = { name: key, demos: 0, sold: 0 };
      repMap[key].demos++;
      if (s.outcome === "sold") repMap[key].sold++;
    }

    // Resolve rep names
    const repLeaderboard = [];
    for (const [id, data] of Object.entries(repMap)) {
      let name = data.name !== id ? data.name : "Unknown Rep";
      if (id !== "unknown") {
        try {
          const user = await ctx.db.get(id as any) as any;
          if (user?.name) name = user.name;
          else if (user?.email) name = user.email;
        } catch { /* skip - invalid ID */ }
      }
      repLeaderboard.push({
        name,
        demoCount: data.demos,
        sold: data.sold,
        closeRate: data.demos > 0 ? Math.round((data.sold / data.demos) * 100) : 0,
      });
    }
    repLeaderboard.sort((a, b) => b.sold - a.sold);

    // Customer profiles
    const customers = sessions.map((s) => ({
      _id: s._id,
      customerName: s.customerName ?? "Unknown",
      waterScore: s.waterScore ?? null,
      outcome: s.outcome,
      durationSeconds: s.durationSeconds ?? 0,
      notes: s.notes ?? "",
      createdAt: s._creationTime,
    })).sort((a, b) => b.createdAt - a.createdAt);

    return {
      bestDemoDays,
      leadSources,
      repLeaderboard,
      customers,
    };
  },
});

export const saveDemoSession = mutation({
  args: {
    reportId: v.optional(v.id("reports")),
    outcome: v.string(),
    notes: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    customerName: v.optional(v.string()),
    waterScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member) throw new Error("Not a company member");

    // If we have a reportId, pull customer info from the report
    let customerName = args.customerName;
    let waterScore = args.waterScore;
    if (args.reportId) {
      const report = await ctx.db.get(args.reportId);
      if (report) {
        if (!customerName) customerName = report.customerName;
        if (waterScore === undefined) waterScore = report.waterScore;
      }
    }

    const sessionId = await ctx.db.insert("demoSessions", {
      companyId: member.companyId,
      reportId: args.reportId,
      userId,
      outcome: args.outcome,
      notes: args.notes,
      durationSeconds: args.durationSeconds,
      customerName,
      waterScore,
    });

    return sessionId;
  },
});

export const updateDemoConfig = mutation({
  args: {
    config: v.any(),
  },
  handler: async (ctx, { config }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member || (member.role !== "owner" && member.role !== "admin"))
      throw new Error("Not authorized");

    await ctx.db.patch(member.companyId, { demoConfig: config });
    return { success: true };
  },
});

export const updateDemoStepConfig = mutation({
  args: {
    order: v.optional(v.array(v.string())),
    disabled: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const member = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!member || (member.role !== "owner" && member.role !== "admin"))
      throw new Error("Not authorized");

    await ctx.db.patch(member.companyId, {
      demoStepConfig: {
        order: args.order,
        disabled: args.disabled,
      },
    });
    return { success: true };
  },
});

// ============ Auto-referral creation (called from saveReport via scheduler) ============

export const autoCreateReferralForReport = internalAction({
  args: {
    reportId: v.string(),
    companyId: v.string(),
    companyName: v.string(),
    dealerId: v.string(),
    customerName: v.optional(v.string()),
    customerAddress: v.optional(v.string()),
    customerZip: v.string(),
    customerEmail: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    utilityName: v.string(),
    city: v.string(),
    state: v.string(),
    zip: v.string(),
    waterScore: v.optional(v.number()),
  },
  handler: async (_ctx, args) => {
    if (!args.customerEmail && !args.customerAddress) {
      // Can't create a referral without at least an email or address
      return null;
    }

    try {
      const referral = await ensureReferral({
        dealerId: args.dealerId,
        companyId: args.companyId,
        companyName: args.companyName,
        customerName: args.customerName || "Homeowner",
        customerAddress: args.customerAddress || `${args.city}, ${args.state} ${args.zip}`,
        customerZip: args.customerZip || args.zip,
        customerEmail: args.customerEmail,
        customerPhone: args.customerPhone,
        reportData: {
          report: {
            id: args.reportId,
            utilityName: args.utilityName,
            city: args.city,
            state: args.state,
            zip: args.zip,
            waterScore: args.waterScore,
            scoreMode: "aqua_score_v1",
          },
        },
      });

      console.log(`Auto-referral created for report ${args.reportId}: ${referral.referralUrl} (isNew: ${referral.isNew})`);
      return { referralUrl: referral.referralUrl, isNew: referral.isNew };
    } catch (error) {
      console.warn("Auto-referral creation failed (non-fatal):", error);
      return null;
    }
  },
});
