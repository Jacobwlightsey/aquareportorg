import { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { organizationSchema, softwareAppSchema, websiteSchema, faqSchema } from "@/lib/schema";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Droplets,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Monitor,
  Search,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
  Zap,
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

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
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

function contaminantName(c: Contaminant): string {
  return c.contaminant || c.name || "Unknown contaminant";
}

function isDetectedContaminant(c: Contaminant): boolean {
  return c.detected !== false && c.detection_status !== "not_detected";
}

/* ═══════════════════════════════════════════════════════════════
   DATA — Wizard Phases
   ═══════════════════════════════════════════════════════════════ */
const WIZARD_PHASES = [
  { num: "01", title: "Personalize", steps: "STEPS 1–3", desc: "Intake, branded welcome, and 'what matters most to you?' — the demo adapts from the first tap." },
  { num: "02", title: "Diagnose", steps: "STEPS 4–8", desc: "Real EPA + utility data, contaminant breakdown, AquaScore reveal, and live on-site water testing." },
  { num: "03", title: "Emotionalize", steps: "STEPS 9–10", desc: "Personalized impact tabs: Family Health, Skin & Hair, Appliances — based on their concerns and their test." },
  { num: "04", title: "Transform", steps: "STEPS 11–13", desc: "The system, neighbor trust signals, and a cost comparison of what bad water is already costing them." },
  { num: "05", title: "Justify", steps: "STEPS 14–17", desc: "Investment reveal, real-time discounts, and three-gauge before/after that makes the price feel small." },
  { num: "06", title: "Decide", steps: "STEPS 18–21", desc: "Home Water Plan summary, decision cards, spouse handoff, and rep close-out with disposition tracking." },
];

/* ═══════════════════════════════════════════════════════════════
   DATA — Features
   ═══════════════════════════════════════════════════════════════ */
const FEATURES = [
  { title: "AquaScore™", desc: "Proprietary 0–100 score with dramatic reveal. 'Your water is a 28' hits harder than any contaminant chart.", icon: "score" },
  { title: "Concern-Aware Personalization", desc: "Every screen adapts to what the homeowner cares about. Personalized demos close at 2–3× generic ones.", icon: "target" },
  { title: "Live Water Testing", desc: "Rep tests on-site, score drops in real time with sound. They can't argue with their own test result.", icon: "test" },
  { title: "Built-In Rep Coaching", desc: "Hidden talking points, objection handling, and concern-aware prompts. New reps perform like your best closer.", icon: "book" },
  { title: "Trust & Local Proof", desc: "'We've protected 2,847 homes in Phoenix.' City-specific data, neighbor counts, certifications, reviews.", icon: "check" },
  { title: "Psychological Pricing", desc: "Cost comparison, anticipation reveal, monthly hero number. Price objections drop when the math is on screen.", icon: "dollar" },
  { title: "Save & Resume", desc: "Pause mid-demo, send spouse a review link, pick up exactly where you left off. Never lose a deal again.", icon: "grid" },
  { title: "White-Label Branding", desc: "Your logo, colors, and name throughout. Guided setup wizard configures everything on first sign-in.", icon: "shield" },
  { title: "Works Offline", desc: "Full demo runs without internet. Basements, rural homes, dead zones — the demo never quits.", icon: "offline" },
  { title: "Proposals & Reporting", desc: "PDF proposals on the spot, voice notes, disposition tracking, follow-up workflow. Close the loop.", icon: "file" },
];

/* ═══════════════════════════════════════════════════════════════
   DATA — Testimonials
   ═══════════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  { text: "We replaced clipboards and paper test forms overnight. Close rate jumped within the first month — my reps look like a million-dollar company at the kitchen table.", author: "Marcus T.", role: "Owner, Lone Star Water Solutions" },
  { text: "The AquaScore moment is the whole game. The number drops, the room goes quiet, and the conversation completely changes.", author: "Jessica R.", role: "Sales Manager, Crystal Springs" },
  { text: "Brand-new reps are closing in week one. The coaching prompts and personalized flow do half the selling for them.", author: "Derek H.", role: "Owner, BlueLine Filtration" },
];

/* ═══════════════════════════════════════════════════════════════
   DATA — FAQs
   ═══════════════════════════════════════════════════════════════ */
const HOMEPAGE_FAQS = [
  { question: "What exactly is the Demo Wizard?", answer: "It's a 21-step guided sales presentation your reps run on a tablet during in-home water consultations. It pulls real EPA data, runs live water tests, reveals an AquaScore, shows personalized health impacts, handles pricing psychology, and coaches your rep through every step — all under your company's branding." },
  { question: "Do I need water testing equipment?", answer: "Not required — the Demo Wizard works with or without live testing. If you have TDS, chlorine, or hardness meters, reps can enter results on-site for a dramatic real-time score drop. Without equipment, the demo still delivers the full AquaScore experience using EPA data alone." },
  { question: "Will it look like AquaReport or my company?", answer: "Your company — 100%. The guided setup wizard lets you set your logo, colors, and name. Every screen the homeowner sees is fully white-labeled under your brand. AquaReport never appears to your customers." },
  { question: "What happens if the wifi is bad?", answer: "Nothing — the demo keeps running. AquaReport works fully offline. Basements, rural homes, dead zones — the app caches everything it needs so your rep never loses momentum in the middle of a presentation." },
  { question: "How fast can new reps start using it?", answer: "Same day. The 21-step flow guides them through every talking point, objection, and transition. Built-in rep coaching means they don't need to memorize a pitch — the wizard tells them what to say, when to pause, and how to adapt to each homeowner." },
  { question: "Where does the water quality data come from?", answer: "US data comes from EPA's SDWIS database plus EWG health guidelines — covering all 50 states. Canadian data pulls from provincial sources covering 3,413 utilities and 138K contaminant readings across 1,765 FSA codes." },
  { question: "Do you support Canadian dealers?", answer: "Yes — Canada is now live. The Demo Wizard adapts terminology (Province, Postal Code, FSA), uses Health Canada / GCDWQ standards, and pulls from our full Canadian water quality database. Pick your country at onboarding or switch any time." },
  { question: "Can I send the demo to a spouse who wasn't home?", answer: "Absolutely. Save & Resume lets you pause mid-demo and send a personalized review link to the spouse. They see the same AquaScore, same health impacts, same pricing — branded under your company. When they're ready, the rep picks up exactly where they left off." },
  { question: "Does it integrate with my CRM?", answer: "CRM integrations and webhooks are available on paid plans. We support common CRMs used by water treatment dealers. Enterprise customers get custom integration support with dedicated onboarding." },
];

/* ═══════════════════════════════════════════════════════════════
   DATA — Resources (Pillar Pages)
   ═══════════════════════════════════════════════════════════════ */
const PILLAR_RESOURCES = [
  { to: "/water-treatment-dealer-software", title: "Dealer's Guide to Closing", desc: "How modern in-home demos beat clipboards 2-to-1 — and the psychology behind it." },
  { to: "/water-quality-report-software", title: "AquaScore™ Explained", desc: "How we turn EPA contaminant data into a single number every homeowner instantly understands." },
  { to: "/digital-water-test-reports", title: "Rep Onboarding Playbook", desc: "Get a new rep closing in their first week using AquaReport's built-in coaching prompts." },
  { to: "/water-testing-software-for-dealers", title: "Beating 'Let Me Think'", desc: "The objection-handling sequence inside the Demo Wizard that stops indecision before it starts." },
];

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-medium text-white">{question}</span>
        {open ? <ChevronUp className="size-5 shrink-0 text-teal-300" /> : <ChevronDown className="size-5 shrink-0 text-slate-500" />}
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed text-slate-400">{answer}</p>}
    </div>
  );
}

