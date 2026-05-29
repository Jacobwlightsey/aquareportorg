import { type FormEvent, type ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { faqSchema, breadcrumbSchema, organizationSchema } from "@/lib/schema";
import { ArrowRight, Check, Loader2 } from "lucide-react";
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

/* ─── Pricing FAQs ────────────────────────────────────────────── */
const PRICING_FAQS = [
  {
    question: "Is there a free trial?",
    answer:
      "Yes — every account starts with 1 free premium water quality report, all features unlocked. No credit card required. You only choose a plan when you're ready to scale.",
  },
  {
    question: "Can I switch plans later?",
    answer:
      "Absolutely. Upgrade or downgrade at any time from your dashboard. Changes take effect on your next billing cycle, and you keep access to your current plan until then.",
  },
  {
    question: "What counts as a report?",
    answer:
      "Each water quality report you generate for a customer counts as one report. Draft or test reports you delete before sharing don't count against your limit.",
  },
  {
    question: "Do you offer annual billing?",
    answer:
      "Yes — annual plans save up to 33% compared to monthly billing. All plans are available in both monthly and annual options.",
  },
  {
    question: "What happens if I hit my report limit?",
    answer:
      "You'll get a notification as you approach your limit. You can upgrade your plan instantly or wait until the next billing cycle when your limit resets.",
  },
  {
    question: "Is there an Enterprise option?",
    answer:
      "Yes. Enterprise includes unlimited reports, custom domains, white-label branding, dedicated onboarding, and priority support. Contact us for custom pricing.",
  },
];

/* ─── Reveal animation ────────────────────────────────────────── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.85, ease: [0.22, 0.61, 0.36, 1], delay }}>
      {children}
    </motion.div>
  );
}

/* ─── Plan card ───────────────────────────────────────────────── */
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

/* ─── Enterprise dialog ───────────────────────────────────────── */
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

/* ─── FAQ Accordion ───────────────────────────────────────────── */
function FAQAccordion({ faqs }: { faqs: typeof PRICING_FAQS }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <span className="text-sm font-medium text-white/70 pr-4">{faq.question}</span>
            <span className={`text-white/30 shrink-0 transition-transform duration-200 ${openIndex === i ? "rotate-45" : ""}`}>+</span>
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 -mt-1">
              <p className="text-sm leading-relaxed text-white/35">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRICING PAGE
   ═══════════════════════════════════════════════════════════════ */
export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");

  return (
    <div className="min-h-screen bg-[#080d19] font-[Inter,system-ui,-apple-system,sans-serif] text-white/90" style={{ WebkitFontSmoothing: "antialiased" }}>
      <SEO
        title="Pricing — Water Treatment Dealer Software"
        description="AquaReport plans from $199/mo. Every plan includes a free premium report. No credit card required to start."
        canonical="https://aquareport.org/pricing"
        ogImage="https://aquareport.org/og-image.png"
        schema={[
          organizationSchema,
          breadcrumbSchema([
            { name: "Home", url: "https://aquareport.org" },
            { name: "Pricing", url: "https://aquareport.org/pricing" },
          ]),
          faqSchema(PRICING_FAQS),
        ]}
      />

      {/* ── Nav ── */}
      <header className="border-b border-white/[0.06] bg-[#080d19]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 text-[1rem] font-bold text-white">
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-7 w-auto" width="98" height="28" />
          </Link>
          <nav className="hidden items-center gap-7 text-[0.84rem] text-white/35 md:flex">
            <Link to="/" className="transition-colors hover:text-white/70">Home</Link>
            <Link to="/blog" className="transition-colors hover:text-white/70">Blog</Link>
            <Link to="/water-quality" className="transition-colors hover:text-white/70">Water Quality</Link>
            <Link to="/book-demo" className="transition-colors hover:text-white/70">Book Demo</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-[0.84rem] text-white/40 transition-colors hover:text-white/70">Sign In</Link>
            <Button className="bg-teal-400 text-[#080d19] font-semibold hover:bg-teal-300" size="sm" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-4 md:pt-28 md:pb-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(45,212,191,.08),transparent_50%)]" />
        <div className="mx-auto max-w-[1280px] px-6 relative">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-400/60">Pricing</p>
              <h1 className="mt-4 font-[Sora,system-ui,sans-serif] text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold tracking-tight text-white leading-[1.05]">
                One closed deal pays for the year.
              </h1>
              <p className="mt-4 text-base leading-[1.8] text-white/35">
                Every plan includes a free premium report. No credit card required. Choose a plan when you're ready to scale.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Billing toggle + Cards ── */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="mx-auto max-w-[1280px] px-6 relative">
          <div className="flex items-center justify-center mb-14">
            <div className="inline-flex items-center rounded-full bg-white/[0.03] border border-white/[0.06] p-1 backdrop-blur-sm">
              <button type="button" onClick={() => setBillingCycle("monthly")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${billingCycle === "monthly" ? "bg-white text-[#080d19] shadow-lg" : "text-white/30 hover:text-white/50"}`}>Monthly</button>
              <button type="button" onClick={() => setBillingCycle("annual")} className={`rounded-full px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${billingCycle === "annual" ? "bg-white text-[#080d19] shadow-lg" : "text-white/30 hover:text-white/50"}`}>
                Annual <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">Save 33%</span>
              </button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => <GlowPricingCard key={plan.id} plan={plan} billingCycle={billingCycle} />)}
          </div>
          <Reveal>
            <div className="max-w-5xl mx-auto mt-8 relative group">
              <div className="absolute inset-0 opacity-20 rounded-[24px] pointer-events-none transition-opacity duration-700 group-hover:opacity-30" style={{ background: "linear-gradient(137deg, #2dd4bf 0%, #5eead4 45%, #14b8a6 100%)", filter: "blur(40px)" }} />
              <div className="relative z-10 rounded-[24px] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ border: "1px solid transparent", background: "linear-gradient(#0a101e, #0a101e) padding-box, linear-gradient(137deg, rgba(45,212,191,.2), rgba(20,184,166,.08)) border-box" }}>
                <div><h3 className="text-base font-bold text-white">Enterprise</h3><p className="text-sm text-white/30">Unlimited reports, custom domains, onboarding, and dedicated support.</p></div>
                <EnterpriseContactDialog source="pricing_page">
                  <Button className="border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white shrink-0" variant="outline" size="lg">Contact Us</Button>
                </EnterpriseContactDialog>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <h2 className="text-center font-[Sora,system-ui,sans-serif] text-2xl font-bold text-white mb-10">
              Compare plans
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-5 py-4 text-left text-white/40 font-medium">Feature</th>
                    <th className="px-5 py-4 text-center text-white/60 font-semibold">Starter</th>
                    <th className="px-5 py-4 text-center font-semibold text-teal-400">Growth</th>
                    <th className="px-5 py-4 text-center text-white/60 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {[
                    ["Reports per month", "20", "50", "150+"],
                    ["Team members", "2", "5", "15"],
                    ["Branded reports", "✓", "✓", "✓"],
                    ["AquaScore™ grading", "✓", "✓", "✓"],
                    ["Flipbook sharing", "✓", "✓", "✓"],
                    ["Lead capture", "✓", "✓", "✓"],
                    ["Demo Wizard", "—", "✓", "✓"],
                    ["Live test results", "—", "✓", "✓"],
                    ["AI homeowner summaries", "—", "✓", "✓"],
                    ["Lead analytics", "—", "✓", "✓"],
                    ["White-label branding", "—", "—", "✓"],
                    ["AI sales talking points", "—", "—", "✓"],
                    ["Territory intelligence", "—", "—", "✓"],
                    ["Priority support", "—", "—", "✓"],
                  ].map(([feature, starter, growth, pro]) => (
                    <tr key={feature} className="hover:bg-white/[0.01]">
                      <td className="px-5 py-3 text-white/40">{feature}</td>
                      <td className="px-5 py-3 text-center text-white/30">{starter}</td>
                      <td className="px-5 py-3 text-center text-white/50">{growth}</td>
                      <td className="px-5 py-3 text-center text-white/30">{pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <Reveal>
            <h2 className="text-center font-[Sora,system-ui,sans-serif] text-2xl font-bold text-white mb-10">
              Frequently asked questions
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <FAQAccordion faqs={PRICING_FAQS} />
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="font-[Sora,system-ui,sans-serif] text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold tracking-tight text-white leading-tight">
              Ready to close more deals?
            </h2>
            <p className="mt-4 text-base text-white/35">
              Start with a free premium report. No credit card. No setup fees.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-teal-400 text-[#080d19] font-semibold hover:bg-teal-300 px-8" size="lg" asChild>
                <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 size-4" /></Link>
              </Button>
              <Button className="border-white/[0.08] bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white px-8" variant="outline" size="lg" asChild>
                <Link to="/book-demo">Book a Demo</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-12 mt-8">
        <div className="mx-auto max-w-[1280px] px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-2"><img src="/aquareport-logo.png" alt="AquaReport" className="h-6 w-auto" width="84" height="24" loading="lazy" /></Link>
              <p className="mt-3 text-[0.8rem] leading-relaxed text-white/20">Water intelligence platform and 21-step Demo Wizard for water treatment dealers.</p>
            </div>
            <div>
              <h4 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/20 mb-3">Product</h4>
              <ul className="space-y-2 text-[0.82rem] text-white/25">
                <li><Link to="/" className="transition hover:text-white/50">Home</Link></li>
                <li><Link to="/pricing" className="transition hover:text-white/50">Pricing</Link></li>
                <li><Link to="/book-demo" className="transition hover:text-white/50">Book Demo</Link></li>
                <li><Link to="/signup" className="transition hover:text-white/50">Start Free Trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/20 mb-3">Resources</h4>
              <ul className="space-y-2 text-[0.82rem] text-white/25">
                <li><Link to="/blog" className="transition hover:text-white/50">Blog</Link></li>
                <li><Link to="/water-quality" className="transition hover:text-white/50">Water Quality</Link></li>
                <li><Link to="/learn" className="transition hover:text-white/50">Learn</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[0.75rem] font-semibold uppercase tracking-wider text-white/20 mb-3">Legal</h4>
              <ul className="space-y-2 text-[0.82rem] text-white/25">
                <li><Link to="/privacy" className="transition hover:text-white/50">Privacy</Link></li>
                <li><Link to="/terms" className="transition hover:text-white/50">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/[0.04] pt-6 text-center text-[0.75rem] text-white/15">
            © {new Date().getFullYear()} AquaReport. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
