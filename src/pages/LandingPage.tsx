import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { organizationSchema, softwareAppSchema, websiteSchema, faqSchema } from "@/lib/schema";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  Droplets,
  FileText,
  Globe2,
  Loader2,
  Map as MapIcon,
  MapPin,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { api } from "../../convex/_generated/api";

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL || "https://groovy-basilisk-939.convex.site";

interface Contaminant {
  name?: string;
  contaminant: string;
  detected?: boolean;
  detection_status?: "detected" | "not_detected" | "trace" | "unknown";
  detected_level: number;
  legal_limit: number | null;
  health_guideline: number | null;
  over_health: boolean;
  over_legal: boolean;
  times_above_ewg: number | null;
  effect: string | null;
  unit: string;
}

interface WaterReport {
  utility_info: {
    utility_name: string;
    pwsid: string;
    city: string;
    state: string;
    population_served: number;
    water_source: string;
  };
  total_tested?: number;
  total_detected?: number;
  total_above_legal_limit?: number;
  total_above_health_guideline?: number;
  contaminants: Contaminant[];
}

function contaminantName(contaminant: Contaminant): string {
  return contaminant.contaminant || contaminant.name || "Unknown contaminant";
}

function isDetectedContaminant(contaminant: Contaminant): boolean {
  return contaminant.detected !== false && contaminant.detection_status !== "not_detected";
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-white">{question}</span>
        {open ? <ChevronUp className="size-5 text-cyan-300" /> : <ChevronDown className="size-5 text-slate-500" />}
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-slate-400">{answer}</p>}
    </div>
  );
}

