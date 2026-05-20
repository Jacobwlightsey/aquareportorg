# AquaReport LLM Site Access Guide

This guide is for a trusted engineer or LLM agent taking over AquaReport maintenance. It lists the systems, URLs, required credentials, and safe access steps needed to work on the live app.

Do not paste live secrets into chat logs, docs, commits, tickets, screenshots, or model prompts. Store production values only in provider-managed environment variables or a local uncommitted `.env.local`.

## Current Production Systems

- Production website: `https://aquareport.org`
- Cloudflare Pages project: `aquareport`
- Convex production deployment: `groovy-basilisk-939`
- Convex production cloud URL: `https://groovy-basilisk-939.convex.cloud`
- Convex production HTTP actions URL: `https://groovy-basilisk-939.convex.site`
- Convex dev deployment: `quick-duck-108`
- Convex dev cloud URL: `https://quick-duck-108.convex.cloud`
- Supabase project ref: `lprpnbbhtqfkfgvnsioy`
- Stripe mode: live
- Primary domain/DNS provider: Cloudflare
- Email provider: Resend

## Required Secrets

These are the secrets a trusted operator needs. Values are intentionally not written here.

| Secret | Where it is used | Where to store it |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | Deploy Convex functions and read Convex env | Local shell only |
| `VITE_CONVEX_URL` | Frontend Convex client | Cloudflare Pages env / local `.env.local` |
| `VITE_CONVEX_SITE_URL` | Frontend public API calls | Cloudflare Pages env / local `.env.local` |
| `JWT_PRIVATE_KEY` | Convex auth signing | Convex env |
| `JWKS` | Convex auth public key discovery | Convex env |
| `AUTH_PRIVATE_KEY` | Convex auth private key compatibility | Convex env if used |
| `SITE_URL` | Auth emails, Stripe redirects, CORS | Convex env |
| `SUPABASE_URL` | Water-data backend | Convex env / local import shell |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase access/imports | Convex env / local import shell |
| `STRIPE_SECRET_KEY` | Checkout and billing | Convex env |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Convex env |
| `OPENAI_API_KEY` | AI report tools | Convex env |
| `RESEND_API_KEY` | Auth and transactional email | Convex env |
| `AUTH_EMAIL_FROM` | Email sender identity | Convex env |
| `AUTH_EMAIL_REPLY_TO` | Email reply-to address | Convex env |
| `SENTRY_DSN` | Error monitoring | Convex env / frontend env if enabled |
| `VITE_GOOGLE_STREET_VIEW_API_KEY` | Report home imagery | Cloudflare Pages env |
| `TWILIO_ACCOUNT_SID` | SMS integrations | Convex env |
| `TWILIO_AUTH_TOKEN` | SMS integrations | Convex env |
| `HUBSPOT_CLIENT_ID` | HubSpot integration | Convex env |
| `HUBSPOT_CLIENT_SECRET` | HubSpot integration | Convex env |
| `GOHIGHLEVEL_CLIENT_ID` | GoHighLevel integration | Convex env |
| `GOHIGHLEVEL_CLIENT_SECRET` | GoHighLevel integration | Convex env |
| `SALESFORCE_CLIENT_ID` | Salesforce integration | Convex env |
| `SALESFORCE_CLIENT_SECRET` | Salesforce integration | Convex env |
| `MAILCHIMP_CLIENT_ID` | Mailchimp integration | Convex env |
| `MAILCHIMP_CLIENT_SECRET` | Mailchimp integration | Convex env |
| Cloudflare API token or Wrangler OAuth | Pages deploys, DNS, domain routing | Cloudflare account / local Wrangler auth |

## Non-Secret IDs And Config

Stripe price IDs currently referenced by the build/business setup:

- Starter: `price_1TXxTjRjbFWooo6zasfFajEP`
- Growth: `price_1TXxU5RjbFWooo6zwgWMk6Py`
- Pro: `price_1TXxUYRjbFWooo6z88lrEy9n`

Known Stripe product IDs:

- Starter product: `prod_UX1WCbea9NNbiX`
- Growth product: `prod_UX1XwLj5vXwGLD`

Current pricing policy:

- Starter: `$99/month`, `20` reports
- Growth: `$199/month`, `50` reports
- Pro: `$499/month`, `150+` reports
- Enterprise: contact sales, unlimited reports, onboarding, training, white-label/support features

## Local Setup

From the repo root:

```powershell
cd "C:\Users\jswaz\Documents\Codex\2026-05-17\files-mentioned-by-the-user-aquareport\aquareport"
npm install
```

Create a local `.env.local` for frontend-only values:

```dotenv
VITE_CONVEX_URL=https://groovy-basilisk-939.convex.cloud
VITE_CONVEX_SITE_URL=https://groovy-basilisk-939.convex.site
VITE_GOOGLE_STREET_VIEW_API_KEY=<google-street-view-key-if-enabled>
```

