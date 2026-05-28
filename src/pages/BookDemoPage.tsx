/**
 * Book Demo Landing Page — Public page for dealer lead capture.
 * Accessible at /book-demo and /book-demo/:slug (tracked links).
 * Designed for Facebook ad traffic — conversion-optimized.
 */
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Droplets,
  Loader2,
  Play,
  Rocket,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const COMPANY_SIZES = [
  { value: "solo", label: "Just me" },
  { value: "2-5", label: "2–5 reps" },
  { value: "6-15", label: "6–15 reps" },
  { value: "16-50", label: "16–50 reps" },
  { value: "50+", label: "50+ reps" },
];

const FEATURES = [
  {
    icon: Droplets,
    title: "Branded Water Reports",
    desc: "Generate beautiful, interactive water quality reports using EPA & Health Canada data — in under 60 seconds.",
  },
  {
    icon: Play,
    title: "21-Step Demo Flow",
    desc: "Walk homeowners through a psychology-driven presentation that dramatically boosts close rates.",
  },
  {
    icon: BarChart3,
    title: "Full Sales Pipeline",
    desc: "Track every lead from first contact to closed deal. Automated follow-ups, proposals, and scheduling.",
  },
  {
    icon: Users,
    title: "Team Management",
    desc: "Assign territories, track rep performance, and manage your entire sales team from one dashboard.",
  },
  {
    icon: Shield,
    title: "Compliance Built-In",
    desc: "Consent management, data retention policies, and audit logs to keep your dealership compliant.",
  },
  {
    icon: Zap,
    title: "AI-Powered Marketing",
    desc: "Auto-generate social posts, door hangers, competitor comparisons, and review campaigns.",
  },
];

const TESTIMONIALS = [
  {
    quote: "AquaReport completely changed how we present water quality to homeowners. Our close rate went from 30% to over 60%.",
    name: "Regional Sales Manager",
    company: "Water Treatment Dealer",
  },
  {
    quote: "The demo flow is incredible. Homeowners are genuinely shocked when they see their water data presented this way.",
    name: "Owner/Operator",
    company: "Filtration Company",
  },
  {
    quote: "We used to spend hours making reports manually. Now each rep generates 10+ reports per day. Game-changer.",
    name: "Sales Director",
    company: "Multi-Location Dealer",
  },
];

export function BookDemoPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const trackingLink = useQuery(
    api.dealerLeads.resolveTrackingLink,
    slug ? { slug } : "skip"
  );
  const submitLead = useMutation(api.dealerLeads.submitDealerLead);
  const recordClick = useMutation(api.dealerLeads.recordClick);
  const clickRecorded = useRef(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    companySize: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Record click on mount
  useEffect(() => {
    if (slug && !clickRecorded.current) {
      clickRecorded.current = true;
      recordClick({ slug }).catch(() => {});
    }
  }, [slug, recordClick]);

  // Collect UTM params from URL
  const utmSource = searchParams.get("utm_source") || trackingLink?.utmSource || undefined;
  const utmMedium = searchParams.get("utm_medium") || trackingLink?.utmMedium || undefined;
  const utmCampaign = searchParams.get("utm_campaign") || trackingLink?.utmCampaign || undefined;
  const utmContent = searchParams.get("utm_content") || trackingLink?.utmContent || undefined;
  const utmTerm = searchParams.get("utm_term") || trackingLink?.utmTerm || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSubmitting(true);
    try {
      await submitLead({
        ...form,
        companySize: form.companySize || undefined,
        phone: form.phone || undefined,
        companyName: form.companyName || undefined,
        message: form.message || undefined,
        trackingSlug: slug || undefined,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        referrer: document.referrer || undefined,
        landingPage: window.location.href,
      });
      setSubmitted(true);
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Droplets className="size-7 text-cyan-400" />
            <span className="text-lg font-black tracking-tight">AquaReport</span>
          </div>
          <a
            href="#book-demo"
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-bold text-white hover:bg-cyan-400 transition-colors"
          >
            Book a Demo
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-400">
              <Rocket className="size-3.5" />
              The Sales OS for Modern Water Dealers
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight">
              Close More Deals at the{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                Kitchen Table
              </span>
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-lg">
              AquaReport gives your sales team branded water quality reports, a proven 21-step
              demo flow, and a full CRM — purpose-built for water treatment dealers.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#book-demo"
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-8 py-3.5 text-base font-bold hover:bg-cyan-400 transition-colors"
              >
                Book a Free Demo
                <ArrowRight className="size-4" />
              </a>
              <a
                href="https://aquareport.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40 pt-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-emerald-400" /> Free 14-day trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-emerald-400" /> No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-emerald-400" /> Setup in 5 min
              </span>
            </div>
          </div>

          {/* Stats / Social Proof */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-3xl font-black text-cyan-400">21</p>
                <p className="text-xs text-white/40 mt-1">Step Demo Flow</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-3xl font-black text-emerald-400">60s</p>
                <p className="text-xs text-white/40 mt-1">Report Generation</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-3xl font-black text-amber-400">2x</p>
                <p className="text-xs text-white/40 mt-1">Close Rate Increase</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="text-3xl font-black text-purple-400">150k+</p>
                <p className="text-xs text-white/40 mt-1">Utilities Covered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-white/5">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black">Everything Your Dealership Needs</h2>
          <p className="text-white/50 mt-2 max-w-xl mx-auto">
            From lead generation to close — one platform for your entire sales operation.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3 hover:border-cyan-500/30 transition-colors"
            >
              <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <f.icon className="size-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-6 py-16 border-t border-white/5">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black">What Dealers Are Saying</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className="size-4 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-white/40">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Form */}
      <section
        id="book-demo"
        className="mx-auto max-w-6xl px-6 py-16 border-t border-white/5"
      >
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-black">
              See AquaReport in Action
            </h2>
            <p className="text-white/50 leading-relaxed">
              Book a free 20-minute demo and we'll show you how AquaReport can transform
              your dealership's sales process. We'll walk through the full platform using
              your actual service area data.
            </p>
            <div className="space-y-3">
              {[
                "Live water report generation for your ZIP codes",
                "Full 21-step demo presentation walkthrough",
                "Pipeline, follow-ups, and marketing tools",
                "Pricing and plans tailored to your team size",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle className="size-4 text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center space-y-4">
              <CheckCircle className="size-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold">You're on the list!</h3>
              <p className="text-sm text-white/60">
                We'll reach out within 24 hours to schedule your personalized demo.
                Check your email for a confirmation.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4"
            >
              <h3 className="text-lg font-bold mb-2">Book Your Free Demo</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/20 focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/20 focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="john@waterco.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/20 focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/50">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/20 focus:border-cyan-500 focus:outline-none transition-colors"
                    placeholder="ABC Water Treatment"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  Team Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMPANY_SIZES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateField("companySize", s.value)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                        form.companySize === s.value
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                          : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/50">
                  Anything specific you want to see?
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm placeholder:text-white/20 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                  placeholder="e.g., territory mapping, team features, integration with our CRM..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !form.name || !form.email}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3.5 text-base font-bold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    Book My Free Demo
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-white/30 text-center">
                No spam. We'll only contact you about your demo. Unsubscribe anytime.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-xs text-white/30">
          <div className="flex items-center gap-2">
            <Droplets className="size-4 text-cyan-400/40" />
            <span>© {new Date().getFullYear()} AquaReport</span>
          </div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-white/50 transition-colors">
              Privacy
            </a>
            <a href="/terms" className="hover:text-white/50 transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
