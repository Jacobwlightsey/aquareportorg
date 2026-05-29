import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { faqSchema, breadcrumbSchema } from "@/lib/schema";
import { ArrowRight, CheckCircle, XCircle, Minus, ChevronRight, Star } from "lucide-react";

/* ── Comparison data ─────────────────────────────────────────────── */
const competitors = [
  {
    name: "AquaReport",
    tagline: "Purpose-built for water treatment dealers",
    highlight: true,
    pricing: "From $199/mo",
    pricingNote: "Starter $199, Growth $349, Pro $599, Enterprise custom",
    waterSpecific: true,
    aquascore: true,
    demoWizard: true,
    epaData: true,
    brandedReports: true,
    consumerPortal: true,
    crm: true,
    aiTools: true,
    teamManagement: true,
    mobileApp: false,
    freeTrial: "1 free premium report",
    bestFor: "Water treatment dealers who want a professional, all-in-one platform built specifically for their workflow.",
  },
  {
    name: "ServiceTitan",
    tagline: "General home services software",
    highlight: false,
    pricing: "Custom (est. $250+/mo)",
    pricingNote: "No published pricing. Requires demo call.",
    waterSpecific: false,
    aquascore: false,
    demoWizard: false,
    epaData: false,
    brandedReports: false,
    consumerPortal: false,
    crm: true,
    aiTools: true,
    teamManagement: true,
    mobileApp: true,
    freeTrial: "No",
    bestFor: "Large home service companies (HVAC, plumbing, electrical) that need dispatch, scheduling, and invoicing at scale.",
  },
  {
    name: "Salesforce",
    tagline: "Enterprise CRM platform",
    highlight: false,
    pricing: "From $25/user/mo",
    pricingNote: "Essentials $25/user, Professional $100/user, Enterprise $175/user",
    waterSpecific: false,
    aquascore: false,
    demoWizard: false,
    epaData: false,
    brandedReports: false,
    consumerPortal: false,
    crm: true,
    aiTools: true,
    teamManagement: true,
    mobileApp: true,
    freeTrial: "30-day free trial",
    bestFor: "Enterprise companies that need a fully customizable CRM. Requires significant setup and ongoing admin.",
  },
  {
    name: "HubSpot CRM",
    tagline: "General-purpose CRM",
    highlight: false,
    pricing: "Free – $1,200+/mo",
    pricingNote: "Free CRM, Starter $20/mo, Professional $500/mo, Enterprise $1,200/mo",
    waterSpecific: false,
    aquascore: false,
    demoWizard: false,
    epaData: false,
    brandedReports: false,
    consumerPortal: false,
    crm: true,
    aiTools: true,
    teamManagement: true,
    mobileApp: true,
    freeTrial: "Free tier available",
    bestFor: "Marketing-focused teams that need email automation, landing pages, and a general CRM. No water industry features.",
  },
  {
    name: "Jobber",
    tagline: "Field service management",
    highlight: false,
    pricing: "From $49/mo",
    pricingNote: "Core $49, Connect $129, Grow $249",
    waterSpecific: false,
    aquascore: false,
    demoWizard: false,
    epaData: false,
    brandedReports: false,
    consumerPortal: false,
    crm: true,
    aiTools: false,
    teamManagement: true,
    mobileApp: true,
    freeTrial: "14-day free trial",
    bestFor: "Small field service businesses that need quoting, scheduling, and invoicing. No water-specific reporting.",
  },
];

const features = [
  { key: "waterSpecific", label: "Water Industry Specific", description: "Built specifically for water treatment dealers — not adapted from HVAC, plumbing, or generic CRM" },
  { key: "aquascore", label: "Water Quality Scoring", description: "Proprietary AquaScore™ 1–100 grading system that turns complex EPA data into a single score" },
  { key: "demoWizard", label: "In-Home Sales Demo Tool", description: "Interactive 21-step Demo Wizard designed for kitchen-table water presentations" },
  { key: "epaData", label: "Real-Time EPA/EWG Data", description: "Live contaminant data by ZIP code from EPA SDWIS, EWG, and Health Canada databases" },
  { key: "brandedReports", label: "Branded Water Reports", description: "Professional, branded water quality reports with your logo, colors, and contaminant breakdowns" },
  { key: "consumerPortal", label: "Consumer Report Portal", description: "Homeowners receive reports on a branded consumer-facing page (myaquareport.com)" },
  { key: "crm", label: "CRM & Lead Management", description: "Track leads, deals, appointments, proposals, and follow-ups" },
  { key: "aiTools", label: "AI-Powered Tools", description: "AI-generated summaries, talking points, and sales coaching" },
  { key: "teamManagement", label: "Team Management", description: "Multi-user accounts with role-based access and performance tracking" },
  { key: "mobileApp", label: "Native Mobile App", description: "Dedicated iOS/Android app (vs. mobile-responsive web app)" },
] as const;

