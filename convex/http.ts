import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";

declare const process: { env: Record<string, string | undefined> };

const http = httpRouter();
auth.addHttpRoutes(http);

function json(data: unknown, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature, X-AquaReport-Secret",
    },
  });
}

function siteOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin");
  if (
    requestOrigin === "https://aquareport.org" ||
    requestOrigin === "https://www.aquareport.org" ||
    requestOrigin === "https://myaquareport.com" ||
    requestOrigin === "https://www.myaquareport.com" ||
    requestOrigin === "https://myaquareport.pages.dev" ||
    /^https:\/\/[a-z0-9-]+\.myaquareport\.pages\.dev$/.test(requestOrigin || "")
  ) {
    return requestOrigin || "*";
  }
  const configured = process.env.SITE_URL;
  if (configured) return configured;
  return requestOrigin || "*";
}

function unwrapReportRow(row: any) {
  if (!row || typeof row !== "object") return row;
  if (row.utility_info?.utility_name) return row;
  if (row.aquareport_build_report_from_legacy?.utility_info) return row.aquareport_build_report_from_legacy;
  if (row.zip_water_report?.utility_info) return row.zip_water_report;
  const values = Object.values(row);
  const jsonValue = values.find((value: any) => value?.utility_info?.utility_name);
  return jsonValue || row;
}

function normalizeReportData(data: any) {
  if (Array.isArray(data)) return data.map(unwrapReportRow);
  return unwrapReportRow(data);
}

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "anonymous"
  );
}

async function hmacSha256(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeSignature(body: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );
  if (!parts.t || !parts.v1) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const expected = await hmacSha256(secret, `${parts.t}.${body}`);
  return expected === parts.v1;
}

function updatedResultsPriceId() {
  return process.env.UPDATED_RESULTS_PRICE_ID || "price_1TYxltRjbFWooo6zB5olLz6x";
}

function consumerRescoreUrl() {
  return process.env.CONSUMER_RESCORE_URL || "https://canny-platypus-506.convex.site/api/rescore";
}

function consumerSiteUrl() {
  return process.env.MYAQUAREPORT_URL || "https://myaquareport.com";
}

function supabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase is not configured");
  return { supabaseUrl, supabaseKey };
}

async function supabaseRest<T>(
  path: string,
  options: { method?: string; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const { supabaseUrl, supabaseKey } = supabaseConfig();
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Supabase ${options.method || "GET"} ${path} failed (${res.status}): ${text || res.statusText}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

async function stripeJson(path: string) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("Stripe secret key missing");
  const res = await fetch(`https://api.stripe.com/v1/${path.replace(/^\//, "")}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}

function subscriptionHasUpdatedResults(subscription: any) {
  const priceId = updatedResultsPriceId();
  const items = subscription?.items?.data || [];
  return items.some((item: any) => item?.price?.id === priceId) || subscription?.metadata?.priceId === priceId;
}

async function customerEmail(customer: any) {
  if (!customer) return undefined;
  if (typeof customer === "object") return customer.email || undefined;
  const fetched = await stripeJson(`customers/${encodeURIComponent(customer)}`);
  return fetched.email || undefined;
}

async function resolveConsumer(email?: string, fallbackZip?: string) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return { consumerId: null, email: null, zip: fallbackZip || null };

  const scores = await supabaseRest<any[]>(
    `consumer_scores?consumer_email=eq.${encodeURIComponent(normalized)}&select=id,consumer_email,zip&order=updated_at.desc&limit=1`,
  );
  if (scores?.[0]?.zip) {
    return {
      consumerId: scores[0].id,
      email: scores[0].consumer_email || normalized,
      zip: scores[0].zip,
    };
  }

  const leads = await supabaseRest<any[]>(
    `consumer_leads?consumer_email=eq.${encodeURIComponent(normalized)}&select=id,consumer_email,zip&order=created_at.desc&limit=1`,
  );
  return {
    consumerId: null,
    email: leads?.[0]?.consumer_email || normalized,
    zip: leads?.[0]?.zip || fallbackZip || null,
  };
}

async function upsertConsumerSubscription(subscription: any, statusOverride?: string) {
  if (!subscriptionHasUpdatedResults(subscription)) return { skipped: true, reason: "not_updated_results_price" };
  const subscriptionId = subscription.id;
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  const email = await customerEmail(subscription.customer);
  const consumer = await resolveConsumer(email, subscription.metadata?.zip);
  if (!consumer.zip) return { skipped: true, reason: "no_consumer_zip", subscriptionId };

  const status = statusOverride || subscription.status || "active";
  const existing = await supabaseRest<any[]>(
    `consumer_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=id&limit=1`,
  );
  const body = {
    consumer_id: consumer.consumerId,
    consumer_email: consumer.email,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: stripeCustomerId || null,
    status,
    zip: consumer.zip,
    canceled_at: status === "canceled" ? new Date().toISOString() : null,
  };

  if (existing?.[0]?.id) {
    await supabaseRest(
      `consumer_subscriptions?id=eq.${encodeURIComponent(existing[0].id)}`,
      { method: "PATCH", body, prefer: "return=minimal" },
    );
  } else {
    await supabaseRest("consumer_subscriptions", {
      method: "POST",
      body: { ...body, created_at: new Date().toISOString() },
      prefer: "return=minimal",
    });
  }
  return { ok: true, subscriptionId, status, zip: consumer.zip };
}

async function updateConsumerSubscriptionStatus(subscriptionId: string, status: string) {
  await supabaseRest(
    `consumer_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
    {
      method: "PATCH",
      body: {
        status,
        ...(status === "canceled" ? { canceled_at: new Date().toISOString() } : {}),
      },
      prefer: "return=minimal",
    },
  );
}

async function triggerZipRescore(ctx: any, zip: string) {
  const rows = await supabaseRest<any[]>(
    `consumer_subscriptions?zip=eq.${encodeURIComponent(zip)}&status=eq.active&select=id,consumer_id,consumer_email,zip`,
  );
  const results = [];
  for (const row of rows || []) {
    if (!row.consumer_id) {
      results.push({ subscriptionId: row.id, skipped: "missing_consumer_id" });
      continue;
    }
    const response = await fetch(consumerRescoreUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consumerId: row.consumer_id, zip }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      results.push({ subscriptionId: row.id, error: data?.error || response.statusText });
      continue;
    }
    if (data.changed === true && typeof data.oldScore === "number" && typeof data.newScore === "number") {
      await supabaseRest("score_history", {
        method: "POST",
        body: {
          consumer_id: row.consumer_id,
          zip,
          old_score: data.oldScore,
          new_score: data.newScore,
          reason: "water_data_update",
        },
        prefer: "return=minimal",
      }).catch(() => null);
      if (row.consumer_email) {
        await ctx.runAction(api.email.sendScoreChangedEmail, {
          to: row.consumer_email,
          oldScore: data.oldScore,
          newScore: data.newScore,
        }).catch((error: unknown) => {
          console.warn("Score changed email failed", error);
        });
      }
    }
    results.push({ subscriptionId: row.id, ...data });
  }
  return results;
}

