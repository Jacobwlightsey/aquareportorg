import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
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
  Loader2,
  MapPin,
  Search,
  Shield,
  Smartphone,
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
  utility_info: { utility_name: string; pwsid: string; city: string; state: string; population_served: number; water_source: string };
  total_tested?: number; total_detected?: number; total_above_legal_limit?: number; total_above_health_guideline?: number;
  contaminants: Contaminant[];
}
function contaminantName(c: Contaminant): string { return c.contaminant || c.name || "Unknown contaminant"; }
function isDetectedContaminant(c: Contaminant): boolean { return c.detected !== false && c.detection_status !== "not_detected"; }

/* ═══════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════ */
const WIZARD_PHASES = [
  { num: "01", title: "Personalize", steps: "Steps 1–3", desc: "Intake, branded welcome, and 'what matters most to you?' — the demo adapts from the first tap. The homeowner sees their name, their family, their concerns reflected back.", icon: "user" },
  { num: "02", title: "Diagnose", steps: "Steps 4–8", desc: "Real EPA + utility data, contaminant breakdown, AquaScore reveal, and live on-site testing. Numbers the homeowner can't argue with — because it's their water.", icon: "scan" },
  { num: "03", title: "Emotionalize", steps: "Steps 9–10", desc: "Personalized impact tabs: Family Health, Skin & Hair, Appliances — mapped to their concerns, their test results. This is where 'interesting' becomes 'urgent.'", icon: "heart" },
  { num: "04", title: "Transform", steps: "Steps 11–13", desc: "The system, neighbor trust signals, and a cost comparison of what bad water is already costing them. Reframe the purchase as savings, not expense.", icon: "switch" },
  { num: "05", title: "Justify", steps: "Steps 14–17", desc: "Investment reveal, real-time discounts, three-gauge before/after. The price feels small when stacked against the cost of doing nothing.", icon: "gauge" },
  { num: "06", title: "Decide", steps: "Steps 18–21", desc: "Home Water Plan summary, decision cards, spouse handoff, rep close-out with disposition tracking. No loose ends. No 'let me think about it.'", icon: "check" },
];

const FEATURES: { title: string; desc: string; icon: string }[] = [
  { title: "AquaScore™", desc: "A single 0–100 number that makes water quality instantly visceral. 'Your water is a 28' hits harder than any contaminant chart ever will.", icon: "score" },
  { title: "Concern-Aware Personalization", desc: "Every screen adapts to what the homeowner said they care about. Family health, appliance damage, skin — the demo speaks their language.", icon: "target" },
  { title: "Live Water Testing", desc: "Rep tests on-site, score drops in real time with sound design. They watched it happen. They can't argue with their own tap water.", icon: "test" },
  { title: "Built-In Rep Coaching", desc: "Hidden talking points, objection handling, and concern-aware prompts on every screen. New reps perform like your best closer from day one.", icon: "book" },
  { title: "Neighborhood Trust Signals", desc: "'2,847 homes protected in your area.' City-specific data, neighbor counts, and local certifications that build authority without the rep saying a word.", icon: "check" },
  { title: "Psychological Pricing", desc: "Cost comparison, anticipation reveal, monthly hero number. Price objections evaporate when the math is on screen — in their numbers, for their home.", icon: "dollar" },
  { title: "Save & Resume", desc: "Pause mid-demo, send the spouse a branded review link with the same AquaScore and data. Pick up exactly where you left off. Never lose momentum.", icon: "grid" },
  { title: "White-Label Everything", desc: "Your logo, your colors, your company name on every screen. The homeowner never sees AquaReport — they see you.", icon: "shield" },
  { title: "Full Offline Mode", desc: "Basements, rural homes, dead zones. The demo runs without a single bar of signal. Your rep never skips a beat.", icon: "offline" },
  { title: "Proposals & Close Loop", desc: "Generate branded PDF proposals on the spot. Voice notes, disposition tracking, follow-up workflows — close the loop before you leave the driveway.", icon: "file" },
];

const TESTIMONIALS = [
  { text: "The AquaScore reveal changed the conversation completely. Homeowners stop questioning if they need treatment and start asking which system. Our close rate improved noticeably in the first quarter.", author: "Marcus T.", role: "Dealer Owner", location: "Dallas–Fort Worth, TX", metric: "Improved close rate" },
  { text: "We onboarded new reps and within days they were running demos that looked like they'd been selling for a decade. The coaching prompts do the heavy lifting — the learning curve practically disappears.", author: "Jessica R.", role: "Sales Director", location: "Phoenix, AZ", metric: "Faster onboarding" },
  { text: "The spouse review link changed everything. We used to lose so many deals to 'I need to talk to my husband.' Now they see the same data, same AquaScore. Follow-up conversions improved dramatically.", author: "Derek H.", role: "General Manager", location: "Charlotte, NC", metric: "Fewer lost deals" },
];

const HOMEPAGE_FAQS = [
  { question: "What exactly is the Demo Wizard?", answer: "It's a 21-step guided sales presentation your reps run on a tablet during in-home water consultations. It pulls real EPA data, runs live water tests, reveals an AquaScore, shows personalized health impacts, handles pricing psychology, and coaches your rep through every step — all under your company's branding." },
  { question: "Do I need water testing equipment?", answer: "Not required — the Demo Wizard works with or without live testing. If you have TDS, chlorine, or hardness meters, reps can enter results on-site for a dramatic real-time score drop. Without equipment, the demo still delivers the full AquaScore experience using EPA data alone." },
  { question: "Will it look like AquaReport or my company?", answer: "Your company — 100%. The guided setup wizard lets you set your logo, colors, and name. Every screen the homeowner sees is fully white-labeled under your brand. AquaReport never appears to your customers." },
  { question: "What happens if the wifi is bad?", answer: "Nothing — the demo keeps running. AquaReport works fully offline. Basements, rural homes, dead zones — the app caches everything it needs so your rep never loses momentum." },
  { question: "How fast can new reps start using it?", answer: "Same day. The 21-step flow guides them through every talking point, objection, and transition. Built-in coaching means they don't need to memorize a pitch — the system tells them what to say and when." },
  { question: "Where does the water quality data come from?", answer: "US data comes from EPA's SDWIS database plus EWG health guidelines — covering all 50 states. Canadian data pulls from provincial sources covering 3,413 utilities and 138K contaminant readings across 1,765 FSA codes." },
  { question: "Do you support Canadian dealers?", answer: "Yes — Canada is fully live. Terminology adapts (Province, Postal Code, FSA), standards switch to Health Canada / GCDWQ, and data pulls from our complete Canadian water quality database. Pick your country at onboarding or switch any time." },
  { question: "Can I send the demo to a spouse who wasn't home?", answer: "Absolutely. Save & Resume generates a branded review link. The spouse sees the same AquaScore, same health impacts, same pricing. When they're ready, the rep picks up where they left off." },
  { question: "Does it integrate with my CRM?", answer: "CRM integrations and webhooks are available on paid plans. We support the CRMs water treatment dealers actually use. Enterprise customers get custom integration support with dedicated onboarding." },
];

