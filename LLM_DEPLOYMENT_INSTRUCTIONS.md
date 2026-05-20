# AquaReport — Full Deployment Guide for LLMs

## Overview
AquaReport is a SaaS platform for water treatment dealers to generate professional water quality reports. It has:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Convex (serverless functions, real-time database, auth)
- **Water Data**: Supabase PostgreSQL (143K+ utilities, 269K+ contaminant readings)
- **Payments**: Stripe (checkout + webhooks + billing portal)
- **Auth**: Convex Auth with password-based login

## Project Structure
```
aquareport/
├── convex/                    # Backend (Convex functions)
│   ├── schema.ts             # Database schema
│   ├── auth.ts / auth.config.ts  # Authentication setup
│   ├── companies.ts          # Company CRUD + team management
│   ├── reports.ts            # Report generation & retrieval
│   ├── leads.ts              # Lead capture from customer reports
│   ├── stripe.ts             # Stripe checkout, portal, webhooks
│   ├── supabase.ts           # Proxy to Supabase water quality data
│   ├── admin.ts              # Admin setup + auto-link members
│   └── http.ts               # HTTP endpoints (ZIP report API, Stripe webhook)
├── src/
│   ├── pages/                # All pages
│   │   ├── LandingPage.tsx   # Public landing page with live demo
│   │   ├── LoginPage.tsx     # Login
│   │   ├── SignupPage.tsx    # Signup
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── GenerateReportPage.tsx  # 4-step report generation
│   │   ├── ReportsPage.tsx   # Report history list
│   │   ├── ViewReportPage.tsx # View saved report (admin)
│   │   ├── CustomerReportPage.tsx  # Customer-facing report (public)
│   │   ├── PrintReportPage.tsx     # Printable one-page report
│   │   ├── LeadsPage.tsx     # Lead management
│   │   ├── CompanySettingsPage.tsx # Company + Stripe settings
│   │   └── SettingsPage.tsx  # User account settings
│   ├── components/           # UI components
│   │   ├── AppSidebar.tsx    # Navigation sidebar
│   │   ├── AppLayout.tsx     # Authenticated layout
│   │   └── ProtectedRoute.tsx # Auth guard + auto-link
│   ├── App.tsx               # Router setup
│   └── main.tsx              # Entry point
├── .env.local                # Environment variables
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Step-by-Step Deployment

### 1. Prerequisites
- Node.js 18+ or Bun
- A Convex account (https://convex.dev)
- A Supabase project (already provisioned — see keys file)
- A Stripe account (for payments)

### 2. Install Dependencies
```bash
npm install
# or
bun install
```

### 3. Set Up Convex
```bash
# Login to Convex
npx convex login

# Initialize (if new project)
npx convex init

# Or link to existing
# The .env.local file has the deployment URLs
```

### 4. Environment Variables
Create `.env.local` in the project root:
```
CONVEX_DEPLOY_KEY=<your-deploy-key>
VITE_CONVEX_URL=<your-convex-deployment-url>
CONVEX_DEPLOYMENT=<your-deployment-name>
VITE_CONVEX_SITE_URL=<your-convex-site-url>
```

In the Convex Dashboard → Settings → Environment Variables, add:
```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_...
SITE_URL=https://your-domain.com
```

### 5. Set Up Supabase (Water Data)
The Supabase project is already provisioned with all water quality data.
- URL: https://lprpnbbhtqfkfgvnsioy.supabase.co
- The service role key is hardcoded in `convex/supabase.ts` and `convex/http.ts`
- If you need to change it, update those files

The Supabase database contains:
- `utilities` — 143K US water utilities
- `contaminant_readings` — 269K+ readings
- `contaminant_definitions` — 864 contaminant definitions
- `municipalities` — 26K municipalities
- `zip_utility_mapping` — 275K ZIP-to-utility mappings
- 4 RPC functions: `lookup_by_zip`, `search_utilities`, `get_water_report`, `zip_water_report`

### 6. Deploy
```bash
# Deploy Convex backend + build frontend
npx convex deploy --cmd 'npx vite build'

# Or deploy to Vercel/hosting
npx convex deploy
npm run build
# Then deploy the `dist/` folder to your hosting provider
```

### 7. Set Up Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://<your-convex-site-url>/api/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to Convex env vars

### 8. Set Up Admin User
1. Sign up at the app with your email
2. If a placeholder admin member exists for your email, you'll be auto-linked
3. Or manually add via Convex dashboard: add a `companyMembers` document with:
   - `companyId`: your company's ID
   - `userId`: your user's ID
   - `role`: "admin"
   - `email`: your email

### 9. Google Street View (Optional)
The app uses Google Street View Static API for house photos on reports.
- API key is in `src/pages/CustomerReportPage.tsx` (search for `GOOGLE_API_KEY`)
- Enable "Street View Static API" in Google Cloud Console
- Replace the key if needed

## Key Features
1. **Report Generation** — Enter ZIP code → select utility → review contaminants → save with customer info → get shareable link
2. **Customer Reports** — Beautiful dark-themed reports with contaminant analysis, health/legal comparisons, score gauge
3. **Lead Capture** — Every CTA button on customer reports opens a lead form → leads appear in dashboard
4. **Leads Management** — Filter by new/contacted/closed, track progress
5. **Stripe Billing** — 3 subscription tiers, checkout flow, billing portal
6. **Admin Settings** — Company branding, team management, Stripe configuration
7. **Print Reports** — One-page printable version at `/r/:shareToken/print`

## Database Schema (Convex)
- `companies` — Company profiles + Stripe fields
- `companyMembers` — Team members (admin/rep roles)
- `reports` — Generated water quality reports
- `leads` — Lead capture from customer reports

## API Endpoints (Convex HTTP)
- `POST /api/zip-report` — Public endpoint for landing page ZIP demo (no auth)
- `POST /api/stripe-webhook` — Stripe webhook handler

## Troubleshooting
- **"Invalid API key" from Supabase**: All Supabase access goes through the service role key in Convex actions (never client-side)
- **node_modules issues**: Delete `node_modules` and reinstall
- **TypeScript errors**: Run `npx tsc --noEmit` to check before deploying
- **Convex WebSocket errors**: Usually temporary — retry the deploy