http.route({
  path: "/api/zip-report",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = siteOrigin(request);
    const rate = await ctx.runMutation(api.publicApi.recordPublicRequest, {
      key: clientKey(request),
      event: "zip-report.request",
      limit: 30,
    });
    if (!rate.allowed) return json({ error: "Too many requests" }, 429, origin);

    const { zip } = await request.json().catch(() => ({ zip: "" }));
    if (!zip || !/^\d{5}$/.test(zip)) {
      return json({ error: "Invalid ZIP code" }, 400, origin);
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return json({ error: "Water data service is not configured" }, 503, origin);
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/zip_water_report`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_zip: zip }),
    });

    const data = await res.json();
    return json(normalizeReportData(data), res.ok ? 200 : res.status, origin);
  }),
});

http.route({
  path: "/api/zip-report",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": siteOrigin(request),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/api/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) return new Response("Stripe webhook secret missing", { status: 503 });

    const verified = await verifyStripeSignature(
      body,
      request.headers.get("stripe-signature"),
      webhookSecret
    );
    if (!verified) return new Response("Invalid signature", { status: 400 });

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const type = event.type;
    const data = event.data?.object;

    if (type === "customer.subscription.created") {
      await upsertConsumerSubscription(data, "active").catch((error: unknown) => {
        console.warn("Updated Results subscription create skipped/failed", error);
      });
    }

    if (type === "checkout.session.completed") {
      const plan = data.metadata?.plan || "starter";
      const customerId = data.customer;
      const subscriptionId = data.subscription;

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey && subscriptionId) {
        const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        const sub = await subResp.json();

        await ctx.runMutation(api.stripe.handleWebhookUpdate, {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          stripePlan: plan,
          stripeStatus: sub.status || "active",
          stripePeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : undefined,
          userEmail: data.customer_email || data.customer_details?.email,
        });

        const email = data.customer_email || data.customer_details?.email;
        if (email) {
          await ctx.runAction(api.email.sendPurchaseConfirmation, {
            to: email,
            plan,
          });
        }

        await upsertConsumerSubscription({ ...sub, customer: customerId }, sub.status || "active").catch((error: unknown) => {
          console.warn("Updated Results checkout subscription skipped/failed", error);
        });
      }
    }

    if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
      if (subscriptionHasUpdatedResults(data)) {
        await upsertConsumerSubscription(
          data,
          type === "customer.subscription.deleted" ? "canceled" : data.status,
        ).catch((error: unknown) => {
          console.warn("Updated Results subscription update skipped/failed", error);
        });
      }

      await ctx.runMutation(api.stripe.handleWebhookUpdate, {
        stripeCustomerId: data.customer,
        stripeSubscriptionId: data.id,
        stripeStatus: data.status,
        stripePeriodEnd: data.current_period_end ? data.current_period_end * 1000 : undefined,
      });
    }

    if (type === "invoice.payment_failed" && data.subscription) {
      const subscriptionId = typeof data.subscription === "string" ? data.subscription : data.subscription.id;
      const subscription = await stripeJson(`subscriptions/${encodeURIComponent(subscriptionId)}`).catch(() => null);
      if (subscription && subscriptionHasUpdatedResults(subscription)) {
        await updateConsumerSubscriptionStatus(subscription.id, "past_due");
      }
    }

    return json({ received: true });
  }),
});

http.route({
  path: "/api/stripe-webhook",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Stripe-Signature",
      },
    });
  }),
});

http.route({
  path: "/api/water-data-updated",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const origin = siteOrigin(request);
    const expectedSecret = process.env.DATA_UPDATE_WEBHOOK_SECRET;
    if (expectedSecret) {
      const provided = request.headers.get("x-aquareport-secret");
      if (provided !== expectedSecret) return json({ error: "Unauthorized" }, 401, origin);
    }

    const { zip } = await request.json().catch(() => ({ zip: "" }));
    if (!zip || !/^\d{5}$/.test(zip)) {
      return json({ error: "Invalid ZIP code" }, 400, origin);
    }

    const results = await triggerZipRescore(ctx, zip);
    return json({
      ok: true,
      zip,
      subscriberCount: results.length,
      consumerSite: consumerSiteUrl(),
      results,
    }, 200, origin);
  }),
});

http.route({
  path: "/api/water-data-updated",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": siteOrigin(request),
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-AquaReport-Secret",
      },
    });
  }),
});

export default http;