type FeatureKey = (typeof features)[number]["key"];

function FeatureIcon({ value }: { value: boolean }) {
  if (value) return <CheckCircle className="h-5 w-5 text-emerald-400" />;
  return <XCircle className="h-5 w-5 text-slate-600" />;
}

const faqs = [
  {
    question: "Is AquaReport only for water treatment dealers?",
    answer:
      "Yes — AquaReport is purpose-built for water treatment dealers, water quality professionals, and water testing companies. Every feature is designed around the water dealer workflow: testing, reporting, presenting, and closing. Generic CRMs like Salesforce or HubSpot can track contacts, but they don't understand water data, contaminant scoring, or in-home sales presentations.",
  },
  {
    question: "How does AquaReport compare to ServiceTitan for water dealers?",
    answer:
      "ServiceTitan is excellent for large home service companies (HVAC, plumbing, electrical) that need dispatch, scheduling, and invoicing. However, it has no water-specific features — no water quality scoring, no EPA data integration, no branded water reports, and no in-home demo wizard. AquaReport fills that gap by providing everything a water dealer needs to present data, run demos, and close sales. Many dealers use ServiceTitan for scheduling and AquaReport for the water-specific sales workflow.",
  },
  {
    question: "Can I use AquaReport alongside my existing CRM?",
    answer:
      "Absolutely. Many dealers use AquaReport for water-specific tasks (reports, demos, water data) alongside their existing CRM (Salesforce, HubSpot, Jobber) for general business management. AquaReport focuses on what generic CRMs can't do: turning water test data into professional presentations that close sales.",
  },
  {
    question: "What makes AquaScore™ different from just showing test results?",
    answer:
      "AquaScore™ is a proprietary 1–100 scoring algorithm that considers legal limits (EPA MCLs), health guidelines (EWG standards), and contaminant severity. Instead of showing a homeowner a confusing table of parts-per-billion numbers, you show them a single score: 'Your water scored a 34 out of 100.' That's immediately understandable and creates the urgency that drives sales. No other platform offers this.",
  },
  {
    question: "Does AquaReport work in Canada?",
    answer:
      "Yes. AquaReport supports both US and Canadian water data. US dealers get EPA SDWIS + EWG data by ZIP code. Canadian dealers get Health Canada guidelines by postal code. The platform handles unit conversions, bilingual considerations, and region-specific contaminant standards automatically.",
  },
  {
    question: "How much does AquaReport cost compared to alternatives?",
    answer:
      "AquaReport starts at $199/month for the Starter plan (20 reports, 2 team members). The Growth plan is $349/month (50 reports, Demo Wizard, AI summaries) and the Pro plan is $599/month (150+ reports, white-label branding). By comparison, ServiceTitan typically costs $250+/month with no water-specific features. Salesforce starts at $25/user but requires extensive setup and customization. AquaReport offers a free premium report to try everything before committing.",
  },
  {
    question: "What's the 21-step Demo Wizard?",
    answer:
      "The Demo Wizard is AquaReport's flagship sales tool — a guided, interactive presentation designed for in-home water consultations. It walks sales reps through 21 psychology-driven steps: from pulling live EPA data for the customer's ZIP code, through live water testing and instant AquaScore™ scoring, to solution recommendation and proposal generation. Each step is designed around proven sales psychology to build concern, demonstrate value, and close with data. No other software offers anything like it for the water treatment industry.",
  },
];

