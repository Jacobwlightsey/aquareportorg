import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { audit, canRole, getMembership, requireRole } from "./security";

declare const process: { env: Record<string, string | undefined> };

const providerValidator = v.union(
  v.literal("hubspot"),
  v.literal("gohighlevel"),
  v.literal("salesforce"),
  v.literal("zapier"),
  v.literal("twilio"),
  v.literal("mailchimp")
);

const providerEnv: Record<string, string[][]> = {
  hubspot: [["HUBSPOT_ACCESS_TOKEN"], ["HUBSPOT_CLIENT_ID", "HUBSPOT_CLIENT_SECRET"]],
  gohighlevel: [["GOHIGHLEVEL_API_KEY"], ["GOHIGHLEVEL_CLIENT_ID", "GOHIGHLEVEL_CLIENT_SECRET"]],
  salesforce: [["SALESFORCE_ACCESS_TOKEN"], ["SALESFORCE_CLIENT_ID", "SALESFORCE_CLIENT_SECRET"]],
  mailchimp: [["MAILCHIMP_API_KEY"], ["MAILCHIMP_CLIENT_ID", "MAILCHIMP_CLIENT_SECRET"]],
  twilio: [["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]],
  zapier: [],
};

function configuredEnvOption(provider: string) {
  const options = providerEnv[provider] ?? [];
  if (options.length === 0) return { ok: true, missing: [] as string[] };
  for (const option of options) {
    const missing = option.filter((name) => !process.env[name]);
    if (missing.length === 0) return { ok: true, missing: [] as string[] };
  }
  return { ok: false, missing: [...new Set(options.flat())] };
}

export const listConnections = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result || !canRole(result.membership.role, "manager")) return [];
    const { membership } = result;
    return await ctx.db
      .query("integrationConnections")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();
  },
});

export const upsertConnection = mutation({
  args: {
    provider: providerValidator,
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("error")),
    authType: v.union(v.literal("oauth"), v.literal("api_key"), v.literal("webhook")),
    displayName: v.optional(v.string()),
    encryptedConfig: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    webhookUrl: v.optional(v.string()),
    syncLeadEvents: v.optional(v.boolean()),
    syncReportEvents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "admin");
    const envStatus = configuredEnvOption(args.provider);
    const hasManualSecret = Boolean(args.apiKey?.trim() || args.webhookUrl?.trim() || args.encryptedConfig?.trim());
    if (!envStatus.ok && !hasManualSecret) {
      throw new Error(
        `${args.displayName || args.provider} is missing provider credentials. Configure one of: ${envStatus.missing.join(", ")}`
      );
    }

    const existing = await ctx.db
      .query("integrationConnections")
      .withIndex("by_provider", (q) =>
        q.eq("companyId", membership.companyId).eq("provider", args.provider)
      )
      .first();

    const safeConfig = {
      source: hasManualSecret ? "manual" : "env",
      webhookUrl: args.webhookUrl?.trim() || undefined,
      apiKeyLast4: args.apiKey ? args.apiKey.slice(-4) : undefined,
      configuredAt: Date.now(),
    };

    const update = {
      provider: args.provider,
      status: args.status,
      authType: args.authType,
      displayName: args.displayName,
      encryptedConfig: args.encryptedConfig || JSON.stringify(safeConfig),
      syncLeadEvents: args.syncLeadEvents ?? true,
      syncReportEvents: args.syncReportEvents ?? true,
      lastError: undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, update);
      await audit(ctx, {
        companyId: membership.companyId,
        actorId: userId,
        action: "integration.updated",
        entityType: "integrationConnection",
        entityId: String(existing._id),
        metadata: { provider: args.provider, source: safeConfig.source },
      });
      return existing._id;
    }

    const connectionId = await ctx.db.insert("integrationConnections", {
      companyId: membership.companyId,
      ...update,
      createdBy: userId,
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "integration.connected",
      entityType: "integrationConnection",
      entityId: String(connectionId),
      metadata: { provider: args.provider, source: safeConfig.source },
    });
    return connectionId;
  },
});

export const disconnectConnection = mutation({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "admin");
    const existing = await ctx.db
      .query("integrationConnections")
      .withIndex("by_provider", (q) =>
        q.eq("companyId", membership.companyId).eq("provider", args.provider)
      )
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      status: "paused",
      lastError: undefined,
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "integration.disconnected",
      entityType: "integrationConnection",
      entityId: String(existing._id),
      metadata: { provider: args.provider },
    });
    return existing._id;
  },
});

export const enqueueIntegrationEvent = mutation({
  args: {
    companyId: v.id("companies"),
    provider: v.string(),
    connectionId: v.optional(v.id("integrationConnections")),
    eventType: v.string(),
    payload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("integrationEvents", {
      companyId: args.companyId,
      provider: args.provider,
      connectionId: args.connectionId,
      eventType: args.eventType,
      status: "queued",
      attempts: 0,
      payload: args.payload,
    });
  },
});

export const recordIntegrationResult = mutation({
  args: {
    eventId: v.id("integrationEvents"),
    status: v.string(),
    response: v.optional(v.string()),
    nextRetryAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) return;
    await ctx.db.patch(args.eventId, {
      status: args.status,
      response: args.response,
      nextRetryAt: args.nextRetryAt,
      attempts: event.attempts + 1,
    });
  },
});

export const syncEvent = action({
  args: { eventId: v.id("integrationEvents") },
  handler: async (ctx, args): Promise<{ status: string }> => {
    const event: any = await ctx.runQuery(api.integrations.getEventForSync, {
      eventId: args.eventId,
    });
    if (!event) return { status: "missing" };

    // Native provider adapters are represented by provider-specific dispatch points.
    // Credentials live in Convex env/provider config and event payloads are logged for replay.
    await ctx.runMutation(api.integrations.recordIntegrationResult, {
      eventId: args.eventId,
      status: "ready_for_provider_adapter",
      response: `Queued ${event.eventType} for ${event.provider}`,
    });
    return { status: "ready_for_provider_adapter" };
  },
});

export const getEventForSync = query({
  args: { eventId: v.id("integrationEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});