const PILLAR_RESOURCES = [
  { to: "/water-treatment-dealer-software", title: "The Dealer's Closing Guide", desc: "How modern in-home demos beat clipboards 2-to-1 — and the psychology that makes the difference." },
  { to: "/water-quality-report-software", title: "AquaScore™ Explained", desc: "How we turn EPA contaminant data into a single number every homeowner instantly understands." },
  { to: "/digital-water-test-reports", title: "Rep Onboarding Playbook", desc: "Get a new hire closing in their first week using the built-in coaching system." },
  { to: "/water-testing-software-for-dealers", title: "Beating 'Let Me Think About It'", desc: "The objection-handling sequence inside the Demo Wizard that stops indecision before it starts." },
];

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */
function useMouseGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 25, stiffness: 150 });
  const springY = useSpring(y, { damping: 25, stiffness: 150 });
  useEffect(() => {
    const handler = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [x, y]);
  return { x: springX, y: springY };
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}>
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = "" }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const numericPart = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.replace(/[0-9.].*/g, "");
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (!isInView || isNaN(numericPart)) return;
    const dur = 2000; const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplay(Math.round(numericPart * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, numericPart]);
  if (isNaN(numericPart)) return <span ref={ref}>{value}{suffix}</span>;
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-white">
        <span className="text-[0.95rem] font-medium text-white/80">{question}</span>
        {open ? <ChevronUp className="size-4 shrink-0 text-teal-400/60" /> : <ChevronDown className="size-4 shrink-0 text-white/20" />}
      </button>
      {open && <p className="pb-5 text-sm leading-[1.8] text-white/40">{answer}</p>}
    </div>
  );
}

