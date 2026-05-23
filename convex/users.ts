import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

export const deleteAccount = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Delete auth accounts and their verification codes
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    for (const account of authAccounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .filter(q => q.eq(q.field("accountId"), account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
    }

    // Delete auth sessions and their refresh tokens
    const authSessions = await ctx.db
      .query("authSessions")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    for (const session of authSessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .filter(q => q.eq(q.field("sessionId"), session._id))
        .collect();
      for (const token of refreshTokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // Check company ownership — block deletion if sole owner with other members
    const memberships = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();
    for (const membership of memberships) {
      if (membership.role === "owner") {
        const companyMembers = await ctx.db
          .query("companyMembers")
          .withIndex("by_company", (q: any) => q.eq("companyId", membership.companyId))
          .collect();
        const otherMembers = companyMembers.filter((m) => String(m.userId) !== String(userId));
        if (otherMembers.length > 0) {
          const otherOwners = otherMembers.filter((m) => m.role === "owner");
          if (otherOwners.length === 0) {
            throw new Error(
              "You are the only owner of your company. Transfer ownership to another team member before deleting your account."
            );
          }
        }
      }
    }

    // Delete company memberships (keep the company for other members)
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete the user document
    await ctx.db.delete(userId);

    return { success: true };
  },
});
