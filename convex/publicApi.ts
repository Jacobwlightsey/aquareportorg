import { v } from "convex/values";
import { mutation } from "./_generated/server";

function periodMinute() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}`;
}

export const recordPublicRequest = mutation({
  args: {
    key: v.string(),
    event: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const period = periodMinute();
    const events = await ctx.db
      .query("usageEvents")
      .withIndex("by_public_period", (q) =>
        q.eq("publicKey", args.key).eq("period", period)
      )
      .collect();
    const count = events
      .filter((event) => event.event === args.event)
      .reduce((sum, event) => sum + event.quantity, 0);
    if (count >= args.limit) {
      return { allowed: false };
    }

    await ctx.db.insert("usageEvents", {
      event: args.event,
      quantity: 1,
      period,
      publicKey: args.key,
    });
    return { allowed: true };
  },
});