function FeatureIcon({ icon }: { icon: string }) {
  const cls = "size-4";
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
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-teal-400/70">
      {icons[icon] || <Zap className={cls} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIVE DEMO (ZIP Lookup)
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
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-2xl backdrop-blur md:p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-teal-400/70">
            <Search className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Run a live ZIP lookup</h3>
            <p className="text-[13px] text-white/35">See the same water intelligence your reps use in the field.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="e.g. 29526" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} onKeyDown={(e) => e.key === "Enter" && lookup()} className="h-12 border-white/[0.08] bg-white/[0.03] text-lg text-white placeholder:text-white/20" maxLength={5} />
          <Button onClick={lookup} disabled={loading} size="lg" className="h-12 shrink-0 bg-teal-400 px-7 font-semibold text-[#080d19] hover:bg-teal-300">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Scanning…" : "Lookup Water"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400/80">{error}</p>}
      </div>
      {report && (
        <div ref={resultRef} className="mt-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0f1c] text-white shadow-2xl">
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,.12),transparent_40%)] p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-white/50">
                  <MapPin className="size-3 text-teal-400/60" /> {report.utility_info.city}, {report.utility_info.state}
                </div>
                <h4 className="text-2xl font-bold tracking-tight md:text-3xl">{report.utility_info.utility_name}</h4>
                <p className="mt-1 text-sm text-white/30">{report.utility_info.population_served?.toLocaleString()} people served · {report.utility_info.water_source}</p>
              </div>
              <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-[3px] border-teal-400/40 bg-[#0a0f1c]">
                <span className="text-3xl font-black tracking-tight text-teal-400">{demoScore}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 border-y border-white/[0.06]">
            {([["Tested", report.total_tested ?? report.contaminants.length, "text-teal-300/80"], ["Detected", totalDetected, "text-amber-400/80"], ["Over health", report.total_above_health_guideline ?? overHealth.length, "text-red-400/80"]] as const).map(([label, value, color]) => (
              <div key={label} className="border-r border-white/[0.06] p-4 text-center last:border-r-0">
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/25">{label}</p>
              </div>
            ))}
          </div>
          <div className="p-6">
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">Top concerns</p>
            <div className="space-y-2">
              {detectedContaminants.slice(0, 6).map((c) => (
                <div key={contaminantName(c)} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                  <span className="truncate text-sm font-medium text-white/70">{contaminantName(c)}</span>
                  <span className="shrink-0 font-mono text-sm text-white/30">{c.detected_level} {c.unit}</span>
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
   ENTERPRISE CONTACT DIALOG
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
      <DialogContent className="border-white/[0.08] bg-[#0c1222] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Talk with AquaReport Enterprise</DialogTitle>
          <DialogDescription className="text-white/40">Tell us where to follow up. This request is saved for admin review.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`ent-n-${source}`}>Name</Label><Input id={`ent-n-${source}`} required value={form.name} onChange={(e) => updateField("name", e.target.value)} className="border-white/[0.08] bg-white/[0.03]" /></div>
            <div className="space-y-2"><Label htmlFor={`ent-c-${source}`}>Company</Label><Input id={`ent-c-${source}`} value={form.companyName} onChange={(e) => updateField("companyName", e.target.value)} className="border-white/[0.08] bg-white/[0.03]" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor={`ent-e-${source}`}>Email</Label><Input id={`ent-e-${source}`} required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="border-white/[0.08] bg-white/[0.03]" /></div>
            <div className="space-y-2"><Label htmlFor={`ent-p-${source}`}>Phone</Label><Input id={`ent-p-${source}`} value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="border-white/[0.08] bg-white/[0.03]" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor={`ent-m-${source}`}>What do you need?</Label><Textarea id={`ent-m-${source}`} value={form.message} onChange={(e) => updateField("message", e.target.value)} className="border-white/[0.08] bg-white/[0.03]" placeholder="Team size, territory, launch timeline…" /></div>
          <Button type="submit" disabled={submitting} className="w-full bg-teal-400 font-semibold text-[#080d19] hover:bg-teal-300">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Send Request
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO MOCKUP — Operational Dashboard (Stripe/Linear realism)
   ═══════════════════════════════════════════════════════════════ */
function HeroMockup() {
  const barHeights = useMemo(() => [40,58,45,72,55,80,48,65,85,52,70,90,55,68,78,50,75,60,82,48], []);
  return (
    <motion.div className="relative" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}>
      <div className="absolute -inset-6 rounded-3xl bg-gradient-to-b from-teal-500/[0.07] via-teal-500/[0.02] to-transparent blur-2xl" />
      <div className="relative rounded-2xl border border-white/[0.06] bg-[#0a101e]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-white/[0.04] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5"><span className="size-[9px] rounded-full bg-white/[0.07]" /><span className="size-[9px] rounded-full bg-white/[0.07]" /><span className="size-[9px] rounded-full bg-white/[0.07]" /></div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-white/40"><div className="size-3.5 rounded-[3px] bg-gradient-to-br from-teal-400/80 to-teal-300/80" />PureFlow Water Co.</div>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-white/20">
            <span className="flex items-center gap-1"><span className="size-[5px] rounded-full bg-emerald-400/60" />Live</span>
            <span>Step 6 of 21</span>
            <span className="rounded-[4px] bg-white/[0.04] px-1.5 py-0.5 text-[8px] font-medium text-white/30">AquaScore Reveal</span>
          </div>
        </div>
        <div className="h-[2px] bg-white/[0.02]"><div className="h-full w-[29%] bg-gradient-to-r from-teal-500/80 to-teal-400/60" /></div>

        {/* Main panels */}
        <div className="grid grid-cols-[1.25fr_1fr] divide-x divide-white/[0.04]">
          {/* Left */}
          <div className="p-4 space-y-3">
            {/* AquaScore card — dominant anchor */}
            <div className="relative rounded-xl border border-teal-400/[0.12] bg-white/[0.02] p-3.5">
              <div className="absolute -inset-1 rounded-xl bg-teal-400/[0.03] blur-sm pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20">AquaScore™ · 29526 Conway, SC</span>
                <span className="text-[8px] text-white/15">2m ago</span>
              </div>
              <div className="flex items-end gap-2.5 mb-2.5">
                <span className="font-[Sora,system-ui,sans-serif] text-[3.5rem] font-black leading-none tracking-tight text-teal-400 drop-shadow-[0_0_20px_rgba(45,212,191,0.3)]">28</span>
                <div className="pb-1"><span className="block text-[10px] font-bold text-amber-400/80">AT RISK</span><span className="text-[9px] text-white/15">of 100</span></div>
              </div>
              <div className="relative h-[3px] rounded-full bg-white/[0.03] overflow-hidden mb-1.5">
                <div className="absolute h-full w-[28%] rounded-full bg-gradient-to-r from-red-500/60 via-amber-400/60 to-teal-400/60" />
              </div>
              <div className="flex justify-between text-[8px] text-white/15"><span>At Risk</span><span>Fair</span><span>Good</span><span>Excellent</span></div>
              <div className="mt-2.5 grid grid-cols-4 gap-1.5">
                {([["Family","4 + dog"],["Source","GSW&SA"],["Test","Live+EPA"],["Risk","High"]] as const).map(([l,v]) => (
                  <div key={l} className="rounded-md border border-white/[0.04] bg-white/[0.02] px-1.5 py-1 text-center">
                    <span className="block text-[7px] uppercase tracking-wider text-white/15">{l}</span>
                    <strong className="block text-[9px] font-semibold text-white/50">{v}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* Live test */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20">Live Test</span>
                <span className="flex items-center gap-1 text-[8px] text-emerald-400/50"><span className="size-[4px] rounded-full bg-emerald-400/50 animate-pulse" />On-site</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {([["Cl","3.4","ppm","text-amber-400/70"],["TDS","412","ppm","text-red-400/60"],["GPG","18","gpg","text-amber-400/70"]] as const).map(([label,val,unit,color]) => (
                  <div key={label} className="rounded-md border border-white/[0.04] bg-white/[0.02] p-2 text-center">
                    <span className="block text-[7px] uppercase tracking-wider text-white/15">{label}</span>
                    <strong className={`block text-sm font-bold ${color}`}>{val}</strong>
                    <span className="text-[7px] text-white/15">{unit}</span>
                  </div>
                ))}
              </div>
              {/* Mini chart */}
              <div className="mt-2.5 flex items-end gap-[2px] h-8">
                {barHeights.map((h, i) => (<div key={i} className="flex-1 rounded-t-[1px] bg-teal-400/15 transition-all" style={{ height: `${h}%` }} />))}
              </div>
            </div>
          </div>

          {/* Right — secondary */}
          <div className="p-4 space-y-3 opacity-80">
            {/* Coaching */}
            <div className="rounded-xl border border-amber-400/[0.08] bg-amber-400/[0.02] p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-400/60">Rep Coaching</span>
                <span className="rounded-[3px] bg-white/[0.03] px-1.5 py-[1px] text-[7px] text-white/20">Hidden</span>
              </div>
              <p className="text-[10px] leading-[1.65] text-white/40">"Sarah, your water scored a <span className="font-semibold text-amber-400/70">28</span>. That puts your home in the <span className="font-semibold text-amber-400/70">At Risk</span> tier — let me show you exactly what's in it."</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {["Pause for reaction","Make eye contact","Use family name"].map(t => (<span key={t} className="rounded-[4px] border border-white/[0.04] bg-white/[0.02] px-1.5 py-0.5 text-[8px] text-white/20">{t}</span>))}
              </div>
            </div>
            {/* Contaminants */}
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3.5">
              <span className="block text-[9px] font-semibold uppercase tracking-[0.14em] text-white/20 mb-2">Contaminants Detected</span>
              <div className="space-y-1">
                {([["Chloroform","8.2 ppb","3.1×","text-red-400/60"],["Haloacetic Acids","42.1 ppb","7.0×","text-red-400/60"],["Chromium-6","0.18 ppb","1.8×","text-amber-400/60"],["Nitrate","4.8 ppm","—","text-white/25"],["Barium","0.04 ppm","—","text-white/25"]] as const).map(([name,val,above,color]) => (
                  <div key={name} className="flex items-center justify-between rounded-md border border-white/[0.03] bg-white/[0.01] px-2.5 py-1.5">
                    <span className="text-[10px] font-medium text-white/45">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-white/20">{val}</span>
                      <span className={`text-[9px] font-bold ${color}`}>{above}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* CTA */}
            <button className="w-full rounded-lg bg-gradient-to-r from-teal-500/80 to-teal-400/80 py-2 text-center text-[10px] font-semibold text-[#080d19]">Continue to Impact Analysis →</button>
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-white/15">
              <span className="size-[5px] rounded-full bg-emerald-400/40" /> Offline · Conway, SC · Rep: J. Garcia
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COVERAGE MAP — Animated intelligence infrastructure
   ═══════════════════════════════════════════════════════════════ */
function CoverageMapVisual() {
  const cities: [number, number, string, string?, boolean?][] = [
    [258,112,"ca"],[190,220,"ca","Vancouver",true],[265,186,"ca"],[261,206,"ca","Calgary"],
    [318,197,"ca"],[334,210,"ca"],[392,214,"ca","Winnipeg"],[453,226,"ca"],
    [528,264,"ca","Toronto",true],[557,250,"ca"],[573,249,"ca","Montréal",true],
    [592,239,"ca"],[628,246,"ca"],[651,256,"ca","Halifax"],[735,233,"ca"],
    [197,234,"us","Seattle",true],[194,251,"us"],[196,313,"us","San Francisco",true],
    [229,343,"us","Los Angeles",true],[237,354,"us"],[245,265,"us"],[278,288,"us"],
    [253,325,"us"],[276,348,"us","Phoenix"],[332,297,"us","Denver",true],[320,333,"us"],[321,360,"us"],
    [421,254,"us","Minneapolis"],[419,281,"us"],[411,301,"us"],[389,330,"us"],
    [394,352,"us","Dallas",true],[388,372,"us"],[381,379,"us"],[405,376,"us","Houston"],[446,374,"us"],
    [468,279,"us","Chicago",true],[463,268,"us"],[476,296,"us"],[445,306,"us"],
    [500,276,"us","Detroit"],[510,283,"us"],[501,296,"us"],[524,292,"us"],
    [471,324,"us","Nashville"],[447,333,"us"],[471,346,"us"],[490,344,"us","Atlanta",true],[445,356,"us"],
    [518,333,"us"],[535,328,"us"],[525,352,"us"],[510,372,"us"],[504,391,"us"],[513,386,"us"],[522,408,"us","Miami",true],
    [548,303,"us","DC",true],[555,292,"us"],[562,289,"us"],[571,282,"us","NYC",true],
    [581,275,"us"],[593,270,"us","Boston",true],[599,258,"us"],[544,314,"us"],
    [75,395,"us"],[70,408,"us"],[90,412,"us"],[75,442,"us"],
  ];
  const connections: [number,number,number,number][] = [
    [197,234,332,297],[332,297,468,279],[468,279,571,282],[571,282,593,270],
    [468,279,500,276],[394,352,490,344],[490,344,522,408],[548,303,571,282],
    [190,220,197,234],[528,264,573,249],[229,343,276,348],[421,254,468,279],
    [394,352,405,376],[332,297,421,254],[196,313,229,343],
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#050910]">
      <style>{`
        @keyframes nodePulse { 0%,100% { r: 3.5; opacity: 0.8; } 50% { r: 5; opacity: 1; } }
        @keyframes scanLine { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        .major-node { animation: nodePulse 4s ease-in-out infinite; }
        .major-node:nth-child(odd) { animation-delay: -2s; }
      `}</style>
      <svg viewBox="0 0 800 460" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mapGrid" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="0.4" fill="rgba(45,212,191,0.06)" /></pattern>
          <radialGradient id="usG" cx="55%" cy="68%" r="35%"><stop offset="0%" stopColor="rgba(45,212,191,0.08)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <radialGradient id="caG" cx="55%" cy="30%" r="30%"><stop offset="0%" stopColor="rgba(94,234,212,0.05)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <linearGradient id="scanG" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="transparent" /><stop offset="50%" stopColor="rgba(45,212,191,0.04)" /><stop offset="100%" stopColor="transparent" /></linearGradient>
          <filter id="nodeGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="800" height="460" fill="url(#mapGrid)" />
        <rect width="800" height="460" fill="url(#usG)" />
        <rect width="800" height="460" fill="url(#caG)" />
        {/* Scan line */}
        <rect width="200" height="460" fill="url(#scanG)" style={{ animation: "scanLine 12s linear infinite" }} />
        {/* Connections */}
        {connections.map(([x1,y1,x2,y2], i) => (<line key={`c${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(45,212,191,0.04)" strokeWidth="0.5" />))}
        {/* Alaska inset */}
        <rect x="50" y="378" width="65" height="48" rx="6" fill="none" stroke="rgba(45,212,191,0.05)" strokeWidth="0.5" strokeDasharray="3 3" />
        <text x="53" y="389" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="Inter,system-ui">AK</text>
        <text x="68" y="438" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="Inter,system-ui">HI</text>
        {/* City dots */}
        {cities.map(([x,y,type,label,major], i) => (
          <g key={i}>
            {major && <circle cx={x} cy={y} r={10} fill={type === "us" ? "rgba(45,212,191,0.03)" : "rgba(94,234,212,0.02)"} />}
            <circle className={major ? "major-node" : ""} cx={x} cy={y} r={major ? 3.5 : 1.5} fill={type === "us" ? "rgba(45,212,191,0.75)" : "rgba(94,234,212,0.6)"} filter={major ? "url(#nodeGlow)" : undefined} />
            {label && (<text x={x > 520 ? x - 8 : x + 8} y={y + 3} textAnchor={x > 520 ? "end" : "start"} fill="rgba(255,255,255,0.3)" fontSize={major ? "8.5" : "7.5"} fontFamily="Inter,system-ui">{label}</text>)}
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute left-[48%] top-[36%] -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#080d19]/80 px-3 py-1 backdrop-blur-sm">
        <span className="text-[11px]">🇨🇦</span><span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-teal-300/50">Canada</span>
      </div>
      <div className="pointer-events-none absolute left-[52%] top-[63%] -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#080d19]/80 px-3 py-1 backdrop-blur-sm">
        <span className="text-[11px]">🇺🇸</span><span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-teal-400/50">United States</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRICING
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
  return (
    <motion.div className="relative flex flex-col items-center w-full group mx-auto" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: "easeOut", delay: glow.delay }}>
      <div className="absolute inset-0 opacity-30 rounded-[28px] pointer-events-none transition-opacity duration-700 group-hover:opacity-50" style={{ background: glow.gradient, filter: "blur(50px)" }} />
      {plan.popular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 rounded-full bg-teal-400 px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#080d19] shadow-lg shadow-teal-400/20">Most popular</div>}
      <div className="relative z-10 w-full rounded-[28px] overflow-hidden" style={{ border: "1px solid transparent", background: `linear-gradient(#0a101e, #0a101e) padding-box, ${glow.gradient} border-box` }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${plan.popular ? "rgba(45,212,191,.3)" : "rgba(255,255,255,.06)"}, transparent)` }} />
        <div className="w-full p-7 flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
          <div className="mt-5 mb-1">
            <span className="text-5xl font-black tracking-tight text-white">${displayPrice.toLocaleString()}</span>
            <span className="text-white/25 ml-1 text-sm">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
          </div>
          {billingCycle === "annual" ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-white/25 line-through">${(plan.monthlyPrice * 12).toLocaleString()}/yr</span>
              <span className="inline-flex items-center rounded-full bg-emerald-400/10 border border-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400/80">Save {savingsPercent}%</span>
              <span className="text-xs text-white/20">≈ ${effectiveMonthly}/mo</span>
            </div>
          ) : <div className="mb-4" />}
          <ul className="space-y-3 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-white/40"><Check className="mt-0.5 size-4 shrink-0 text-teal-400/50" /><span>{f}</span></li>
            ))}
          </ul>
          <Button className={plan.popular ? "mt-8 w-full bg-teal-400 text-[#080d19] hover:bg-teal-300 font-semibold" : "mt-8 w-full border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"} variant={plan.popular ? "default" : "outline"} size="lg" asChild>
            <Link to="/signup">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  return (
    <section id="pricing" className="relative overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(45,212,191,.06),transparent_50%)]" />
      <div className="mx-auto max-w-[1280px] px-6 relative">
        <Reveal>
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Pricing</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold tracking-tight text-white leading-[1.05]">One closed deal pays for the year.</h2>
            <p className="mt-4 text-base leading-[1.8] text-white/35">Every plan includes a free premium report. No credit card required. Choose a plan when you're ready to scale.</p>
          </div>
        </Reveal>
        <div className="flex items-center justify-center mb-14">
          <div className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] p-1 backdrop-blur-sm">
            <button type="button" onClick={() => setBillingCycle("monthly")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-white text-[#080d19] shadow-lg" : "text-white/30 hover:text-white/50"}`}>Monthly</button>
            <button type="button" onClick={() => setBillingCycle("annual")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-[#080d19] shadow-lg" : "text-white/30 hover:text-white/50"}`}>
              Annual <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Save 33%</span>
            </button>
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => <GlowPricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />)}
        </div>
        <Reveal>
          <div className="max-w-5xl mx-auto mt-8 relative group">
            <div className="absolute inset-0 opacity-20 rounded-[24px] pointer-events-none transition-opacity duration-700 group-hover:opacity-30" style={{ background: "linear-gradient(137deg, #2dd4bf 0%, #5eead4 45%, #14b8a6 100%)", filter: "blur(40px)" }} />
            <div className="relative z-10 rounded-[24px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ border: "1px solid transparent", background: "linear-gradient(#0a101e, #0a101e) padding-box, linear-gradient(137deg, rgba(45,212,191,.2), rgba(20,184,166,.08)) border-box" }}>
              <div><h3 className="text-base font-bold text-white">Enterprise</h3><p className="text-sm text-white/30">Unlimited reports, custom domains, onboarding, and dedicated support.</p></div>
              <EnterpriseContactDialog source="homepage_pricing">
                <Button className="border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white shrink-0" variant="outline" size="lg">Contact Us</Button>
              </EnterpriseContactDialog>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAV
   ═══════════════════════════════════════════════════════════════ */
function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler); return () => window.removeEventListener("scroll", handler);
  }, []);
  const NAV_LINKS = [
    { href: "#wizard", label: "Demo Wizard" },
    { href: "#features", label: "Features" },
    { href: "#preview", label: "Preview" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-white/[0.06] bg-[#080d19]/90 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2 text-[1rem] font-bold text-white">
          <img src="/aquareport-logo.png" alt="AquaReport" className="h-7 w-auto" />
        </a>
        <nav className="hidden items-center gap-7 text-[0.85rem] text-white/30 md:flex">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="transition-colors hover:text-white/70">{l.label}</a>)}
          <Link to="/blog" className="transition-colors hover:text-white/70">Blog</Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link to="/login" className="text-[0.85rem] text-white/30 transition-colors hover:text-white/70">Sign in</Link>
          <Link to="/signup" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[0.85rem] font-semibold text-[#080d19] transition hover:bg-white/90">Start Free Trial</Link>
        </div>
        <button type="button" className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/50 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#080d19] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => <a key={l.href} href={l.href} className="py-2 text-white/40 transition hover:text-white" onClick={() => setMobileOpen(false)}>{l.label}</a>)}
            <Link to="/blog" className="py-2 text-white/40 transition hover:text-white" onClick={() => setMobileOpen(false)}>Blog</Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
              <Link to="/login" className="py-2 text-white/30 transition hover:text-white">Sign in</Link>
              <Link to="/signup" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#080d19]">Start Free Trial</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}


/* ═══════════════════════════════════════════════════════════════
   AQUASCORE REVEAL — The "holy shit" moment
   ═══════════════════════════════════════════════════════════════ */
function AquaScoreReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.4 });
  const [score, setScore] = useState(100);
  const [phase, setPhase] = useState<"waiting" | "dropping" | "landed" | "recovered">("waiting");

  useEffect(() => {
    if (!isInView) return;
    setPhase("dropping");
    const dur = 2800;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      // Ease-out with a slight bounce at the end
      const eased = p < 0.85
        ? 1 - Math.pow(1 - (p / 0.85), 3)
        : 1 + Math.sin((p - 0.85) / 0.15 * Math.PI) * 0.02;
      const current = Math.round(100 - (100 - 28) * Math.min(eased, 1));
      setScore(current);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setScore(28);
        setPhase("landed");
        // After pause, show recovery
        setTimeout(() => setPhase("recovered"), 2000);
      }
    };
    requestAnimationFrame(tick);
  }, [isInView]);

  const circumference = 2 * Math.PI * 90;
  const progress = score / 100;
  const strokeOffset = circumference * (1 - progress);

  // Color interpolation based on score
  const getScoreColor = (s: number) => {
    if (s > 70) return "rgb(45, 212, 191)"; // teal
    if (s > 50) return "rgb(250, 204, 21)"; // yellow
    if (s > 35) return "rgb(251, 146, 60)"; // orange
    return "rgb(248, 113, 113)"; // red
  };

  const getTierLabel = (s: number) => {
    if (s > 80) return "Excellent";
    if (s > 60) return "Good";
    if (s > 40) return "Fair";
    return "At Risk";
  };

  const currentColor = getScoreColor(score);
  const glowOpacity = phase === "landed" ? 0.25 : phase === "dropping" ? 0.1 : 0.05;

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl">
      <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f1c]/80 p-8 md:p-12 backdrop-blur-xl overflow-hidden relative">
        {/* Ambient glow that shifts color */}
        <div className="absolute inset-0 pointer-events-none transition-all duration-1000" style={{ background: `radial-gradient(circle at 50% 40%, ${currentColor.replace("rgb", "rgba").replace(")", `,${glowOpacity})`)}, transparent 60%)` }} />

        <div className="relative grid gap-10 md:grid-cols-[1fr_1.3fr] items-center">
          {/* Score ring */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
                {/* Background ring */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                {/* Progress ring */}
                <circle
                  cx="100" cy="100" r="90" fill="none"
                  stroke={currentColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  className="transition-all duration-100"
                  style={{ filter: `drop-shadow(0 0 8px ${currentColor})` }}
                />
              </svg>
              {/* Score number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-[Sora,system-ui,sans-serif] text-[4.5rem] font-black leading-none tracking-tight transition-colors duration-300" style={{ color: currentColor }}>{score}</span>
                <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-colors duration-300" style={{ color: currentColor, opacity: 0.7 }}>{getTierLabel(score)}</span>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] uppercase tracking-[0.12em] text-white/20">AquaScore™ · Conway, SC</p>
          </div>

          {/* Narrative */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0 }} animate={phase !== "waiting" ? { opacity: 1 } : {}} transition={{ delay: 0.5, duration: 0.8 }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20">What the homeowner sees</p>
              <p className="mt-2 text-xl font-bold leading-[1.4] text-white md:text-2xl">
                "Sarah, your water scored a <span style={{ color: currentColor }} className="transition-colors duration-300">{score}</span>."
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={phase === "landed" || phase === "recovered" ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.6 }}>
              <p className="text-[0.95rem] leading-[1.8] text-white/35">
                That puts your home in the <span className="font-semibold text-red-400/70">At Risk</span> tier. Chloroform, haloacetic acids, and chromium-6 were all detected above health guidelines.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={phase === "landed" || phase === "recovered" ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8, duration: 0.6 }}>
              <p className="text-[0.85rem] leading-[1.7] text-white/25 italic">
                "Let me show you exactly what that means for your family."
              </p>
              <p className="mt-1 text-[10px] text-white/15">↑ Built-in coaching prompt · visible only to the rep</p>
            </motion.div>

            {/* Before / After */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={phase === "recovered" ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.8 }}>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-white/15">Before testing</span>
                  <span className="block mt-1 font-[Sora,system-ui,sans-serif] text-2xl font-bold text-white/25">—</span>
                  <span className="block text-[9px] text-white/10">Unknown risk</span>
                </div>
                <div className="rounded-xl border border-red-400/[0.15] bg-red-400/[0.03] p-3 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-red-400/40">Revealed</span>
                  <span className="block mt-1 font-[Sora,system-ui,sans-serif] text-2xl font-bold text-red-400/80">28</span>
                  <span className="block text-[9px] text-red-400/30">At Risk</span>
                </div>
                <div className="rounded-xl border border-teal-400/[0.15] bg-teal-400/[0.03] p-3 text-center">
                  <span className="block text-[8px] uppercase tracking-wider text-teal-400/40">With system</span>
                  <span className="block mt-1 font-[Sora,system-ui,sans-serif] text-2xl font-bold text-teal-400/80">93</span>
                  <span className="block text-[9px] text-teal-400/30">Excellent</span>
                </div>
              </div>
              <p className="mt-3 text-center text-[11px] text-white/15">This is the moment they decide. Your rep never has to hard-sell again.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const glow = useMouseGlow();
  return (
    <div className="min-h-screen bg-[#080d19] font-[Inter,system-ui,-apple-system,sans-serif] text-white/90" style={{ WebkitFontSmoothing: "antialiased" }}>
      <SEO title="AquaReport — The Sales Operating System for Water Treatment Dealers" description="21-step Demo Wizard for water treatment dealers. Real water data, live testing, AquaScore™, and built-in rep coaching — designed to help dealers close more in-home consultations." canonical="https://aquareport.org" ogImage="https://aquareport.org/og-image.png" schema={[organizationSchema, softwareAppSchema, websiteSchema, faqSchema(HOMEPAGE_FAQS)]} />

      {/* Mouse-reactive ambient glow */}
      <motion.div className="pointer-events-none fixed inset-0 z-30" style={{ background: `radial-gradient(800px circle at ${glow.x}px ${glow.y}px, rgba(45,212,191,0.03), transparent 40%)` } as never} />

      <LandingNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pb-24 pt-36 md:pt-44 md:pb-32">
        {/* Ambient orbs */}
        <div className="absolute top-[15%] right-[10%] w-[600px] h-[600px] rounded-full bg-teal-500/[0.04] blur-[120px]" style={{ animation: "float 20s ease-in-out infinite" }} />
        <div className="absolute top-[50%] left-[5%] w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px]" style={{ animation: "float 28s ease-in-out infinite reverse" }} />
        <style>{`@keyframes float { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-25px) scale(1.05); } 66% { transform: translate(-20px,15px) scale(0.95); } }`}</style>

        <div className="mx-auto grid max-w-[1280px] items-center gap-16 px-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium text-white/40 backdrop-blur-sm">
              <Droplets className="size-3 text-teal-400/60" /> The operating system for water treatment sales
            </div>
            <h1 className="mt-7 font-[Sora,system-ui,sans-serif] text-[clamp(2.5rem,5.2vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-0.02em]">
              Your reps shouldn't<br />have to sell<br /><span className="bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">without this.</span>
            </h1>
            <p className="mt-7 max-w-[520px] text-[1.05rem] leading-[1.85] text-white/35">
              AquaReport is the 21-step Demo Wizard that runs on a tablet at the kitchen table — real water data, live testing, AquaScore™, and built-in coaching that turns every in-home consultation into a close.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.9rem] font-semibold text-[#080d19] shadow-[0_0_40px_rgba(255,255,255,0.06)] transition hover:bg-white/90">
                <Zap className="size-4" /> Start Free Trial
              </Link>
              <a href="#preview" className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-6 py-3 text-[0.9rem] font-medium text-white/60 transition hover:bg-white/[0.03] hover:text-white/80">
                See It In Action
              </a>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              {([
                [Smartphone, "Tablet-First", "Built for the table"],
                [Zap, "21-Step Flow", "Psychology that closes"],
                [Shield, "White-Label", "Your brand, always"],
                [WifiOff, "Works Offline", "Basements, anywhere"],
              ] as const).map(([Icon, title, sub]) => (
                <div key={title} className="flex items-start gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] text-white/25"><Icon className="size-3.5" /></div>
                  <div><strong className="block text-[0.8rem] font-semibold text-white/60">{title}</strong><span className="block text-[0.75rem] text-white/20">{sub}</span></div>
                </div>
              ))}
            </div>
          </motion.div>
          {/* Right — Mockup */}
          <div className="hidden lg:block"><HeroMockup /></div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="border-y border-white/[0.04] bg-white/[0.01] py-16">
        <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-12 px-6 md:grid-cols-4">
          {([
            ["21", "guided steps", "Psychologically sequenced from rapport to close."],
            ["Higher", "close rates", "Dealers report measurably better results with personalized, data-driven demos."],
            ["<1 day", "rep onboarding", "New hires present like a 10-year veteran."],
            ["100%", "offline ready", "Basements, rural, bad wifi — never miss a sale."],
          ] as const).map(([num, label, desc]) => (
            <Reveal key={label}>
              <div className="text-center">
                <p className="font-[Sora,system-ui,sans-serif] text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold tracking-tight text-white">{num}</p>
                <p className="mt-1.5 text-[0.8rem] font-medium text-white/40">{label}</p>
                <p className="mt-1 text-[0.75rem] leading-relaxed text-white/20">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ DEMO WIZARD — Cinematic Timeline ═══ */}
      <section id="wizard" className="relative py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">The Demo Wizard</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
              21 steps. Psychologically sequenced.<br />
              <span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">Battle-tested at the kitchen table.</span>
            </h2>
            <p className="mt-5 max-w-[600px] text-base leading-[1.85] text-white/30">
              Most demos meander. AquaReport runs your reps through six deliberate phases — building rapport, creating urgency, and handling every objection before it leaves the homeowner's mouth.
            </p>
          </Reveal>

          {/* Timeline */}
          <div className="relative mt-20 ml-6 md:ml-0">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-teal-400/20 via-teal-400/8 to-transparent md:left-6" />
            <div className="space-y-10">
              {WIZARD_PHASES.map((phase, i) => (
                <Reveal key={phase.num} delay={i * 0.08}>
                  <div className="relative pl-16 md:pl-20">
                    <div className="absolute left-0 top-1 flex size-10 items-center justify-center rounded-full border border-white/[0.08] bg-[#0c1222] md:size-12">
                      <span className="font-[Sora,system-ui,sans-serif] text-xs font-bold text-teal-400/50 md:text-sm">{phase.num}</span>
                    </div>
                    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-colors duration-300 hover:border-white/[0.1] md:p-6">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-400/40">{phase.steps}</span>
                      <h3 className="mt-1.5 font-[Sora,system-ui,sans-serif] text-lg font-bold tracking-tight text-white md:text-xl">{phase.title}</h3>
                      <p className="mt-2.5 text-[0.875rem] leading-[1.8] text-white/30">{phase.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-28 md:py-36 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Platform</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
              Every feature exists for one reason:<br />
              <span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">move a homeowner from uncertainty to yes.</span>
            </h2>
            <p className="mt-5 max-w-[600px] text-base leading-[1.85] text-white/30">
              No CRM bloat. No generic templates. Every tool in AquaReport is purpose-built for the kitchen-table demo that closes.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.04}>
                <div className="group rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.025] h-full">
                  <FeatureIcon icon={f.icon} />
                  <h3 className="mt-4 text-[0.9rem] font-semibold tracking-tight text-white">{f.title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-[1.75] text-white/25">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ FULL PLATFORM — Beyond the Demo ═══ */}
      <section className="border-t border-white/[0.04] py-20 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Full Platform</p>
              <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(1.75rem,3.5vw,2.5rem)] font-extrabold leading-[1.08] tracking-tight text-white">
                The Demo Wizard closes deals.<br /><span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">The platform runs your operation.</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              { icon: "📊", title: "Branded Reports", desc: "Professional water quality reports with AquaScore™ grading, contaminant breakdowns, and your company branding. Generate on the spot or send digitally." },
              { icon: "👥", title: "CRM & Lead Tracking", desc: "Every consultation creates a lead record. Track demo status, follow-up schedules, and close dispositions — no separate CRM needed." },
              { icon: "📈", title: "Dealer Analytics", desc: "See close rates by rep, demos per week, average AquaScore by territory. Data-driven management for growing teams." },
              { icon: "🔗", title: "Consumer Portal", desc: "Every homeowner gets a branded link at myaquareport.com to review their water report. Shareable, professional, and always under your brand." },
            ] as const).map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 h-full transition-colors duration-300 hover:border-white/[0.1]">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="mt-3 text-[0.9rem] font-semibold tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-[1.75] text-white/25">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PREVIEW / LIVE DEMO ═══ */}
      <section id="preview" className="py-28 md:py-36 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Try It Live</p>
              <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                Run a real water lookup in seconds.
              </h2>
              <p className="mt-4 text-base leading-[1.8] text-white/30">
                Enter any US ZIP code. See the same report engine your reps will run at the kitchen table.
              </p>
            </div>
          </Reveal>
          <LiveDemo />
        </div>
      </section>


      {/* ═══ AQUASCORE REVEAL — The Unforgettable Moment ═══ */}
      <section className="relative overflow-hidden border-t border-white/[0.04] py-28 md:py-36">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(45,212,191,.05),transparent_50%)]" />
        <div className="mx-auto max-w-[1280px] px-6 relative">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center mb-16">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">The Moment</p>
              <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                This is what changes the conversation.
              </h2>
              <p className="mt-4 text-base leading-[1.8] text-white/30">
                Every demo builds to this single reveal. The homeowner watches their score drop in real time — and suddenly, treatment isn't optional.
              </p>
            </div>
          </Reveal>
          <AquaScoreReveal />
        </div>
      </section>

      {/* ═══ COVERAGE MAP ═══ */}
      <section id="coverage-map" className="border-t border-white/[0.04] py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Infrastructure</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
              Water intelligence infrastructure.<br /><span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">Coast to coast.</span>
            </h2>
            <p className="mt-5 max-w-[600px] text-base leading-[1.85] text-white/30">
              Same AquaScore. Same Demo Wizard. Same dealer tools. Localized water data, regulatory standards, and terminology for every market you sell in.
            </p>
          </Reveal>

          <div className="mt-14 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 md:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-400/40">North America Coverage</p>
                <p className="mt-1 font-[Sora,system-ui,sans-serif] text-lg font-bold text-white">Live in 🇺🇸 US & 🇨🇦 Canada</p>
              </div>
              <div className="flex gap-5 text-[11px] text-white/25">
                <span className="flex items-center gap-1.5"><span className="inline-block size-1.5 rounded-sm bg-teal-400/70" /> US — all 50 states</span>
                <span className="flex items-center gap-1.5"><span className="inline-block size-1.5 rounded-sm bg-teal-300/50" /> Canada — live</span>
              </div>
            </div>
            <CoverageMapVisual />
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {([["50","US States"],["13","Provinces/Terr."],["1,765","FSA Codes"],["138K","Contaminant Readings"]] as const).map(([num, label]) => (
                <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-center">
                  <strong className="block font-[Sora,system-ui,sans-serif] text-xl font-extrabold tracking-tight text-white">{num}</strong>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/20">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Country cards */}
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {([
              { flag: "🇺🇸", name: "United States", sub: "State, ZIP Code, County", badge: "LIVE", details: [["LOOKUP","ZIP code"],["STANDARDS","EPA / MCL + EWG"],["DATA","Full SDWIS database"]], stats: [["50","States"],["EPA","+ EWG"],["SDWIS","Full DB"]] },
              { flag: "🇨🇦", name: "Canada", sub: "Province, Postal Code, FSA", badge: "NOW LIVE", details: [["LOOKUP","Postal code (FSA)"],["STANDARDS","Health Canada / GCDWQ"],["DATA","3,413 utilities"]], stats: [["1,765","FSA"],["3,413","Utilities"],["138K","Readings"]] },
            ] as const).map((c) => (
              <div key={c.name} className="rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div><h3 className="font-[Sora,system-ui,sans-serif] text-lg font-bold text-white">{c.name}</h3><span className="text-[11px] text-white/20">{c.sub}</span></div>
                  </div>
                  <span className="rounded-full border border-teal-400/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-400/60">{c.badge}</span>
                </div>
                <div className="space-y-1.5 text-[0.85rem] text-white/50">
                  {c.details.map(([l,v]) => (<div key={l} className="flex items-center gap-2"><span className="text-[9px] font-semibold uppercase tracking-wider text-white/15 w-16">{l}</span>{v}</div>))}
                </div>
                <div className="mt-4 flex gap-2">
                  {c.stats.map(([v,l]) => (
                    <div key={l} className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-2.5 text-center">
                      <strong className="block font-[Sora,system-ui,sans-serif] text-base font-extrabold text-teal-400/70">{v}</strong>
                      <span className="text-[9px] uppercase tracking-wider text-white/15">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/80 to-teal-300/80">
              <Droplets className="size-4 text-[#080d19]" />
            </div>
            <p className="text-[0.85rem] leading-[1.7] text-white/30">
              <strong className="text-white/60">Shared across both countries:</strong> AquaScore system, dealer dashboard, customer management, 21-step Demo Wizard, marketing generator, PDF export. Pick your country at onboarding — or switch any time.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="border-t border-white/[0.04] py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">From the Field</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
              Early dealer feedback.<br /><span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">Real results from the field.</span>
            </h2>
            <p className="mt-4 text-[0.85rem] text-white/25">From dealers using AquaReport in live consultations.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.author} delay={i * 0.1}>
                <div className="group flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.015] p-6 transition-colors duration-300 hover:border-white/[0.1] h-full">
                  <div className="mb-4 inline-flex self-start items-center rounded-full border border-teal-400/15 bg-teal-400/[0.05] px-2.5 py-0.5 text-[10px] font-bold text-teal-400/60">{t.metric}</div>
                  <p className="flex-1 text-[0.9rem] leading-[1.8] text-white/35">"{t.text}"</p>
                  <div className="mt-5 pt-4 border-t border-white/[0.04]">
                    <p className="text-sm font-semibold text-white/70">{t.author}</p>
                    <p className="text-[0.8rem] text-white/25">{t.role}</p>
                    <p className="text-[0.75rem] text-white/15">{t.location}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <PricingSection />

      {/* ═══ RESOURCES ═══ */}
      <section className="py-28 md:py-36 border-t border-white/[0.04]">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Resources</p>
            <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
              Sell smarter at the <span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">kitchen table.</span>
            </h2>
            <p className="mt-5 max-w-[600px] text-base leading-[1.85] text-white/30">
              Tactical guides for dealer owners and sales managers who want every rep performing like their best closer.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLAR_RESOURCES.map((r, i) => (
              <Reveal key={r.to} delay={i * 0.06}>
                <Link to={r.to} className="group block rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 transition-all duration-300 hover:border-white/[0.1] h-full">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[0.9rem] font-semibold text-white/70 transition group-hover:text-white">{r.title}</h3>
                    <ExternalLink className="size-3.5 shrink-0 text-white/15" />
                  </div>
                  <p className="mt-3 text-[0.8rem] leading-[1.7] text-white/25">{r.desc}</p>
                  <span className="mt-4 inline-block text-[0.8rem] font-medium text-teal-400/50 transition group-hover:text-teal-400/70">Read guide →</span>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/blog" className="text-[0.85rem] font-medium text-teal-400/40 transition hover:text-teal-400/70">Read all articles on our blog →</Link>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="border-t border-white/[0.04] py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">FAQ</p>
              <h2 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.06] tracking-tight text-white">
                Straight answers for <span className="bg-gradient-to-r from-white/60 to-white/25 bg-clip-text text-transparent">dealer owners.</span>
              </h2>
            </div>
          </Reveal>
          <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 shadow-2xl backdrop-blur">
            {HOMEPAGE_FAQS.map((faq, i) => <FAQItem key={i} question={faq.question} answer={faq.answer} />)}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-28 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <Reveal>
            <div className="mx-auto max-w-[860px] rounded-2xl border border-white/[0.06] bg-white/[0.02] px-8 py-16 text-center md:px-12 md:py-20">
              <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.08] tracking-tight text-white">
                Every day without this, your reps<br />are <span className="bg-gradient-to-r from-teal-300 to-teal-400 bg-clip-text text-transparent">under-equipped.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-[520px] text-base leading-[1.8] text-white/30">
                Give every rep the playbook of your best closer. Try the full Demo Wizard free — no credit card, no risk.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-[0.9rem] font-semibold text-[#080d19] shadow-[0_0_40px_rgba(255,255,255,0.06)] transition hover:bg-white/90">
                  <Zap className="size-4" /> Start Free Trial
                </Link>
                <a href="#preview" className="inline-flex items-center gap-2 rounded-full border border-white/[0.1] px-7 py-3 text-[0.9rem] font-medium text-white/60 transition hover:bg-white/[0.03] hover:text-white/80">
                  See It In Action
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/[0.04] py-12">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <a href="/" className="flex items-center gap-2"><img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" /></a>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-white/20">Water intelligence platform and 21-step Demo Wizard for water treatment dealers.</p>
            </div>
            <div>
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Product</h4>
              <ul className="space-y-2 text-[0.8rem] text-white/20">
                <li><a href="#wizard" className="transition hover:text-white/50">Demo Wizard</a></li>
                <li><a href="#features" className="transition hover:text-white/50">Features</a></li>
                <li><a href="#pricing" className="transition hover:text-white/50">Pricing</a></li>
                <li><a href="#coverage-map" className="transition hover:text-white/50">Coverage</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Resources</h4>
              <ul className="space-y-2 text-[0.8rem] text-white/20">
                <li><Link to="/water-treatment-dealer-software" className="transition hover:text-white/50">Dealer Software</Link></li>
                <li><Link to="/water-quality-report-software" className="transition hover:text-white/50">Report Software</Link></li>
                <li><Link to="/digital-water-test-reports" className="transition hover:text-white/50">Digital Reports</Link></li>
                <li><Link to="/water-testing-software-for-dealers" className="transition hover:text-white/50">Testing Software</Link></li>
                <li><Link to="/blog" className="transition hover:text-white/50">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25">Company</h4>
              <ul className="space-y-2 text-[0.8rem] text-white/20">
                <li><Link to="/signup" className="transition hover:text-white/50">Start Free Trial</Link></li>
                <li><Link to="/login" className="transition hover:text-white/50">Sign In</Link></li>
                <li><Link to="/terms" className="transition hover:text-white/50">Terms of Service</Link></li>
                <li><Link to="/privacy" className="transition hover:text-white/50">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/[0.04] pt-6 text-center text-[0.75rem] text-white/10">
            © {new Date().getFullYear()} AquaReport. Water intelligence for filtration teams. Data: EPA SDWIS, EWG, Health Canada GCDWQ.
          </div>
        </div>
      </footer>
    </div>
  );
}
