import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { audit, requireRole } from "./security";

declare const process: { env: Record<string, string | undefined> };

// ============ QUERIES ============

export const getSubscription = query({
  args: {},
  handler: async (ctx): Promise<{
    plan: string;
    status: string;
    periodEnd?: number;
    customerId?: string;
  } | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const membership = await ctx.db
      .query("companyMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!membership) return null;

    const company = await ctx.db.get(membership.companyId);
    if (!company) return null;

    return {
      plan: company.stripePlan || "free",
      status: company.stripeStatus || "none",
      periodEnd: company.stripePeriodEnd,
      customerId: company.stripeCustomerId,
    };
  },
});

// ============ ACTIONS (call Stripe API) ============

export const createCheckoutSession = action({
  args: {
    priceId: v.string(),
    plan: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const user: any = await ctx.runQuery(api.auth.currentUser);
    if (!user) throw new Error("Not authenticated");

    const stripeKey: string | undefined = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe is not configured yet. Add your Stripe keys in the Convex dashboard.");

    const siteUrl: string = process.env.SITE_URL || process.env.CONVEX_SITE_URL || "https://aquareport.org";

    // Create checkout session via Stripe API
    const params: URLSearchParams = new URLSearchParams({
      "payment_method_types[0]": "card",
      mode: "subscription",
      "line_items[0][price]": args.priceId,
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancel`,
      client_reference_id: user._id,
      "metadata[plan]": args.plan,
    });

    if (user.email) {
      params.set("customer_email", user.email);
    }

    const resp: Response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session: any = await resp.json();
    if (!resp.ok) throw new Error(session.error?.message || "Failed to create checkout session");

    return { url: session.url };
  },
});

export const createPortalSession = action({
  args: {},
  handler: async (ctx): Promise<{ url: string }> => {
    const user: any = await ctx.runQuery(api.auth.currentUser);
    if (!user) throw new Error("Not authenticated");

    const stripeKey: string | undefined = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) throw new Error("Stripe is not configured yet.");

    // Get company's Stripe customer ID
    const membership: any = await ctx.runQuery(api.stripe.getSubscription);
    if (!membership?.customerId) throw new Error("No Stripe customer found");

    const siteUrl: string = process.env.SITE_URL || process.env.CONVEX_SITE_URL || "https://aquareport.org";

    const params: URLSearchParams = new URLSearchParams({
      customer: membership.customerId,
      return_url: `${siteUrl}/company`,
    });

    const resp: Response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session: any = await resp.json();
    if (!resp.ok) throw new Error(session.error?.message || "Failed to create portal session");

    return { url: session.url };
  },
});

export const applyPromoCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, membership } = await requireRole(ctx, "owner");
    const code = args.code.trim().toLowerCase();
    if (code !== "testtest") {
      throw new Error("Invalid promo code");
    }

    const periodEnd = Date.now() + 365 * 24 * 60 * 60 * 1000;
    await ctx.db.patch(membership.companyId, {
      stripePlan: "pro",
      stripeStatus: "active",
      stripePeriodEnd: periodEnd,
      reportLimitOverride: 150,
    });
    await audit(ctx, {
      companyId: membership.companyId,
      actorId: userId,
      action: "billing.promo_applied",
      entityType: "company",
      entityId: String(membership.companyId),
      metadata: { code, plan: "pro", periodEnd },
    });
    return { plan: "pro", status: "active", periodEnd };
  },
});

// ============ MUTATIONS (called by webhook or admin) ============

export const updateSubscription = mutation({
  args: {
    companyId: v.id("companies"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePlan: v.optional(v.string()),
    stripeStatus: v.optional(v.string()),
    stripePeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { companyId, ...update } = args;
    await ctx.db.patch(companyId, update);
  },
});

// Called from webhook — find company by Stripe customer ID or user email and update
export const handleWebhookUpdate = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    stripePlan: v.optional(v.string()),
    stripeStatus: v.optional(v.string()),
    stripePeriodEnd: v.optional(v.number()),
    userEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let company = await ctx.db
      .query("companies")
      .withIndex("by_stripeCustomerId", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();

    // If not found by customer ID, try to find by user email
    if (!company && args.userEmail) {
      const member = await ctx.db
        .query("companyMembers")
        .withIndex("by_email", (q) => q.eq("email", args.userEmail))
        .first();
      if (member) {
        company = await ctx.db.get(member.companyId);
      }
    }

    if (!company) return;

    const update: Record<string, any> = {
      stripeCustomerId: args.stripeCustomerId,
    };
    if (args.stripeSubscriptionId) update.stripeSubscriptionId = args.stripeSubscriptionId;
    if (args.stripePlan) update.stripePlan = args.stripePlan;
    if (args.stripeStatus) update.stripeStatus = args.stripeStatus;
    if (args.stripePeriodEnd) update.stripePeriodEnd = args.stripePeriodEnd;

    await ctx.db.patch(company._id, update);
    await audit(ctx, {
      companyId: company._id,
      action: "billing.subscription_updated",
      entityType: "company",
      entityId: String(company._id),
      metadata: update,
    });
  },
});
