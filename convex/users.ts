import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation } from "./_generated/server";

export const deleteAccount = mutation({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Delete auth accounts
    const authAccounts = await ctx.db
      .query("authAccounts")
      .filter(q => q.eq(q.field("userId"), userId))
      .collect();
    for (const account of authAccounts) {
      // Delete verification codes linked to this account
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

    // Delete the user document
    await ctx.db.delete(userId);

    return { success: true };
  },
});
