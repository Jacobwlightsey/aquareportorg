import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// ─── Record a tracking event (internal only — called from HTTP handler) ──
export const recordEvent = internalMutation({
  args: {
    companyId: v.id("companies"),
    eventName: v.string(),
    eventCategory: v.string(),
    sessionId: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    referrer: v.optional(v.string()),
    emailHash: v.optional(v.string()),
    phoneHash: v.optional(v.string()),
    fbClickId: v.optional(v.string()),
    fbBrowserId: v.optional(v.string()),
    fbEventId: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    ipHash: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate by fbEventId if provided
    if (args.fbEventId) {
      const existing = await ctx.db
        .query("trackingEvents")
        .withIndex("by_fbEventId", (q) => q.eq("fbEventId", args.fbEventId!))
        .first();
      if (existing) return existing._id;
    }

    return await ctx.db.insert("trackingEvents", args);
  },
});

// ─── Query events for attribution dashboard ───────────────────────
export const getEventsByCompany = query({
  args: {
    companyId: v.id("companies"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { companyId, limit }) => {
    const events = await ctx.db
      .query("trackingEvents")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .take(limit || 100);
    return events;
  },
});

// ─── Get conversion funnel counts (indexed per event type) ────────
export const getConversionFunnel = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Count per event type using the by_event index (bounded to 10k each)
    const countByEvent = async (eventName: string) => {
      const events = await ctx.db
        .query("trackingEvents")
        .withIndex("by_event", (q) =>
          q.eq("companyId", companyId).eq("eventName", eventName),
        )
        .filter((q) => q.gte(q.field("_creationTime"), thirtyDaysAgo))
        .take(10000);
      return events.length;
    };

    const [pageViews, leads, demos, completed, closed] = await Promise.all([
      countByEvent("PageView"),
      countByEvent("Lead"),
      countByEvent("DemoStarted"),
      countByEvent("DemoCompleted"),
      countByEvent("DealClosed"),
    ]);

    return { pageViews, leads, demos, completed, closed };
  },
});

// ─── Get source breakdown ─────────────────────────────────────────
export const getSourceBreakdown = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    const events = await ctx.db
      .query("trackingEvents")
      .withIndex("by_event", (q) =>
        q.eq("companyId", companyId).eq("eventName", "Lead"),
      )
      .take(10000);

    const sources: Record<string, number> = {};
    for (const e of events) {
      const src = e.utmSource || "direct";
      sources[src] = (sources[src] || 0) + 1;
    }

    return Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  },
});

// ─── Data retention: delete old page views (90d) and conversions (365d) ──
export const cleanupOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ninetyDays = now - 90 * 24 * 60 * 60 * 1000;
    const oneYear = now - 365 * 24 * 60 * 60 * 1000;

    // Delete old page views (>90 days)
    const oldPageViews = await ctx.db
      .query("trackingEvents")
      .filter((q) =>
        q.and(
          q.eq(q.field("eventCategory"), "page_view"),
          q.lt(q.field("_creationTime"), ninetyDays),
        ),
      )
      .take(5000);

    for (const ev of oldPageViews) {
      await ctx.db.delete(ev._id);
    }

    // Delete old conversions (>365 days)
    const oldConversions = await ctx.db
      .query("trackingEvents")
      .filter((q) =>
        q.and(
          q.eq(q.field("eventCategory"), "conversion"),
          q.lt(q.field("_creationTime"), oneYear),
        ),
      )
      .take(5000);

    for (const ev of oldConversions) {
      await ctx.db.delete(ev._id);
    }

    return {
      deletedPageViews: oldPageViews.length,
      deletedConversions: oldConversions.length,
    };
  },
});
