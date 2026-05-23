import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getMembership, canRole } from "./security";

export const getModules = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    let modules = await ctx.db
      .query("trainingModules")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    if (args.category) modules = modules.filter((m) => m.category === args.category);
    return modules.sort((a, b) => a.order - b.order);
  },
});

export const getModule = query({
  args: { moduleId: v.id("trainingModules") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) return null;
    const mod = await ctx.db.get(args.moduleId);
    if (!mod || mod.companyId !== result.membership.companyId) return null;
    return mod;
  },
});

export const createModule = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    content: v.string(),
    videoUrl: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "manager")) throw new Error("Insufficient permissions");
    const existing = await ctx.db
      .query("trainingModules")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    return await ctx.db.insert("trainingModules", {
      companyId: result.membership.companyId,
      ...args,
      order: existing.length,
      createdBy: result.membership.userId,
    });
  },
});

export const updateModule = mutation({
  args: {
    moduleId: v.id("trainingModules"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "manager")) throw new Error("Insufficient permissions");
    const { moduleId, ...update } = args;
    const clean = Object.fromEntries(Object.entries(update).filter(([, v]) => v !== undefined));
    await ctx.db.patch(moduleId, clean);
  },
});

export const deleteModule = mutation({
  args: { moduleId: v.id("trainingModules") },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    if (!canRole(result.membership.role, "manager")) throw new Error("Insufficient permissions");
    await ctx.db.delete(args.moduleId);
  },
});

// ─── Progress Tracking ───────────────────────────────────────────

export const getMyProgress = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    return await ctx.db
      .query("trainingProgress")
      .withIndex("by_user", (q) =>
        q.eq("companyId", result.membership.companyId).eq("userId", result.membership.userId)
      )
      .collect();
  },
});

export const getTeamProgress = query({
  args: {},
  handler: async (ctx) => {
    const result = await getMembership(ctx);
    if (!result) return [];
    if (!canRole(result.membership.role, "manager")) return [];
    const members = await ctx.db
      .query("companyMembers")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    const modules = await ctx.db
      .query("trainingModules")
      .withIndex("by_company", (q) => q.eq("companyId", result.membership.companyId))
      .collect();
    const allProgress: any[] = [];
    for (const member of members) {
      const progress = await ctx.db
        .query("trainingProgress")
        .withIndex("by_user", (q) =>
          q.eq("companyId", result.membership.companyId).eq("userId", member.userId)
        )
        .collect();
      const completed = progress.filter((p) => p.status === "completed").length;
      allProgress.push({
        userId: member.userId,
        name: member.name || member.email || "Unknown",
        role: member.role,
        totalModules: modules.length,
        completed,
        percentage: modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0,
      });
    }
    return allProgress;
  },
});

export const updateProgress = mutation({
  args: {
    moduleId: v.id("trainingModules"),
    status: v.string(),
    score: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const result = await getMembership(ctx);
    if (!result) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("trainingProgress")
      .withIndex("by_user", (q) =>
        q.eq("companyId", result.membership.companyId).eq("userId", result.membership.userId)
      )
      .collect();
    const current = existing.find((p) => p.moduleId === args.moduleId);
    if (current) {
      await ctx.db.patch(current._id, {
        status: args.status,
        completedAt: args.status === "completed" ? Date.now() : undefined,
        score: args.score,
      });
    } else {
      await ctx.db.insert("trainingProgress", {
        companyId: result.membership.companyId,
        userId: result.membership.userId,
        moduleId: args.moduleId,
        status: args.status,
        completedAt: args.status === "completed" ? Date.now() : undefined,
        score: args.score,
      });
    }
  },
});