function LiveDemo() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const lookup = useCallback(async () => {
    if (!/^\d{5}$/.test(zip)) {
      setError("Enter a valid 5-digit ZIP code");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/zip-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zip }),
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.utility_info?.utility_name) {
        const junk = [
          "reverse osmosis",
          "how your levels compare",
          "surface water treatment rule",
          "consumer confidence rule",
          "lead and copper rule",
          "total coliform rule",
          "ground water rule",
          "filter backwash",
          "disinfection byproducts rule",
          "enhanced surface water",
          "aircraft drinking water",
          "lead (90th percentile)",
        ];
        const cleanReport = data[0];
        cleanReport.contaminants = cleanReport.contaminants.filter((contaminant: Contaminant) => {
          const name = contaminantName(contaminant).toLowerCase();
          return !junk.some((item) => name.includes(item));
        });
        setReport(cleanReport);
      } else {
        setError("No water system found for that ZIP code. Try another.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [zip]);

  useEffect(() => {
    if (report && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  const detectedContaminants = report?.contaminants.filter(isDetectedContaminant) ?? [];
  const overHealth = detectedContaminants.filter((contaminant) => contaminant.over_health);
  const overLegal = detectedContaminants.filter((contaminant) => contaminant.over_legal);
  const totalDetected = report?.total_detected ?? detectedContaminants.length;
  const demoScore = report ? Math.max(0, Math.min(100, 100 - overHealth.length * 6 - overLegal.length * 12)) : 0;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-[1.5rem] border border-cyan-300/15 bg-white/[0.04] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Search className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Run a live ZIP lookup</h3>
            <p className="text-sm text-slate-400">Generate a real local water snapshot your team can use in the sales conversation.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="e.g. 29526"
            value={zip}
            onChange={(event) => setZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
            onKeyDown={(event) => event.key === "Enter" && lookup()}
            className="h-13 border-white/10 bg-slate-950/70 text-lg text-white placeholder:text-slate-600"
            maxLength={5}
          />
          <Button onClick={lookup} disabled={loading} size="lg" className="h-13 shrink-0 bg-cyan-300 px-7 font-bold text-slate-950 hover:bg-cyan-200">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Scanning..." : "Lookup Water"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {report && (
        <div ref={resultRef} className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 text-white shadow-2xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_36%)] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                  <MapPin className="size-3 text-cyan-300" />
                  {report.utility_info.city}, {report.utility_info.state}
                </div>
                <h4 className="text-2xl font-bold md:text-3xl">{report.utility_info.utility_name}</h4>
                <p className="mt-1 text-sm text-slate-400">
                  {report.utility_info.population_served?.toLocaleString()} people served - {report.utility_info.water_source}
                </p>
              </div>
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[10px] border-cyan-300/80 bg-slate-900">
                <span className="text-3xl font-black text-cyan-200">{demoScore}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-y border-white/10">
            {[
              ["Tested", report.total_tested ?? report.contaminants.length, "text-cyan-200"],
              ["Detected", totalDetected, "text-orange-300"],
              ["Over health", report.total_above_health_guideline ?? overHealth.length, "text-red-300"],
            ].map(([label, value, color]) => (
              <div key={label} className="border-r border-white/10 p-4 text-center last:border-r-0">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top concerns</p>
            <div className="space-y-2.5">
              {detectedContaminants.slice(0, 6).map((contaminant) => (
                <div key={contaminantName(contaminant)} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="truncate text-sm font-medium">{contaminantName(contaminant)}</span>
                  <span className="shrink-0 font-mono text-sm text-slate-300">
                    {contaminant.detected_level} {contaminant.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const platformCards = [
  ["Premium Reports", "Score visuals, contaminant cards, legal-vs-health context, share links, print views, and presentation mode.", FileText],
  ["AI Sales Assistant", "Homeowner summaries, sales talking points, objection handling, follow-up drafts, and narrated scripts.", BrainCircuit],
  ["Territory Intelligence", "High-risk ZIPs, coverage heatmaps, report volume, lead activity, and market opportunity signals.", MapIcon],
  ["Enterprise Controls", "Team roles, audit logs, integrations, custom branding, custom domains, and backend subscription enforcement.", ShieldCheck],
] as const;

const riskRows = [
  ["Total Trihalomethanes", "36.2 ppb", "252x", "bg-red-400"],
  ["Haloacetic Acids", "30.8 ppb", "205x", "bg-orange-300"],
  ["Tetrachloroethylene", "24.9 ppb", "62x", "bg-yellow-300"],
  ["Mercury", "0.345 ppm", "legal", "bg-red-400"],
] as const;

const proofStats = [
  [Database, "284,195", "contaminant readings", "Structured water quality data across the U.S."],
  [Globe2, "97%", "population coverage", "Built for teams selling across many territories."],
  [Target, "3 sec", "report generation", "Fast enough for calls, door knocks, and follow-up."],
  [Users, "CRM", "sales workflow", "Leads, reports, notes, and integrations in one place."],
] as const;

function EnterpriseContactDialog({
  children,
  source,
}: {
  children: ReactNode;
  source: string;
}) {
  const submitEnterpriseLead = useMutation(api.leads.submitEnterpriseLead);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    email: "",
    phone: "",
    message: "",
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await submitEnterpriseLead({
        name: form.name,
        companyName: form.companyName || undefined,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message || undefined,
        source,
      });
      toast.success("Enterprise request received. We'll follow up shortly.");
      setForm({ name: "", companyName: "", email: "", phone: "", message: "" });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send enterprise request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-cyan-300/20 bg-slate-950 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Talk with AquaReport Enterprise</DialogTitle>
          <DialogDescription>
            Tell us where to follow up. This request is saved for admin review.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`enterprise-name-${source}`}>Name</Label>
              <Input
                id={`enterprise-name-${source}`}
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`enterprise-company-${source}`}>Company</Label>
              <Input
                id={`enterprise-company-${source}`}
                value={form.companyName}
                onChange={(event) => updateField("companyName", event.target.value)}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`enterprise-email-${source}`}>Email</Label>
              <Input
                id={`enterprise-email-${source}`}
                required
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`enterprise-phone-${source}`}>Phone</Label>
              <Input
                id={`enterprise-phone-${source}`}
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="border-white/10 bg-white/[0.04]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`enterprise-message-${source}`}>What do you need?</Label>
            <Textarea
              id={`enterprise-message-${source}`}
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              className="border-white/10 bg-white/[0.04]"
              placeholder="Team size, territory, launch timeline, or integrations..."
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full bg-cyan-300 font-bold text-slate-950 hover:bg-cyan-200">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
            Send Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-300/10 bg-[#020711]/92 shadow-[0_18px_60px_rgba(0,0,0,.42)] backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-5">
        <a href="/" className="flex min-w-0 items-center gap-3" aria-label="AquaReport home">
          <img src="/aquareport-logo.png" alt="AquaReport" className="h-10 w-auto shrink-0" />
        </a>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
          <a href="#demo" className="transition hover:text-cyan-200">
            Demo
          </a>
          <a href="#pricing" className="transition hover:text-cyan-200">
            Pricing
          </a>
          <a href="#coverage" className="transition hover:text-cyan-200">
            Coverage
          </a>
          <Link to="/blog" className="transition hover:text-cyan-200">
            Blog
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" className="h-11 px-3 text-sm font-semibold text-white hover:bg-white/10 hover:text-cyan-100 sm:px-5">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-lg shadow-blue-700/30 hover:bg-blue-500 sm:px-6">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

const homepageFaqs = [
  { question: "Where does the water quality data come from?", answer: "AquaReport uses a structured water data backend that tracks utility-level contaminant readings, legal limits, and health-protective guidelines across the United States." },
  { question: "Can reports use my company branding?", answer: "Yes. Paid plans support branded reports, and Pro expands into white-label controls, custom disclaimers, custom domains, and API-ready enterprise features." },
  { question: "Does this replace a water test?", answer: "No. AquaReport helps sales teams open a smarter conversation with local water data. A current in-home test can still be used to confirm conditions at the tap." },
  { question: "Can I connect this to my CRM?", answer: "The platform has native integration paths for CRM, marketing, SMS, Zapier, and API workflows so teams can sync leads and report activity." },
  { question: "How does AquaReport help dealers close more sales?", answer: "AquaReport generates professional, branded water quality reports with AquaScore™ ratings that visually show customers what's in their water. The Demo Wizard walks reps through a guided presentation, making every in-home appointment more compelling and data-driven." },
  { question: "What is AquaScore™?", answer: "AquaScore™ is AquaReport's proprietary water quality scoring system that rates tap water on a 0–100 scale based on detected contaminants and EPA/health guidelines. It gives homeowners an instant, easy-to-understand grade for their water quality." },
  { question: "How much does AquaReport cost?", answer: "AquaReport offers a free trial with one report, then three paid tiers: Starter at $199/month (20 reports, 2 team members), Growth at $349/month (50 reports, 5 team members, Demo Wizard & AI), and Pro at $599/month (150+ reports, 15 team members, white-label & territory intelligence). Annual billing saves you two months. No long-term contracts required." },
  { question: "How do customers view their water quality report?", answer: "Customers receive a unique link to myaquareport.com where they can view their branded, interactive water quality report on any device — no login or app download required." },
];


/* ── Glow Pricing Card ─────────────────────────────────────────── */

const PLAN_GLOW: Record<string, { gradient: string; delay: number }> = {
  starter: {
    gradient: "linear-gradient(137deg, #334155 0%, #64748b 45%, #475569 100%)",
    delay: 0.1,
  },
  growth: {
    gradient: "linear-gradient(137deg, #06b6d4 0%, #67e8f9 40%, #22d3ee 100%)",
    delay: 0.2,
  },
  pro: {
    gradient: "linear-gradient(137deg, #3b82f6 0%, #a5f3fc 45%, #8b5cf6 100%)",
    delay: 0.3,
  },
};

function GlowPricingCard({
  plan,
  billingCycle,
}: {
  plan: (typeof SUBSCRIPTION_PLANS)[number];
  billingCycle: "monthly" | "annual";
}) {
  const glow = PLAN_GLOW[plan.id] ?? PLAN_GLOW.starter;
  const displayPrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const savingsPercent = Math.round(
    ((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100,
  );
  const effectiveMonthly = Math.round(plan.annualPrice / 12);
  const cardBg = "#0d1420";

  return (
    <motion.div
      className="relative flex flex-col items-center w-full group mx-auto"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: glow.delay }}
    >
      {/* Glow blob */}
      <div
        className="absolute inset-0 opacity-50 rounded-[32px] pointer-events-none transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: glow.gradient, filter: "blur(50px)" }}
      />

      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-cyan-300 px-4 py-1 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-300/30">
          Most popular
        </div>
      )}

      {/* Card shell with gradient border */}
      <div
        className="relative z-10 w-full rounded-[32px] overflow-hidden"
        style={{
          border: "2px solid transparent",
          background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, ${glow.gradient} border-box`,
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${plan.popular ? "rgba(34,211,238,.5)" : "rgba(255,255,255,.12)"}, transparent)` }}
        />

        <div className="w-full p-7 flex flex-col">
          <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
          <div className="mt-5 mb-1">
            <span className="text-5xl font-black text-white">${displayPrice.toLocaleString()}</span>
            <span className="text-slate-500 ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          {billingCycle === "annual" && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500 line-through">${(plan.monthlyPrice * 12).toLocaleString()}/yr</span>
              <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/25 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                Save {savingsPercent}%
              </span>
              <span className="text-xs text-slate-500">Just ${effectiveMonthly}/mo</span>
            </div>
          )}
          {billingCycle === "monthly" && <div className="mb-4" />}

          <ul className="space-y-3 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className={
              plan.popular
                ? "mt-8 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-lg shadow-cyan-400/20"
                : "mt-8 w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            }
            variant={plan.popular ? "default" : "outline"}
            size="lg"
            asChild
          >
            <Link to="/signup">Get 1 Free Report</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  return (
    <section id="pricing" className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,.12),transparent_42%),radial-gradient(circle_at_18%_76%,rgba(34,211,238,.08),transparent_30%),linear-gradient(180deg,#020711,#061124_52%,#020711)]" />
      <div className="container relative">
        <motion.div
          className="mx-auto mb-8 max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Pricing</p>
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Start with one free report. Scale when your team is ready.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">Every account gets 1 premium report free — no credit card needed. Choose a plan when you're ready to scale.</p>
        </motion.div>

        {/* Monthly/Annual Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-lg" : "text-white/50 hover:text-white/80"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-slate-900 shadow-lg" : "text-white/50 hover:text-white/80"}`}
            >
              Annual
              <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">Save up to 33%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto px-4 lg:px-0">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <GlowPricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />
          ))}
        </div>

        {/* Enterprise row */}
        <motion.div
          className="max-w-5xl mx-auto mt-8 relative group"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.4 }}
        >
          <div
            className="absolute inset-0 opacity-30 rounded-[32px] pointer-events-none transition-opacity duration-500 group-hover:opacity-45"
            style={{
              background: "linear-gradient(137deg, #22d3ee 0%, #a5f3fc 45%, #06b6d4 100%)",
              filter: "blur(40px)",
            }}
          />
          <div
            className="relative z-10 rounded-[32px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              border: "2px solid transparent",
              background: "linear-gradient(#0d1420, #0d1420) padding-box, linear-gradient(137deg, rgba(34,211,238,.35), rgba(6,182,212,.15)) border-box",
            }}
          >
            <div>
              <h3 className="text-lg font-bold text-white">Enterprise</h3>
              <p className="text-sm text-slate-400">Unlimited reports, custom domains, onboarding, and dedicated support.</p>
            </div>
            <EnterpriseContactDialog source="homepage_pricing">
              <Button className="border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20 hover:text-white shrink-0" variant="outline" size="lg">
                Contact Us
              </Button>
            </EnterpriseContactDialog>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#020711] text-white">
      <SEO
        title="AquaReport — Water Quality Report Software for Dealers"
        description="Professional water quality reporting software for water treatment dealers. Create branded reports with AquaScore™, present with the Demo Wizard, and deliver via myaquareport.com."
        canonical="https://aquareport.org"
        schema={[organizationSchema, softwareAppSchema, websiteSchema, faqSchema(homepageFaqs)]}
      />
      <LandingNav />

      <section className="relative mx-auto hidden aspect-[1536/932] w-full max-w-[1920px] overflow-hidden bg-[#020711] md:block">
        <img
          src="/aquareport-platform-landing.png"
          alt="AquaReport water intelligence platform landing page with homeowner report, AI sales tools, and territory risk map"
          className="absolute inset-x-0 -top-[9%] block h-auto w-full select-none"
          draggable={false}
        />
        <Link to="/signup" aria-label="Generate a report" className="absolute left-[4.6%] top-[45.6%] h-[5.7%] w-[15.2%] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <span className="sr-only">Generate a report</span>
        </Link>
        <a href="#demo" aria-label="View AquaReport demo" className="absolute left-[20.9%] top-[45.6%] h-[5.7%] w-[10.7%] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <span className="sr-only">View AquaReport demo</span>
        </a>
      </section>

      <section className="relative mx-auto aspect-[839/1748] w-full overflow-hidden bg-[#020711] md:hidden">
        <img
          src="/aquareport-platform-landing-mobile.png"
          alt="AquaReport mobile landing page with water intelligence headline, report preview, AI sales summary, and risk map"
          className="absolute inset-x-0 -top-[7%] block h-auto w-full select-none"
          draggable={false}
        />
        <Link to="/signup" aria-label="Generate a report" className="absolute left-[3.3%] top-[34.5%] h-[4.8%] w-[52%] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <span className="sr-only">Generate a report</span>
        </Link>
        <a href="#demo" aria-label="View AquaReport demo" className="absolute left-[3.3%] top-[40.3%] h-[4.2%] w-[52%] rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <span className="sr-only">View AquaReport demo</span>
        </a>
      </section>

      <section className="relative overflow-hidden border-y border-cyan-300/10 bg-[#020711] py-8">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(34,211,238,.08),transparent)]" />
        <div className="container relative grid gap-4 md:grid-cols-4">
          {proofStats.map(([Icon, value, label, subtext]) => {
            const TypedIcon = Icon as typeof Database;
            return (
              <div key={label as string} className="group relative overflow-hidden rounded-2xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(8,20,38,.92),rgba(2,7,17,.98))] p-4 shadow-2xl shadow-cyan-950/10 transition hover:border-cyan-300/40">
                <div className="absolute -right-10 -top-10 size-24 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-cyan-300/15" />
                <div className="relative mb-4 flex size-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,.12)]">
                  <TypedIcon className="size-5" />
                </div>
                <div className="relative">
                  <p className="text-xl font-bold text-white">{value as string}</p>
                  <p className="text-sm text-slate-500">{label as string}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{subtext as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,.14),transparent_28%),radial-gradient(circle_at_80%_35%,rgba(37,99,235,.16),transparent_34%),linear-gradient(180deg,#020711,#04101e_42%,#020711)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(125,211,252,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,.08)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="container relative">
          <div className="mb-12 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Complete platform</p>
              <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">A command center built around the water report.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-400 lg:justify-self-end">
              AquaReport turns one ZIP-code lookup into the full sales workflow: report, lead capture, AI guidance, team controls, territory intelligence, and follow-up.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[1.6rem] border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(10,22,42,.95),rgba(1,7,18,.98))] p-5 shadow-2xl shadow-cyan-950/30 md:p-7">
              <div className="absolute -left-24 -top-24 size-72 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative rounded-[1.1rem] border border-white/10 bg-black/30 p-4">
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-sm font-bold text-white">Homeowner report console</p>
                    <p className="text-xs text-slate-500">Local risk, explanation, lead action</p>
                  </div>
                  <div className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-200">LIVE</div>
                </div>
                <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                  <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Water score</p>
                    <div className="mt-6 flex size-36 items-center justify-center rounded-full border-[12px] border-red-400/80 bg-slate-950 shadow-[0_0_60px_rgba(248,113,113,.25)]">
                      <span className="text-5xl font-black text-white">16</span>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-slate-400">11 contaminants above health guidelines. 1 contaminant over a legal limit.</p>
                  </div>
                  <div className="space-y-3">
                    {riskRows.map(([name, amount, risk, color]) => (
                      <div key={name} className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                        <div>
                          <p className="font-semibold text-white">{name}</p>
                          <p className="mt-1 text-sm text-slate-500">{amount}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`size-2.5 rounded-full ${color}`} />
                          <span className="font-mono text-sm text-slate-300">{risk}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {platformCards.map(([title, text, Icon]) => (
                <div key={title} className="group relative overflow-hidden rounded-[1.25rem] border border-cyan-300/15 bg-[linear-gradient(145deg,rgba(13,25,48,.78),rgba(3,10,22,.94))] p-5 shadow-2xl shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:border-cyan-300/45">
                  <div className="absolute -right-12 -top-12 size-32 rounded-full bg-cyan-300/10 blur-3xl transition group-hover:bg-cyan-300/20" />
                  <div className="relative mb-4 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                  </div>
                  <p className="relative text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-cyan-300/10 bg-[linear-gradient(180deg,rgba(15,23,42,.9),rgba(2,6,23,.98))] py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(248,113,113,.12),transparent_32%),radial-gradient(circle_at_12%_72%,rgba(34,211,238,.1),transparent_28%)]" />
        <div className="container relative grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Why this sells</p>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Customers need to see what is in their water before they care about filtration.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              AquaReport gives reps a credible path: start with local water risk, explain the health concern in plain language, then introduce whole-home filtration as the natural next step.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Show the risk", "Explain the impact", "Book the consult"].map((item, index) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="font-mono text-xs text-cyan-300">0{index + 1}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-5 shadow-2xl shadow-red-950/20">
            <div className="absolute -right-24 top-8 size-72 rounded-full bg-red-500/10 blur-3xl" />
            <div className="relative mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div>
                <p className="text-sm font-semibold text-white">Customer risk sequence</p>
                <p className="text-xs text-slate-500">Report data translated into sales moments</p>
              </div>
              <AlertTriangle className="size-6 text-orange-300" />
            </div>
            {[
              ["01", "Localize", "Show the homeowner the local water system profile tied to their ZIP code."],
              ["02", "Prioritize", "Rank contaminants by health concern, legal status, and report urgency."],
              ["03", "Transition", "Introduce whole-home filtration as the practical next step, not a hard pitch."],
            ].map(([step, title, text]) => (
              <div key={step} className="relative mb-3 grid grid-cols-[52px_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 last:mb-0">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-300/10 text-sm font-black text-orange-300">{step}</div>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,.12),transparent_35%),linear-gradient(180deg,#020711,#04101e,#020711)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <div className="container relative">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Live demo</p>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Run a real water lookup in seconds.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Enter any US ZIP code and watch the same report engine your customers will see inside AquaReport.
            </p>
          </div>
          <LiveDemo />
        </div>
      </section>

      <section id="coverage" className="relative overflow-hidden border-y border-white/10 bg-white/[0.03] py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_36%,rgba(16,185,129,.1),transparent_30%),radial-gradient(circle_at_70%_70%,rgba(34,211,238,.1),transparent_35%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="container grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-slate-950/80 p-6 shadow-2xl shadow-cyan-950/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_24%,rgba(34,211,238,.14),transparent_25%)]" />
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Nationwide coverage engine</p>
                <p className="text-sm text-slate-500">Coverage proof with a data-platform feel</p>
              </div>
              <TrendingUp className="size-5 text-emerald-300" />
            </div>
            <div className="relative grid gap-3 sm:grid-cols-2">
              {[
                ["Very Large", "100%", "68/68 systems"],
                ["Large", "100%", "417/418 systems"],
                ["Medium", "99%", "4,087/4,127 systems"],
                ["Small", "95%", "14,227/15,023 systems"],
              ].map(([label, value, sub]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-3xl font-black text-cyan-200">{value}</p>
                  <p className="mt-1 font-semibold text-white">{label}</p>
                  <p className="text-sm text-slate-500">{sub}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-5 grid grid-cols-10 gap-1.5">
              {Array.from({ length: 70 }).map((_, index) => (
                <div
                  key={index}
                  className={
                    index % 17 === 0
                      ? "h-7 rounded bg-red-500/75"
                      : index % 11 === 0
                        ? "h-7 rounded bg-orange-400/75"
                        : index % 5 === 0
                          ? "h-7 rounded bg-cyan-300/45"
                          : "h-7 rounded bg-white/[0.06]"
                  }
                />
              ))}
            </div>
          </div>
          <div className="relative">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Coverage</p>
            <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">Every major water system. Every state.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Give every rep the same powerful starting point: local risk data, a polished report, and the confidence to guide the next conversation.
            </p>
            <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
              <p className="text-sm font-semibold text-emerald-200">Built for local selling</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Use coverage data to see where reports are being created, which ZIPs carry the highest risk, and where your team should focus follow-up.</p>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Resources — Pillar Page Links */}      {/* Resources — Pillar Page Links */}
      <section className="relative overflow-hidden border-t border-white/10 bg-white/[0.03] py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_60%,rgba(34,211,238,.08),transparent_30%)]" />
        <div className="container relative">
          <div className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Resources</p>
            <h2 className="text-4xl font-black tracking-tight text-white">Everything You Need to Know</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">Deep-dive guides on how dealer software, digital reports, and water testing tools help you close more sales.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/water-treatment-dealer-software", title: "Dealer Software", desc: "The all-in-one platform for managing your water treatment business." },
              { to: "/water-quality-report-software", title: "Report Software", desc: "Turn raw test data into professional reports in under 2 minutes." },
              { to: "/digital-water-test-reports", title: "Digital Reports", desc: "Replace paper forms with shareable, branded digital reports." },
              { to: "/water-testing-software-for-dealers", title: "Testing Software", desc: "Mobile-first testing tools built for how dealers actually work." },
            ].map((card) => (
              <Link key={card.to} to={card.to} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-300/30 hover:bg-white/[0.06]">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cyan-400">Learn more <ArrowRight className="h-3.5 w-3.5" /></span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/blog" className="text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition">
              Read all articles on our blog →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-white/[0.03] py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_28%,rgba(34,211,238,.1),transparent_30%)]" />
        <div className="container relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">FAQ</p>
            <h2 className="text-4xl font-black tracking-tight text-white">Clear answers for teams selling water filtration.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">The page keeps the practical buyer questions, but matches the product’s new premium visual direction.</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            {homepageFaqs.map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,.16),transparent_34%),linear-gradient(180deg,#020711,#061124)]" />
        <div className="container relative">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(10,22,42,.9),rgba(2,7,17,.98))] px-6 py-14 text-center shadow-2xl shadow-cyan-950/30 md:px-12 md:py-20">
            <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
            <div className="absolute -left-32 -top-32 size-80 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute -bottom-40 right-0 size-96 rounded-full bg-blue-600/15 blur-3xl" />
            <Droplets className="relative mx-auto mb-6 size-12 text-cyan-300" />
            <h2 className="relative mx-auto max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">Give every rep a water report that feels impossible to ignore.</h2>
            <p className="relative mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
              Stop guessing. Start closing. AquaReport puts local water quality data in your team’s hands for every customer, in every ZIP code.
            </p>
            <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="h-13 bg-cyan-300 px-7 text-base font-bold text-slate-950 hover:bg-cyan-200" asChild>
                <Link to="/signup">Get 1 Free Report <ArrowRight className="size-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-13 border-white/15 bg-white/5 px-7 text-base text-white hover:bg-white/10 hover:text-white" asChild>
                <a href="#demo">Try the Demo</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