Do not put `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, or `RESEND_API_KEY` in frontend env files.

## Convex Access

Production deploy:

```powershell
$env:CONVEX_DEPLOY_KEY="<prod-convex-deploy-key>"
npx convex deploy
```

Read a Convex env var:

```powershell
$env:CONVEX_DEPLOY_KEY="<prod-convex-deploy-key>"
npx convex env get SUPABASE_URL
```

Set a Convex env var:

```powershell
$env:CONVEX_DEPLOY_KEY="<prod-convex-deploy-key>"
npx convex env set RESEND_API_KEY "<resend-api-key>"
```

Required Convex production env checklist:

```dotenv
SITE_URL=https://aquareport.org
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
STRIPE_SECRET_KEY=<stripe-live-secret-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-signing-secret>
OPENAI_API_KEY=<openai-project-api-key>
RESEND_API_KEY=<resend-api-key>
AUTH_EMAIL_FROM=AquaReport <hello@aquareport.org>
AUTH_EMAIL_REPLY_TO=support@aquareport.org
JWT_PRIVATE_KEY=<convex-auth-jwt-private-key>
JWKS=<convex-auth-jwks-json>
```

## Cloudflare Pages Deploy

Build and deploy:

```powershell
npm run build
npx wrangler pages deploy dist --project-name=aquareport --branch=main
```

Cloudflare Pages production env checklist:

```dotenv
VITE_CONVEX_URL=https://groovy-basilisk-939.convex.cloud
VITE_CONVEX_SITE_URL=https://groovy-basilisk-939.convex.site
VITE_GOOGLE_STREET_VIEW_API_KEY=<optional-google-key>
```

Domain routing should point `aquareport.org` to the Pages project.

## Supabase Access

Project ref: `lprpnbbhtqfkfgvnsioy`

Core water report tables/functions:

- `clearflow_water_reports`
- `clearflow_zip_lookup`
- `contaminant_tests`
- `contaminant_report_summary`
- `utility_data_quality_flags`
- `zip_utility_mapping`
- `zip_utility_overrides`
- RPC: `zip_water_report(p_zip text)`
- RPC: `aquareport_build_report_from_clearflow(...)`
- RPC: `aquareport_build_report_from_legacy(...)`

Current report strategy:

1. Resolve ZIP using `clearflow_zip_lookup`.
2. Fall back to manual overrides/city fallback for PO-box or missing ZIPs.
3. Build the final report from the richest available contaminant source:
   - `legacy_ewg_enriched` when it has more complete contaminant data.
   - `clearflow_sdwis_ewg_guidelines` when it is stronger.

Useful QA query:

```sql
with samples(zip) as (
  values ('97401'), ('75001'), ('10001'), ('60601'), ('90210'), ('29526'), ('34747'), ('33101'), ('90001'), ('77001')
)
select
  s.zip,
  r->'utility_info'->>'pwsid' as pwsid,
  r->'utility_info'->>'utility_name' as utility_name,
  r->>'total_tested' as total_contaminants,
  r->>'total_above_health_guideline' as over_health,
  r->>'lookup_source' as lookup_source,
  r->>'selected_report_source' as report_source
from samples s
left join lateral public.zip_water_report(s.zip) r on true
order by s.zip;
```

## Data Import Scripts

The project contains import scripts for rebuilding report data:

```powershell
$env:CONVEX_DEPLOY_KEY="<prod-convex-deploy-key>"
$env:SUPABASE_URL=(npx convex env get SUPABASE_URL)
$env:SUPABASE_SERVICE_ROLE_KEY=(npx convex env get SUPABASE_SERVICE_ROLE_KEY)

node .\scripts\import-clearflow-reports.mjs .\tmp\clearflow_clean\all_reports.json
node .\scripts\import-clearflow-zip-lookup.mjs .\tmp\clearflow_clean\clean_zip_lookup.json
```

Do not rerun bulk imports casually on production. Snapshot or export first.

## Stripe Access

Required webhook endpoint:

```text
https://groovy-basilisk-939.convex.site/api/stripe-webhook
```

Recommended live webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Billing code verifies webhook signatures using `STRIPE_WEBHOOK_SECRET`. Do not bypass signature verification.

## Email Access

Provider: Resend

Important sender config:

```dotenv
RESEND_API_KEY=<resend-api-key>
AUTH_EMAIL_FROM=AquaReport <hello@aquareport.org>
AUTH_EMAIL_REPLY_TO=support@aquareport.org
```

Email domain should be verified in Resend for `aquareport.org`.

Transactional templates handled in Convex:

- Verification code
- Resend verification code
- Forgot password
- Thanks for signup
- Thanks for purchase
- Lead incoming
- Unpurchased subscription follow-up

## OpenAI Access

Server-side env:

```dotenv
OPENAI_API_KEY=<openai-project-api-key>
```

Current intended model policy:

- Routine homeowner/report generations: `gpt-5.4-mini`
- Higher-value summary/sales copy: `gpt-5.5`

AI outputs are stored in Convex `aiGenerations`.

## Production QA Checklist

After any handoff or deploy:

1. `npm run build`
2. `npx convex deploy`
3. `npx wrangler pages deploy dist --project-name=aquareport --branch=main`
4. Test `POST https://groovy-basilisk-939.convex.site/api/zip-report` with:
   - `29526`
   - `34747`
   - `75001`
   - `97401`
   - `10001`
   - `60601`
   - `90210`
5. Create a test user and verify auth email code.
6. Generate one report in the dashboard.
7. Check the report CTA/product section.
8. Check the subscription management page.
9. Trigger a Stripe test flow only in test mode; do not test live payments without a plan.
10. Confirm Cloudflare Pages custom domain is serving the newest deployment.

## Critical Safety Notes

- Never commit `.env.local`, `.env.production` with secrets, API keys, deploy keys, private keys, or service role keys.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never expose `STRIPE_SECRET_KEY` to the browser.
- Never expose `OPENAI_API_KEY` to the browser.
- Rotate any secret that has been pasted into chat, screenshots, public docs, or issue trackers.
- Prefer provider dashboards and environment variables over sharing raw keys with another agent.
