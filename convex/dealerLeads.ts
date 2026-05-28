/**
 * Dealer Lead Capture — B2B marketing funnel for AquaReport.
 *
 * Public mutations for form submissions (no auth).
 * Admin queries/mutations for managing leads and tracking links.
 */
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Helper: check platform admin ──────────────────────────────

async function requirePlatformAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  const admin = await ctx.db
    .query("platformAdmins")
    .withIndex("by_email", (q: any) => q.eq("email", user.email))
    .first();
  if (!admin) throw new Error("Platform admin access required");
  return userId;
}

// ─── Tracking Links ────────────────────────────────────────────

/** Create a new tracking link (admin only). */
export const createTrackingLink = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    // Check slug uniqueness
    const existing = await ctx.db
      .query("trackingLinks")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("A tracking link with this slug already exists");

    return await ctx.db.insert("trackingLinks", {
      ...args,
      isActive: true,
      clickCount: 0,
      leadCount: 0,
      createdAt: Date.now(),
    });
  },
});

/** Get all tracking links (admin only). */
export const getTrackingLinks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user) return [];
    const admin = await ctx.db
      .query("platformAdmins")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();
    if (!admin) return [];

    return await ctx.db
      .query("trackingLinks")
      .order("desc")
      .collect();
  },
});

/** Toggle tracking link active state (admin only). */
export const toggleTrackingLink = mutation({
  args: { linkId: v.id("trackingLinks"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.patch(args.linkId, { isActive: args.isActive });
  },
});

/** Delete tracking link (admin only). */
export const deleteTrackingLink = mutation({
  args: { linkId: v.id("trackingLinks") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.delete(args.linkId);
  },
});

/** Record a click on a tracking link (public, no auth). */
export const recordClick = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const link = await ctx.db
      .query("trackingLinks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (link) {
      await ctx.db.patch(link._id, { clickCount: link.clickCount + 1 });
    }
  },
});

/** Resolve a tracking link by slug (public query for landing page). */
export const resolveTrackingLink = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const link = await ctx.db
      .query("trackingLinks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (!link || !link.isActive) return null;
    return {
      _id: link._id,
      name: link.name,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmContent: link.utmContent,
      utmTerm: link.utmTerm,
    };
  },
});

// ─── Dealer Leads ──────────────────────────────────────────────

/** Submit a dealer lead from the public landing page (no auth). */
export const submitDealerLead = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    companyName: v.optional(v.string()),
    companySize: v.optional(v.string()),
    message: v.optional(v.string()),
    // Tracking
    trackingSlug: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    referrer: v.optional(v.string()),
    landingPage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Resolve tracking link if slug provided
    let trackingLinkId = undefined;
    if (args.trackingSlug) {
      const link = await ctx.db
        .query("trackingLinks")
        .withIndex("by_slug", (q) => q.eq("slug", args.trackingSlug))
        .first();
      if (link) {
        trackingLinkId = link._id;
        // Increment lead count
        await ctx.db.patch(link._id, { leadCount: link.leadCount + 1 });
      }
    }

    const leadId = await ctx.db.insert("dealerLeads", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      companyName: args.companyName,
      companySize: args.companySize,
      message: args.message,
      status: "new",
      trackingLinkId,
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmContent: args.utmContent,
      utmTerm: args.utmTerm,
      referrer: args.referrer,
      landingPage: args.landingPage,
    });

    return leadId;
  },
});

/** Get all dealer leads (admin only). */
export const getDealerLeads = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (!user) return [];
    const admin = await ctx.db
      .query("platformAdmins")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();
    if (!admin) return [];

    const leads = await ctx.db.query("dealerLeads").order("desc").collect();

    // Enrich with tracking link names
    const linkIds = [...new Set(leads.filter((l) => l.trackingLinkId).map((l) => l.trackingLinkId!))];
    const links = await Promise.all(linkIds.map((id) => ctx.db.get(id)));
    const linkMap = new Map(links.filter(Boolean).map((l) => [l!._id, l!.name]));

    return leads.map((lead) => ({
      ...lead,
      trackingLinkName: lead.trackingLinkId ? linkMap.get(lead.trackingLinkId) || null : null,
    }));
  },
});

/** Update dealer lead status (admin only). */
export const updateDealerLead = mutation({
  args: {
    leadId: v.id("dealerLeads"),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    demoScheduledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const update: Record<string, unknown> = {};
    if (args.status) {
      update.status = args.status;
      if (args.status === "contacted") update.contactedAt = Date.now();
      if (args.status === "demo_scheduled" && args.demoScheduledAt) update.demoScheduledAt = args.demoScheduledAt;
      if (args.status === "converted") update.convertedAt = Date.now();
    }
    if (args.notes !== undefined) update.notes = args.notes;
    await ctx.db.patch(args.leadId, update);
  },
});

/** Delete a dealer lead (admin only). */
export const deleteDealerLead = mutation({
  args: { leadId: v.id("dealerLeads") },
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    await ctx.db.delete(args.leadId);
  },
});