export function ComparisonPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <SEO
        title="Best Water Treatment Dealer Software 2025"
        description="Compare AquaReport vs ServiceTitan vs Salesforce vs HubSpot vs Jobber. Feature-by-feature comparison and pricing for water treatment dealers."
        canonical="https://aquareport.org/best-water-treatment-dealer-software"
        schema={[
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Best Water Treatment Dealer Software", url: "https://aquareport.org/best-water-treatment-dealer-software" },
          ]),
          faqSchema(faqs),
        ]}
      />

      {/* Header */}
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" width="97" height="28" />
          </Link>
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm text-slate-400 transition hover:text-white">Home</Link>
            <Link to="/blog" className="text-sm text-slate-400 transition hover:text-white">Blog</Link>
            <Link to="/signup" className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-cyan-400 transition">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-300">Best Water Treatment Dealer Software</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Best Water Treatment Dealer Software
        </h1>
        <p className="text-sm font-medium text-cyan-400 mt-3">Updated for 2025</p>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
          A head-to-head comparison of the top software platforms water treatment dealers actually use — from purpose-built water tools to general CRMs. Find the right fit for your business.
        </p>
      </section>

      {/* Why This Matters */}
      <section className="mx-auto max-w-4xl px-6 pb-12">
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-3">Why This Comparison Matters</h2>
          <p className="leading-relaxed text-slate-300">
            Most water treatment dealers try to run their business on software built for HVAC companies, plumbers, or general sales teams. The result? They spend hours adapting generic tools to fit their workflow — and still can't present water quality data professionally. The right software should understand water testing, EPA standards, contaminant scoring, and in-home sales presentations <em>natively</em>, not as an afterthought.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-8 text-2xl font-bold text-white text-center">Feature-by-Feature Comparison</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-700/60">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="sticky left-0 z-10 bg-slate-900 px-5 py-4 text-left font-semibold text-slate-200 min-w-[200px]">Feature</th>
                {competitors.map((c) => (
                  <th key={c.name} className={`px-5 py-4 text-center font-semibold min-w-[140px] ${c.highlight ? "bg-cyan-950/30 text-cyan-300" : "bg-slate-800/80 text-slate-200"}`}>
                    {c.name}
                    {c.highlight && <Star className="inline h-3.5 w-3.5 ml-1 text-cyan-400" />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Pricing row */}
              <tr className="border-b border-slate-700/40">
                <td className="sticky left-0 z-10 bg-slate-900 px-5 py-4 font-medium text-slate-200">Pricing</td>
                {competitors.map((c) => (
                  <td key={c.name} className={`px-5 py-4 text-center ${c.highlight ? "bg-cyan-950/10" : ""}`}>
                    <div className="font-semibold text-white">{c.pricing}</div>
                    <div className="mt-1 text-xs text-slate-500">{c.pricingNote}</div>
                  </td>
                ))}
              </tr>
              {/* Feature rows */}
              {features.map((f, idx) => (
                <tr key={f.key} className={`border-b border-slate-700/40 ${idx % 2 === 0 ? "bg-slate-800/10" : ""}`}>
                  <td className="sticky left-0 z-10 bg-slate-900 px-5 py-4">
                    <div className="font-medium text-slate-200">{f.label}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{f.description}</div>
                  </td>
                  {competitors.map((c) => (
                    <td key={c.name} className={`px-5 py-4 text-center ${c.highlight ? "bg-cyan-950/10" : ""}`}>
                      <FeatureIcon value={c[f.key as FeatureKey] as boolean} />
                    </td>
                  ))}
                </tr>
              ))}
              {/* Free trial row */}
              <tr>
                <td className="sticky left-0 z-10 bg-slate-900 px-5 py-4 font-medium text-slate-200">Free Trial</td>
                {competitors.map((c) => (
                  <td key={c.name} className={`px-5 py-4 text-center text-sm text-slate-300 ${c.highlight ? "bg-cyan-950/10" : ""}`}>
                    {c.freeTrial}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Individual Reviews */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-8 text-2xl font-bold text-white">Detailed Breakdown</h2>

        {/* AquaReport */}
        <div className="mb-10 rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-slate-900/50 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" width="84" height="24" loading="lazy" />
            <span className="rounded-full bg-cyan-500/20 px-3 py-0.5 text-xs font-semibold text-cyan-300">Best for Water Dealers</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-3">AquaReport — Purpose-Built for Water Treatment</h3>
          <p className="leading-relaxed text-slate-300 mb-4">
            AquaReport is the only software platform built exclusively for water treatment dealers. While other tools force dealers to adapt generic CRM and field service workflows, AquaReport starts with what water dealers actually do: test water, present results, and close sales.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            The platform's core strength is its 21-step Demo Wizard — an interactive, psychology-driven sales presentation tool designed for in-home water consultations. It pulls live EPA and EWG data by ZIP code, scores water quality with the proprietary AquaScore™ algorithm (1–100), and walks reps through a proven sales flow from data presentation to proposal generation. No other platform offers anything comparable for water-specific sales.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            Additional features include branded digital water quality reports (delivered via a consumer portal at myaquareport.com), lead and pipeline management, AI-generated homeowner summaries and sales talking points, team management with role-based access, territory mapping, commission tracking, and automated follow-up campaigns.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mt-6">
            <div>
              <h4 className="font-semibold text-emerald-400 text-sm mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ Only water-dealer-specific platform</li>
                <li>✓ 21-step Demo Wizard (no competitor has this)</li>
                <li>✓ AquaScore™ water quality scoring</li>
                <li>✓ Real-time EPA/EWG/Health Canada data</li>
                <li>✓ Consumer portal (myaquareport.com)</li>
                <li>✓ Free premium report trial</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Considerations</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• No native mobile app (mobile-responsive web)</li>
                <li>• Focused on water — not HVAC, plumbing, etc.</li>
                <li>• Newer platform (founded 2025)</li>
              </ul>
            </div>
          </div>
          <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-400">
            Try AquaReport Free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* ServiceTitan */}
        <div className="mb-10 rounded-xl border border-slate-700/60 bg-slate-800/30 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-3">ServiceTitan — Best for Multi-Trade Home Services</h3>
          <p className="leading-relaxed text-slate-300 mb-4">
            ServiceTitan is the dominant platform in the home services industry, used primarily by HVAC, plumbing, and electrical companies. It excels at dispatch, scheduling, invoicing, and managing large field service teams. If you're a large water treatment company that also does plumbing or HVAC work, ServiceTitan handles the operational side well.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            The limitation for water dealers: ServiceTitan has no water-specific features. There's no water quality scoring, no EPA data integration, no way to generate branded water quality reports, and no in-home demo wizard. You'd need to use ServiceTitan for scheduling and operations, and a separate tool (like AquaReport) for the water-specific sales workflow.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div>
              <h4 className="font-semibold text-emerald-400 text-sm mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ Excellent for dispatch and scheduling</li>
                <li>✓ Strong invoicing and payment processing</li>
                <li>✓ Large field team management</li>
                <li>✓ Native mobile app</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Limitations for Water Dealers</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• No water quality features at all</li>
                <li>• No EPA/contaminant data</li>
                <li>• No branded water reports</li>
                <li>• Expensive with no published pricing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Salesforce */}
        <div className="mb-10 rounded-xl border border-slate-700/60 bg-slate-800/30 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-3">Salesforce — Best for Enterprise-Scale CRM</h3>
          <p className="leading-relaxed text-slate-300 mb-4">
            Salesforce is the world's largest CRM platform. It can do almost anything — but requires extensive setup, customization, and often a dedicated admin. For a large enterprise with complex workflows and a team of developers, Salesforce is infinitely flexible. For a water treatment dealer who needs to generate reports and run demos, it's massive overkill.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            You could theoretically build water quality reporting into Salesforce using custom objects, but you'd be spending months building what AquaReport provides out of the box — and you'd still lack EPA data integration, AquaScore™ scoring, and the Demo Wizard.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div>
              <h4 className="font-semibold text-emerald-400 text-sm mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ Infinitely customizable</li>
                <li>✓ Massive ecosystem and integrations</li>
                <li>✓ Enterprise-grade security</li>
                <li>✓ AI features (Einstein)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Limitations for Water Dealers</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• Requires extensive setup/customization</li>
                <li>• No water-specific features</li>
                <li>• Per-user pricing adds up fast</li>
                <li>• Steep learning curve</li>
              </ul>
            </div>
          </div>
        </div>

        {/* HubSpot */}
        <div className="mb-10 rounded-xl border border-slate-700/60 bg-slate-800/30 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-3">HubSpot CRM — Best for Marketing-First Teams</h3>
          <p className="leading-relaxed text-slate-300 mb-4">
            HubSpot is a popular choice for teams that prioritize inbound marketing — email automation, landing pages, content management, and lead nurturing. The free CRM tier is genuinely useful for basic contact management. If your primary need is running email campaigns and tracking website leads, HubSpot does it well.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            For water dealers, the gap is the same as other generic tools: no water testing integration, no contaminant data, no water quality reports, and no demo presentation tools. HubSpot excels at top-of-funnel marketing but doesn't help you close the sale at the kitchen table.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div>
              <h4 className="font-semibold text-emerald-400 text-sm mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ Free CRM tier</li>
                <li>✓ Excellent email marketing</li>
                <li>✓ Landing page builder</li>
                <li>✓ Strong analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Limitations for Water Dealers</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• No water-specific features</li>
                <li>• Expensive for full feature set</li>
                <li>• Marketing-focused, not field-sales focused</li>
                <li>• No in-home presentation tools</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Jobber */}
        <div className="mb-10 rounded-xl border border-slate-700/60 bg-slate-800/30 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-3">Jobber — Best for Small Field Service Teams</h3>
          <p className="leading-relaxed text-slate-300 mb-4">
            Jobber is a solid, affordable field service management tool for small businesses. It handles quoting, scheduling, invoicing, and client communication well. For a one-person water treatment operation that primarily needs to manage appointments and send invoices, Jobber is a reasonable starting point.
          </p>
          <p className="leading-relaxed text-slate-300 mb-4">
            The limitation: Jobber is designed for service businesses in general (landscaping, cleaning, etc.) and has zero water-specific functionality. You can schedule a water test appointment in Jobber, but you can't pull EPA data, generate a water quality report, or run a demo presentation. It solves the operations problem but not the sales problem.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mt-4">
            <div>
              <h4 className="font-semibold text-emerald-400 text-sm mb-2">Strengths</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>✓ Affordable starting price</li>
                <li>✓ Easy to set up and use</li>
                <li>✓ Good scheduling and invoicing</li>
                <li>✓ Client hub for communication</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400 text-sm mb-2">Limitations for Water Dealers</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li>• No water-specific features</li>
                <li>• No reporting or data tools</li>
                <li>• No AI features</li>
                <li>• Limited for growing teams</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Line */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">The Bottom Line</h2>
        <div className="space-y-4 text-slate-300 leading-relaxed">
          <p>
            If you're a water treatment dealer, the software you use directly impacts your close rate. Generic CRMs can track contacts. Field service tools can schedule appointments. But none of them help you <strong className="text-white">present water quality data in a way that closes sales</strong>.
          </p>
          <p>
            That's the gap AquaReport fills. It's the only platform built from the ground up for water treatment dealers — with real-time EPA data, proprietary water quality scoring, branded reports, a 21-step sales demo wizard, and a consumer delivery portal. Everything else on this list is a workaround.
          </p>
          <p>
            The best approach for most dealers: use <strong className="text-white">AquaReport for your water-specific workflow</strong> (testing, reporting, presenting, closing) and a general tool like Jobber or ServiceTitan for scheduling and invoicing if you need it. But for the sales side — the part that actually drives revenue — nothing else compares.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="mb-8 text-2xl font-bold text-white">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group rounded-xl border border-slate-700/60 bg-slate-800/40">
              <summary className="cursor-pointer px-6 py-4 text-lg font-semibold text-white transition hover:text-cyan-400 list-none flex items-center justify-between">
                {faq.question}
                <ChevronRight className="h-5 w-5 text-slate-500 transition group-open:rotate-90" />
              </summary>
              <div className="px-6 pb-5 text-slate-300 leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800/60 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to See the Difference?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Try AquaReport free — generate your first professional water quality report and see why dealers are switching from generic tools.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-4 text-lg font-bold text-white shadow-xl shadow-cyan-500/25 transition hover:bg-cyan-400"
            >
              Start Free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-8 py-4 text-lg font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" width="84" height="24" loading="lazy" />
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Professional water quality reporting software for water treatment dealers.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/#features" className="hover:text-white transition">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link to="/signup" className="hover:text-white transition">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/blog" className="hover:text-white transition">Blog</Link></li>
              <li><Link to="/water-treatment-dealer-software" className="hover:text-white transition">Dealer Software</Link></li>
              <li><Link to="/water-quality-report-software" className="hover:text-white transition">Report Software</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about/jacob-lightsey" className="hover:text-white transition">About</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
              <li><a href="mailto:support@aquareport.org" className="hover:text-white transition">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-slate-800/60 px-6 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} AquaReport. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
