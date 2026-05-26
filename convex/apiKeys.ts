import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership } from "./security";

// ─── Generate a new API key ──────────────────────────────────────
export const generateApiKey = mutation({
  args: {
    name: v.string(),
    scopes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { membership } = result;

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Only owners and admins can create API keys");
    }

    // Generate a random API key: aq_live_ + 32 random hex chars
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const rawKey =
      "aq_live_" +
      Array.from(randomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

    // Store only the SHA-256 hash
    const keyHashBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(rawKey),
    );
    const keyHash = Array.from(new Uint8Array(keyHashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.insert("apiKeys", {
      companyId: membership.companyId,
      name: args.name,
      keyHash,
      scopes: args.scopes,
      createdBy: membership.userId,
    });

    // Return the raw key — this is the ONLY time it's visible
    return { key: rawKey };
  },
});

// ─── List API keys for the current company ───────────────────────
export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    const { membership } = result;

    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_company", (q) => q.eq("companyId", membership.companyId))
      .collect();

    // Never return the hash — just metadata
    return keys.map((k) => ({
      _id: k._id,
      name: k.name,
      scopes: k.scopes,
      createdBy: k.createdBy,
      lastUsedAt: k.lastUsedAt,
      revokedAt: k.revokedAt,
      _creationTime: k._creationTime,
    }));
  },
});

// ─── Revoke an API key ───────────────────────────────────────────
export const revokeApiKey = mutation({
  args: { keyId: v.id("apiKeys") },
  handler: async (ctx, { keyId }) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const { membership } = result;

    if (membership.role !== "owner" && membership.role !== "admin") {
      throw new Error("Only owners and admins can revoke API keys");
    }

    const key = await ctx.db.get(keyId);
    if (!key || key.companyId !== membership.companyId) {
      throw new Error("API key not found");
    }

    await ctx.db.patch(keyId, { revokedAt: Date.now() });
  },
});
