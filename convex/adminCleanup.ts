import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Temporary admin mutation to clean up stale auth records for a given email
export const cleanupStaleAuth = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    
    // Find all authAccounts with this email
    const accounts = await ctx.db
      .query("authAccounts")
      .collect();
    
    const staleAccounts = accounts.filter(
      (a: any) => a.providerAccountId === email || (a as any).email === email
    );
    
    let cleaned = { accounts: 0, codes: 0, sessions: 0, refreshTokens: 0, users: 0 };
    
    for (const account of staleAccounts) {
      // Clean verification codes
      const codes = await ctx.db
        .query("authVerificationCodes")
        .filter(q => q.eq(q.field("accountId"), account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
        cleaned.codes++;
      }
      
      // Clean sessions for this user
      if (account.userId) {
        const sessions = await ctx.db
          .query("authSessions")
          .filter(q => q.eq(q.field("userId"), account.userId))
          .collect();
        for (const session of sessions) {
          const tokens = await ctx.db
            .query("authRefreshTokens")
            .filter(q => q.eq(q.field("sessionId"), session._id))
            .collect();
          for (const t of tokens) {
            await ctx.db.delete(t._id);
            cleaned.refreshTokens++;
          }
          await ctx.db.delete(session._id);
          cleaned.sessions++;
        }
        
        // Delete the user doc if it exists
        const user = await ctx.db.get(account.userId);
        if (user) {
          await ctx.db.delete(account.userId);
          cleaned.users++;
        }
      }
      
      await ctx.db.delete(account._id);
      cleaned.accounts++;
    }
    
    return cleaned;
  },
});
