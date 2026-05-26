import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

// ─── Record consent ──────────────────────────────────────────────
export const recordConsent = mutation({
  args: {
    companyId: v.id("companies"),
    sessionId: v.string(),
    consentGiven: v.boolean(),
    consentScope: v.string(),
    ipHash: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for existing consent for this session
    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_session", (q) =>
        q.eq("companyId", args.companyId).eq("sessionId", args.sessionId),
      )
      .first();

    if (existing) {
      // Update existing consent
      await ctx.db.patch(existing._id, {
        consentGiven: args.consentGiven,
        consentScope: args.consentScope,
        ...(args.consentGiven === false ? { revokedAt: Date.now() } : {}),
      });
      return existing._id;
    }

    return await ctx.db.insert("consentRecords", args);
  },
});

// ─── Check consent status ─────────────────────────────────────────
export const checkConsent = query({
  args: {
    companyId: v.id("companies"),
    sessionId: v.string(),
  },
  handler: async (ctx, { companyId, sessionId }) => {
    const record = await ctx.db
      .query("consentRecords")
      .withIndex("by_session", (q) =>
        q.eq("companyId", companyId).eq("sessionId", sessionId),
      )
      .first();

    if (!record) return { hasConsent: false, consentGiven: false };
    return {
      hasConsent: true,
      consentGiven: record.consentGiven && !record.revokedAt,
      scope: record.consentScope,
    };
  },
});

// ─── Data retention: delete old consent records (2 years) ─────────
export const cleanupOldConsent = internalMutation({
  args: {},
  handler: async (ctx) => {
    const twoYearsAgo = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;

    const old = await ctx.db
      .query("consentRecords")
      .filter((q) => q.lt(q.field("_creationTime"), twoYearsAgo))
      .take(5000);

    for (const r of old) {
      await ctx.db.delete(r._id);
    }

    return { deleted: old.length };
  },
});
