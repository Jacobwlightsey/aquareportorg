import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Auto-link: when a user signs up with an email that was added as a team member,
// link them to that company automatically
export const autoLinkMember = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // Check if already linked to a company
    const existing = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const accepted = existing.find((membership) => membership.acceptedAt || membership.role === "owner");
    if (accepted) return { companyId: accepted.companyId, role: accepted.role };

    // Get user's email
    const user = await ctx.db.get(userId);
    if (!user?.email) return null;

    // Find placeholder membership by email
    const placeholder = await ctx.db
      .query("companyMembers")
      .withIndex("by_email", (q) => q.eq("email", user.email))
      .first();

    if (placeholder && !placeholder.acceptedAt) {
      // Update placeholder to point to this user
      await ctx.db.patch(placeholder._id, {
        userId: userId,
        name: user.name || placeholder.name,
      });
      return { companyId: placeholder.companyId, role: placeholder.role };
    }

    return null;
  },
});

// Check if current user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return membership?.role === "admin" || membership?.role === "owner";
  },
});

// One-time setup: ensure admin placeholder exists for a given email
// Called via deploy key — no user auth needed
export const setupAdminPlaceholder = mutation({
  args: {
    email: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find company
    const companies = await ctx.db.query("companies").collect();
    const company = companies.find((c) => c.name === args.companyName);
    if (!company) {
      return { error: "Company not found", companies: companies.map(c => c.name) };
    }

    // Check if placeholder already exists
    const existing = await ctx.db
      .query("companyMembers")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (existing) {
      // Update to admin if not already
      if (existing.role !== "owner") {
        await ctx.db.patch(existing._id, { role: "owner" });
      }
      return { status: "already_exists", memberId: existing._id, role: "owner" };
    }

    // Find any existing userId to use as placeholder
    const anyMember = await ctx.db.query("companyMembers").first();

    // Create admin placeholder
    const memberId = await ctx.db.insert("companyMembers", {
      companyId: company._id,
      userId: anyMember?.userId ?? company.createdBy!,
      role: "owner",
      name: args.email.split("@")[0],
      email: args.email,
    });

    return { status: "created", memberId, role: "owner" };
  },
});