function FeatureIcon({ icon }: { icon: string }) {
  const cls = "size-5";
  const icons: Record<string, ReactNode> = {
    score: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
    target: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>,
    test: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20 10V7"/><path d="M6 10v8a6 6 0 0 0 12 0v-2"/></svg>,
    book: <BookOpen className={cls} />,
    check: <Check className={cls} />,
    dollar: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    grid: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    shield: <Shield className={cls} />,
    offline: <WifiOff className={cls} />,
    file: <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-teal-400 to-teal-300 text-[#0b1120] shadow-[0_4px_20px_rgba(45,212,191,0.2)]">
      {icons[icon] || <Zap className={cls} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE DEMO (ZIP Lookup — kept from existing)
   ═══════════════════════════════════════════════════════════════ */
function LiveDemo() {
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<WaterReport | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const lookup = useCallback(async () => {
    if (!/^\d{5}$/.test(zip)) { setError("Enter a valid 5-digit ZIP code"); return; }
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await fetch(`${CONVEX_SITE_URL}/api/zip-report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zip }) });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.utility_info?.utility_name) {
        const junk = ["reverse osmosis","how your levels compare","surface water treatment rule","consumer confidence rule","lead and copper rule","total coliform rule","ground water rule","filter backwash","disinfection byproducts rule","enhanced surface water","aircraft drinking water","lead (90th percentile)"];
        const cleanReport = data[0];
        cleanReport.contaminants = cleanReport.contaminants.filter((c: Contaminant) => { const n = contaminantName(c).toLowerCase(); return !junk.some((j) => n.includes(j)); });
        setReport(cleanReport);
      } else { setError("No water system found for that ZIP code. Try another."); }
    } catch { setError("Network error. Please try again."); } finally { setLoading(false); }
  }, [zip]);

  useEffect(() => { if (report && resultRef.current) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" }); }, [report]);

  const detectedContaminants = report?.contaminants.filter(isDetectedContaminant) ?? [];
  const overHealth = detectedContaminants.filter((c) => c.over_health);
  const overLegal = detectedContaminants.filter((c) => c.over_legal);
  const totalDetected = report?.total_detected ?? detectedContaminants.length;
  const demoScore = report ? Math.max(0, Math.min(100, 100 - overHealth.length * 6 - overLegal.length * 12)) : 0;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-2xl border border-teal-400/15 bg-white/[0.04] p-5 shadow-2xl backdrop-blur md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
            <Search className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Run a live ZIP lookup</h3>
            <p className="text-sm text-slate-400">Generate a real local water snapshot your team can use in the sales conversation.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="e.g. 29526" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} onKeyDown={(e) => e.key === "Enter" && lookup()} className="h-13 border-white/10 bg-slate-950/70 text-lg text-white placeholder:text-slate-600" maxLength={5} />
          <Button onClick={lookup} disabled={loading} size="lg" className="h-13 shrink-0 bg-teal-400 px-7 font-bold text-[#0b1120] hover:bg-teal-300">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Scanning..." : "Lookup Water"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>
      {report && (
        <div ref={resultRef} className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 text-white shadow-2xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,.18),transparent_36%)] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                  <MapPin className="size-3 text-teal-300" /> {report.utility_info.city}, {report.utility_info.state}
                </div>
                <h4 className="text-2xl font-bold md:text-3xl">{report.utility_info.utility_name}</h4>
                <p className="mt-1 text-sm text-slate-400">{report.utility_info.population_served?.toLocaleString()} people served – {report.utility_info.water_source}</p>
              </div>
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[10px] border-teal-400/80 bg-slate-900">
                <span className="text-3xl font-black text-teal-200">{demoScore}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-y border-white/10">
            {([["Tested", report.total_tested ?? report.contaminants.length, "text-teal-200"], ["Detected", totalDetected, "text-orange-300"], ["Over health", report.total_above_health_guideline ?? overHealth.length, "text-red-300"]] as const).map(([label, value, color]) => (
              <div key={label} className="border-r border-white/10 p-4 text-center last:border-r-0">
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Top concerns</p>
            <div className="space-y-2.5">
              {detectedContaminants.slice(0, 6).map((c) => (
                <div key={contaminantName(c)} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <span className="truncate text-sm font-medium">{contaminantName(c)}</span>
                  <span className="shrink-0 font-mono text-sm text-slate-300">{c.detected_level} {c.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ENTERPRISE CONTACT DIALOG (kept from existing)
   ═══════════════════════════════════════════════════════════════ */
function EnterpriseContactDialog({ children, source }: { children: ReactNode; source: string }) {
  const submitEnterpriseLead = useMutation(api.leads.submitEnterpriseLead);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", message: "" });
  const updateField = (field: keyof typeof form, value: string) => setForm((c) => ({ ...c, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true);
    try {
      await submitEnterpriseLead({ name: form.name, companyName: form.companyName || undefined, email: form.email, phone: form.phone || undefined, message: form.message || undefined, source });
      toast.success("Enterprise request received. We'll follow up shortly.");
      setForm({ name: "", companyName: "", email: "", phone: "", message: "" }); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send enterprise request"); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-teal-400/20 bg-slate-950 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Talk with AquaReport Enterprise</DialogTitle>
          <DialogDescription>Tell us where to follow up. This request is saved for admin review.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`ent-n-${source}`}>Name</Label><Input id={`ent-n-${source}`} required value={form.name} onChange={(e) => updateField("name", e.target.value)} className="border-white/10 bg-white/[0.04]" /></div>
            <div className="space-y-2"><Label htmlFor={`ent-c-${source}`}>Company</Label><Input id={`ent-c-${source}`} value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} className="border-white/10 bg-white/[0.04]" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`ent-e-${source}`}>Email</Label><Input id={`ent-e-${source}`} required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="border-white/10 bg-white/[0.04]" /></div>
            <div className="space-y-2"><Label htmlFor={`ent-p-${source}`}>Phone</Label><Input id={`ent-p-${source}`} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="border-white/10 bg-white/[0.04]" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor={`ent-m-${source}`}>What do you need?</Label><Textarea id={`ent-m-${source}`} value={form.message} onChange={(e) => updateField("message", e.target.value)} className="border-white/10 bg-white/[0.04]" placeholder="Team size, territory, launch timeline, or integrations..." /></div>
          <Button type="submit" disabled={submitting} className="w-full bg-teal-400 font-bold text-[#0b1120] hover:bg-teal-300">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Send Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO MOCKUP — Demo Wizard Preview Card
   ═══════════════════════════════════════════════════════════════ */
function HeroMockup() {
  return (
    <div className="relative rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-5 shadow-[0_25px_70px_-25px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-semibold text-white">
          <div className="size-6 rounded bg-gradient-to-br from-teal-400 to-teal-300" />
          PureFlow Water Co.
        </div>
        <span className="text-slate-500">· Step 6 of 21 · AquaScore Reveal</span>
      </div>
      {/* Progress dots */}
      <div className="mb-4 flex gap-1">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < 6 ? "bg-teal-400" : "bg-[#1e293b]"}`} />
        ))}
      </div>
      {/* Body */}
      <div className="grid grid-cols-[1.2fr_1fr] gap-3">
        {/* Score card */}
        <div className="rounded-[10px] border border-[#1e293b] bg-[#0f1729] p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">AQUASCORE™ · 29526 CONWAY, SC</p>
          <div className="mb-1 flex items-baseline gap-3">
            <span className="font-[Sora,system-ui,sans-serif] text-5xl font-extrabold text-teal-400">28</span>
            <div>
              <span className="block text-sm font-bold text-amber-400">AT RISK</span>
              <span className="text-xs text-slate-500">out of 100</span>
            </div>
          </div>
          <div className="my-3 h-1.5 overflow-hidden rounded-full bg-[#1e293b]">
            <div className="h-full w-[28%] rounded-full bg-gradient-to-r from-teal-400 to-teal-300" />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>At Risk</span><span>Bronze</span><span>Silver</span><span>Gold</span>
          </div>
          <div className="mt-3 flex gap-2">
            {[["FAMILY","4 + dog"],["SOURCE","GSW&SA"],["TESTED","Live"]].map(([l,v]) => (
              <div key={l} className="flex-1 rounded-md border border-[#1e293b] bg-[#131c2e] px-2 py-1.5 text-center">
                <span className="block text-[9px] uppercase text-slate-500">{l}</span>
                <strong className="block text-xs text-white">{v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* Coaching card */}
          <div className="rounded-[10px] border border-[#1e293b] bg-[#0f1729] p-3">
            <p className="mb-2 text-[10px] font-bold uppercase text-amber-400">💎 REP COACHING <span className="text-slate-500">· HIDDEN FROM HOMEOWNER</span></p>
            <p className="mb-2 text-xs leading-relaxed text-slate-400">"Sarah, your water scored a 28. That puts your home in the <em className="not-italic font-bold text-amber-400">At Risk</em> tier — let me show you exactly what's in it."</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md border border-[#1e293b] bg-[#131c2e] px-2 py-0.5 text-[10px] text-slate-400">Pause for reaction</span>
              <span className="rounded-md border border-[#1e293b] bg-[#131c2e] px-2 py-0.5 text-[10px] text-slate-400">Use family name</span>
            </div>
          </div>
          {/* Live test */}
          <div className="rounded-[10px] border border-[#1e293b] bg-[#0f1729] p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">LIVE TEST RESULT</p>
            <p className="text-[10px] text-slate-500">Chlorine · TDS · Hardness &nbsp; 🔊</p>
            <p className="mt-1 text-xs font-bold text-white">Verified on-site</p>
            <div className="mt-2 flex gap-2">
              {[["Cl","3.4"],["TDS","412"],["GPG","18"]].map(([l,v]) => (
                <div key={l} className="flex-1 rounded-md border border-[#1e293b] bg-[#131c2e] p-2 text-center">
                  <span className="block text-[9px] text-slate-500">{l}</span>
                  <strong className="block text-base text-teal-400">{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <button className="rounded-full bg-gradient-to-r from-teal-400 to-teal-300 px-4 py-2 text-center text-xs font-semibold text-[#0b1120]">Continue to Impact ›</button>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block size-2 rounded-full bg-green-500" /> Live demo · running offline
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRICING SECTION (adapted from existing with new visual feel)
   ═══════════════════════════════════════════════════════════════ */
const PLAN_GLOW: Record<string, { gradient: string; delay: number }> = {
  starter: { gradient: "linear-gradient(137deg, #334155 0%, #64748b 45%, #475569 100%)", delay: 0.1 },
  growth: { gradient: "linear-gradient(137deg, #2dd4bf 0%, #5eead4 40%, #14b8a6 100%)", delay: 0.2 },
  pro: { gradient: "linear-gradient(137deg, #3b82f6 0%, #a5f3fc 45%, #8b5cf6 100%)", delay: 0.3 },
};

function GlowPricingCard({ plan, billingCycle }: { plan: (typeof SUBSCRIPTION_PLANS)[number]; billingCycle: "monthly" | "annual" }) {
  const glow = PLAN_GLOW[plan.id] ?? PLAN_GLOW.starter;
  const displayPrice = billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
  const savingsPercent = Math.round(((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100);
  const effectiveMonthly = Math.round(plan.annualPrice / 12);
  const cardBg = "#0d1420";

  return (
    <motion.div className="relative flex flex-col items-center w-full group mx-auto" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: "easeOut", delay: glow.delay }}>
      <div className="absolute inset-0 opacity-50 rounded-[32px] pointer-events-none transition-opacity duration-500 group-hover:opacity-70" style={{ background: glow.gradient, filter: "blur(50px)" }} />
      {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-teal-400 px-4 py-1 text-xs font-bold text-[#0b1120] shadow-lg shadow-teal-400/30">Most popular</div>}
      <div className="relative z-10 w-full rounded-[32px] overflow-hidden" style={{ border: "2px solid transparent", background: `linear-gradient(${cardBg}, ${cardBg}) padding-box, ${glow.gradient} border-box` }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.popular ? "rgba(45,212,191,.5)" : "rgba(255,255,255,.12)"}, transparent)` }} />
        <div className="w-full p-7 flex flex-col">
          <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
          <div className="mt-5 mb-1">
            <span className="text-5xl font-black text-white">${displayPrice.toLocaleString()}</span>
            <span className="text-slate-500 ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          {billingCycle === "annual" && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500 line-through">${(plan.monthlyPrice * 12).toLocaleString()}/yr</span>
              <span className="inline-flex items-center rounded-full bg-emerald-400/15 border border-emerald-400/25 px-2 py-0.5 text-[11px] font-bold text-emerald-400">Save {savingsPercent}%</span>
              <span className="text-xs text-slate-500">Just ${effectiveMonthly}/mo</span>
            </div>
          )}
          {billingCycle === "monthly" && <div className="mb-4" />}
          <ul className="space-y-3 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-slate-300"><Check className="mt-0.5 size-4 shrink-0 text-emerald-300" /><span>{f}</span></li>
            ))}
          </ul>
          <Button className={plan.popular ? "mt-8 w-full bg-teal-400 text-[#0b1120] hover:bg-teal-300 shadow-lg shadow-teal-400/20" : "mt-8 w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"} variant={plan.popular ? "default" : "outline"} size="lg" asChild>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,.12),transparent_42%)]" />
      <div className="mx-auto max-w-[1280px] px-6 relative">
        <motion.div className="mx-auto mb-8 max-w-3xl text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">Pricing</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-4xl font-extrabold tracking-tight text-white md:text-5xl">One closed deal pays for the year.<br /><span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">Start free.</span></h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">Every account gets 1 premium report free — no credit card needed. Choose a plan when you're ready to scale.</p>
        </motion.div>
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 backdrop-blur-sm">
            <button type="button" onClick={() => setBillingCycle("monthly")} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-lg" : "text-white/50 hover:text-white/80"}`}>Monthly</button>
            <button type="button" onClick={() => setBillingCycle("annual")} className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-slate-900 shadow-lg" : "text-white/50 hover:text-white/80"}`}>
              Annual <span className="rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">Save up to 33%</span>
            </button>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => <GlowPricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />)}
        </div>
        <motion.div className="max-w-5xl mx-auto mt-8 relative group" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.4 }}>
          <div className="absolute inset-0 opacity-30 rounded-[32px] pointer-events-none transition-opacity duration-500 group-hover:opacity-45" style={{ background: "linear-gradient(137deg, #2dd4bf 0%, #5eead4 45%, #14b8a6 100%)", filter: "blur(40px)" }} />
          <div className="relative z-10 rounded-[32px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ border: "2px solid transparent", background: "linear-gradient(#0d1420, #0d1420) padding-box, linear-gradient(137deg, rgba(45,212,191,.35), rgba(20,184,166,.15)) border-box" }}>
            <div><h3 className="text-lg font-bold text-white">Enterprise</h3><p className="text-sm text-slate-400">Unlimited reports, custom domains, onboarding, and dedicated support.</p></div>
            <EnterpriseContactDialog source="homepage_pricing">
              <Button className="border-teal-400/30 bg-teal-400/10 text-teal-100 hover:bg-teal-400/20 hover:text-white shrink-0" variant="outline" size="lg">Contact Us</Button>
            </EnterpriseContactDialog>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════════ */
function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const NAV_LINKS = [
    { href: "#wizard", label: "Demo Wizard" },
    { href: "#features", label: "Features" },
    { href: "#preview", label: "Preview" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(30,41,59,0.5)] bg-[rgba(11,17,32,0.8)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 font-[Sora,system-ui,sans-serif] text-[1.15rem] font-bold text-white">
          <img src="/aquareport-logo.png" alt="AquaReport — Water Quality Report Software for Dealers" className="h-8 w-auto" />
        </a>
        <nav className="hidden items-center gap-8 text-[0.9rem] text-slate-400 md:flex">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="transition hover:text-white">{l.label}</a>)}
          <Link to="/blog" className="transition hover:text-white">Blog</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-[0.9rem] text-slate-400 transition hover:text-white">Sign in</Link>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-300 px-5 py-2 text-sm font-semibold text-[#0b1120] shadow-[0_10px_60px_-10px_rgba(45,212,191,0.35)] transition hover:opacity-90">Start Free Trial</Link>
        </div>
        {/* Mobile hamburger */}
        <button type="button" className="flex size-10 items-center justify-center rounded-lg border border-white/10 text-white md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[#1e293b] bg-[#0b1120] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="py-2 text-slate-300 transition hover:text-white" onClick={() => setMobileOpen(false)}>{l.label}</a>)}
            <Link to="/blog" className="py-2 text-slate-300 transition hover:text-white" onClick={() => setMobileOpen(false)}>Blog</Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-[#1e293b] pt-3">
              <Link to="/login" className="py-2 text-slate-400 transition hover:text-white">Sign in</Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-300 px-5 py-2.5 text-sm font-semibold text-[#0b1120]">Start Free Trial</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1120] font-[Inter,system-ui,-apple-system,sans-serif] text-[#f0f4f8]" style={{ WebkitFontSmoothing: "antialiased" }}>
      <SEO
        title="Demo Wizard That Closes Water Treatment Deals"
        description="21-step kitchen-table Demo Wizard for water treatment dealers. Real water data, live testing, AquaScore™, and built-in rep coaching — close 2–3× more deals at every in-home consultation."
        canonical="https://aquareport.org"
        ogImage="https://aquareport.org/og-image.png"
        schema={[organizationSchema, softwareAppSchema, websiteSchema, faqSchema(HOMEPAGE_FAQS)]}
      />
      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pb-20 pt-40 bg-[radial-gradient(ellipse_80%_60%_at_70%_15%,rgba(20,184,166,0.18),transparent_60%),radial-gradient(ellipse_60%_50%_at_10%_80%,rgba(13,148,136,0.12),transparent_60%)]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 px-6 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/[0.08] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-300">
              <Droplets className="size-3.5" />
              Built for dealers · 🇺🇸 US & 🇨🇦 Canada
            </div>
            <h1 className="mt-6 font-[Sora,system-ui,sans-serif] text-[clamp(2.5rem,5.5vw,4.5rem)] font-extrabold leading-[1.02]">
              Close more deals<br />at every<br /><span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">kitchen table.</span>
            </h1>
            <p className="mt-6 max-w-[540px] text-lg leading-relaxed text-slate-400">
              AquaReport is the 21-step Demo Wizard your reps run on a tablet — real water data, live testing, AquaScore™, and built-in coaching that turns "let me think about it" into "let's get started."
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-300 px-7 py-3 text-[0.95rem] font-semibold text-[#0b1120] shadow-[0_10px_60px_-10px_rgba(45,212,191,0.35)] transition hover:opacity-90">
                <Zap className="size-4" /> Start Free Trial
              </Link>
              <a href="#preview" className="inline-flex items-center gap-2 rounded-full border border-[#1e293b] px-7 py-3 text-[0.95rem] font-semibold text-white transition hover:border-slate-500 hover:bg-white/[0.03]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                See It In Action
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6">
              {[
                { icon: <Smartphone className="size-3.5" />, title: "Tablet First", sub: "Built for in-home demos" },
                { icon: <Zap className="size-3.5" />, title: "21-Step Flow", sub: "Psychology that closes" },
                { icon: <Shield className="size-3.5" />, title: "White-Label", sub: "Your brand throughout" },
                { icon: <WifiOff className="size-3.5" />, title: "Works Offline", sub: "Sell anywhere" },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-[#1e293b] text-slate-400">{f.icon}</div>
                  <div><strong className="block text-[0.85rem] font-semibold text-white">{f.title}</strong><span className="block text-xs text-slate-500">{f.sub}</span></div>
                </div>
              ))}
            </div>
          </div>
          {/* Right — Mockup */}
          <div className="hidden lg:block">
            <HeroMockup />
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="border-y border-[#1e293b] bg-[rgba(19,28,46,0.3)] py-10">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { num: "21", label: "guided steps", desc: "Psychology-based flow from rapport to close." },
            { num: "2–3×", label: "close rate lift", desc: "Personalized demos convert dramatically better." },
            { num: "<1 day", label: "rep onboarding", desc: "New hires present like a 10-year veteran." },
            { num: "100%", label: "offline ready", desc: "Basements, rural, bad wifi — never miss a sale." },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-[Sora,system-ui,sans-serif] text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-white">{s.num}</p>
              <p className="mt-1 text-[0.85rem] text-slate-400">{s.label}</p>
              <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ DEMO WIZARD — 6 PHASES ═══ */}
      <section id="wizard" className="border-t border-[#1e293b] bg-[rgba(19,28,46,0.2)] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">THE DEMO WIZARD</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
            A 21-step kitchen-table flow<br />engineered to <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">close.</span>
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-slate-400">
            Most demos meander. AquaReport runs reps through six deliberate phases — building rapport, creating urgency, and handling every objection before it leaves the homeowner's mouth.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WIZARD_PHASES.map((p) => (
              <div key={p.num} className="rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-7 transition hover:border-teal-400/30">
                <div className="flex items-start justify-between">
                  <span className="font-[Sora,system-ui,sans-serif] text-5xl font-extrabold text-teal-400 opacity-30">{p.num}</span>
                  <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{p.steps}</span>
                </div>
                <h3 className="mt-2 font-[Sora,system-ui,sans-serif] text-xl font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">WHY DEALERS WIN WITH IT</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
            Your best rep's playbook, in<br /><span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">every rep's hands.</span>
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-slate-400">
            Every feature in AquaReport exists for one reason: to make the kitchen-table demo close. No fluff, no generic CRM bloat — just the tools that move a homeowner from "let me think about it" to signed.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-6 transition hover:border-teal-400/30">
                <FeatureIcon icon={f.icon} />
                <h3 className="mt-4 font-[Sora,system-ui,sans-serif] text-base font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-[0.85rem] leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PREVIEW / LIVE DEMO ═══ */}
      <section id="preview" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">TRY IT LIVE</p>
            <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
              Run a real water lookup in <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">seconds.</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              Enter any US ZIP code and watch the same report engine your customers will see inside AquaReport.
            </p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* ═══ COVERAGE MAP ═══ */}
      <section id="coverage-map" className="border-t border-[#1e293b] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">WHERE AQUAREPORT WORKS</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
            Now closing deals in <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">North America.</span>
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-slate-400">
            Same AquaScore. Same Demo Wizard. Same dealer tools. Localized water data, regulatory standards, and terminology for every market you sell in.
          </p>

          {/* Coverage stats card */}
          <div className="mt-12 rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">NORTH AMERICA COVERAGE</p>
                <p className="mt-1 font-[Sora,system-ui,sans-serif] text-xl font-bold text-white">Live in 🇺🇸 US & 🇨🇦 Canada</p>
              </div>
              <div className="flex gap-5 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-teal-400" /> US — all 50 states</span>
                <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-teal-300" /> CA — best coverage</span>
                <span className="flex items-center gap-1.5"><span className="inline-block size-2 rounded-sm bg-slate-400" /> CA — supported</span>
              </div>
            </div>
            {/* Map placeholder */}
            <div className="flex h-64 items-center justify-center rounded-lg bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.08),transparent)]">
              <div className="flex items-center gap-3 text-slate-500">
                <Globe2 className="size-8 text-teal-400/40" />
                <span className="text-lg font-semibold">US & Canada Interactive Coverage</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                ["50", "US States"],
                ["13", "CA Provinces/Terr."],
                ["1,765", "FSA Codes Mapped"],
                ["138K", "Contaminant Readings"],
              ].map(([num, label]) => (
                <div key={label} className="rounded-[10px] border border-[#1e293b] p-4 text-center">
                  <strong className="block font-[Sora,system-ui,sans-serif] text-2xl font-extrabold text-white">{num}</strong>
                  <span className="text-[11px] uppercase tracking-wider text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Country cards */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* US */}
            <div className="rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🇺🇸</span>
                  <div><h3 className="font-[Sora,system-ui,sans-serif] text-xl font-bold text-white">United States</h3><span className="text-xs text-slate-500">State, ZIP Code, County</span></div>
                </div>
                <span className="rounded-full border border-teal-400 px-3 py-1 text-[11px] font-semibold uppercase text-teal-400">LIVE</span>
              </div>
              <div className="space-y-2 text-[0.9rem] text-white">
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">LOOKUP</span> ZIP code</div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">STANDARDS</span> EPA / MCL + EWG health guidelines</div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">DATA SOURCE</span> Full utility database via SDWIS</div>
              </div>
              <div className="mt-5 flex gap-3">
                {[["50","States Covered"],["EPA","+ EWG Data"],["SDWIS","Full DB"]].map(([v,l]) => (
                  <div key={l} className="flex-1 rounded-lg border border-[#1e293b] bg-[#0f1729] p-3 text-center">
                    <strong className="block font-[Sora,system-ui,sans-serif] text-lg font-extrabold text-teal-400">{v}</strong>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* CA */}
            <div className="rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-7">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🇨🇦</span>
                  <div><h3 className="font-[Sora,system-ui,sans-serif] text-xl font-bold text-white">Canada</h3><span className="text-xs text-slate-500">Province, Postal Code, FSA</span></div>
                </div>
                <span className="rounded-full border border-teal-400 px-3 py-1 text-[11px] font-semibold uppercase text-teal-400">NOW LIVE</span>
              </div>
              <div className="space-y-2 text-[0.9rem] text-white">
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">LOOKUP</span> Postal code (FSA)</div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">STANDARDS</span> Health Canada / GCDWQ guidelines</div>
                <div className="flex items-center gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">DATA SOURCE</span> 3,413 utilities · 138K contaminant readings</div>
              </div>
              <div className="mt-5 flex gap-3">
                {[["1,765","FSA Codes"],["3,413","Utilities"],["138K","Readings"]].map(([v,l]) => (
                  <div key={l} className="flex-1 rounded-lg border border-[#1e293b] bg-[#0f1729] p-3 text-center">
                    <strong className="block font-[Sora,system-ui,sans-serif] text-lg font-extrabold text-teal-400">{v}</strong>
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shared features */}
          <div className="mt-6 flex items-center gap-4 rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-300">
              <Droplets className="size-5 text-[#0b1120]" />
            </div>
            <p className="text-[0.9rem] leading-relaxed text-slate-400">
              <strong className="text-white">Shared across both countries:</strong> AquaScore system, dealer dashboard, customer management, 21-step Demo Wizard, marketing & door hanger generator, PDF report export. Pick your country at onboarding — or switch any time from Company Settings.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="border-t border-[#1e293b] bg-[rgba(19,28,46,0.2)] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">DEALERS USING AQUAREPORT</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
            Built by dealers, for the way<br />water <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">actually sells.</span>
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-slate-400">
            The first sales tool built specifically for water treatment dealers — not a generic CRM, not enterprise bloat. A purpose-built closing machine for in-home consultations.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-7">
                <span className="block font-[Sora,system-ui,sans-serif] text-4xl leading-none text-teal-400 opacity-60">❝</span>
                <p className="mt-4 text-[0.95rem] leading-relaxed text-slate-400">"{t.text}"</p>
                <div className="mt-5">
                  <p className="font-semibold text-white">{t.author}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <PricingSection />

      {/* ═══ RESOURCES — Pillar Pages ═══ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">RESOURCES</p>
          <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
            Sell smarter at the <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">kitchen table.</span>
          </h2>
          <p className="mt-5 max-w-[680px] text-lg leading-relaxed text-slate-400">
            Tactical guides for dealer owners and sales managers who want every rep performing like their best closer.
          </p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLAR_RESOURCES.map((r) => (
              <Link key={r.to} to={r.to} className="group rounded-[0.875rem] border border-[#1e293b] bg-[#131c2e] p-6 transition hover:border-teal-400/30">
                <div className="flex items-start justify-between">
                  <h3 className="font-[Sora,system-ui,sans-serif] text-base font-bold text-white transition group-hover:text-teal-300">{r.title}</h3>
                  <ExternalLink className="size-4 shrink-0 text-slate-500" />
                </div>
                <p className="mt-3 text-[0.85rem] leading-relaxed text-slate-400">{r.desc}</p>
                <span className="mt-4 inline-block text-[0.85rem] font-medium text-teal-400">Read guide →</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/blog" className="text-sm font-semibold text-teal-400 transition hover:text-teal-300">Read all articles on our blog →</Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="border-t border-[#1e293b] bg-[rgba(19,28,46,0.2)] py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.1em] text-teal-400">FAQ</p>
            <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] text-white">
              Straight answers for <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">dealer owners.</span>
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white/10 bg-slate-950/70 px-6 shadow-2xl backdrop-blur">
            {HOMEPAGE_FAQS.map((faq, i) => <FAQItem key={i} question={faq.question} answer={faq.answer} />)}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="mx-auto max-w-[860px] rounded-[1.25rem] border border-[#1e293b] bg-[#131c2e] px-8 py-16 text-center shadow-[0_0_80px_rgba(45,212,191,0.05)] md:px-12 md:py-20">
            <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.1] text-white">
              Stop losing deals to <span className="bg-gradient-to-r from-[#e0f7fa] to-teal-400 bg-clip-text text-transparent">"let me think about it."</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[540px] text-base text-slate-400">
              Give every rep the playbook of your best closer. Try the full Demo Wizard free for 14 days — no card, no risk.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-400 to-teal-300 px-7 py-3 text-[0.95rem] font-semibold text-[#0b1120] shadow-[0_10px_60px_-10px_rgba(45,212,191,0.35)] transition hover:opacity-90">
                <Zap className="size-4" /> Start Free Trial
              </Link>
              <a href="#preview" className="inline-flex items-center gap-2 rounded-full border border-[#1e293b] px-7 py-3 text-[0.95rem] font-semibold text-white transition hover:border-slate-500 hover:bg-white/[0.03]">
                See It In Action
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#1e293b] py-12">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <a href="/" className="flex items-center gap-2">
                <img src="/aquareport-logo.png" alt="AquaReport" className="h-7 w-auto" />
              </a>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">Water quality report software and the 21-step Demo Wizard for water treatment dealers.</p>
            </div>
            {/* Product */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#wizard" className="transition hover:text-white">Demo Wizard</a></li>
                <li><a href="#features" className="transition hover:text-white">Features</a></li>
                <li><a href="#pricing" className="transition hover:text-white">Pricing</a></li>
                <li><a href="#coverage-map" className="transition hover:text-white">Coverage</a></li>
              </ul>
            </div>
            {/* Resources */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Resources</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/water-treatment-dealer-software" className="transition hover:text-white">Dealer Software</Link></li>
                <li><Link to="/water-quality-report-software" className="transition hover:text-white">Report Software</Link></li>
                <li><Link to="/digital-water-test-reports" className="transition hover:text-white">Digital Reports</Link></li>
                <li><Link to="/water-testing-software-for-dealers" className="transition hover:text-white">Testing Software</Link></li>
                <li><Link to="/blog" className="transition hover:text-white">Blog</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/signup" className="transition hover:text-white">Start Free Trial</Link></li>
                <li><Link to="/login" className="transition hover:text-white">Sign In</Link></li>
                <li><Link to="/terms" className="transition hover:text-white">Terms of Service</Link></li>
                <li><Link to="/privacy" className="transition hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[#1e293b] pt-6 text-center text-xs text-slate-600">
            © {new Date().getFullYear()} AquaReport. Water intelligence for filtration teams. Data sources: EPA SDWIS, EWG Health Guidelines, Health Canada GCDWQ.
          </div>
        </div>
      </footer>
    </div>
  );
}
