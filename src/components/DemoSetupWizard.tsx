/* ──── First-Time Demo Setup Wizard ────
   8-step guided setup. Left: config inputs. Right: live iframe preview.
   Apple-clean dark theme.
   ──── */

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Sparkles, Upload, X } from "lucide-react";

interface Props {
  company: any;
  onComplete: () => void;
  onSkip: () => void;
}

const COLOR_PRESETS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#06b6d4", "#0ea5e9", "#84cc16"];

const SETUP_STEPS = [
  { title: "Your Brand", intro: "Let's make this yours. Your logo and brand color will appear on every screen your customer sees." },
  { title: "The Welcome", intro: "This is the first thing your customer sees when you start a demo. Set the tone." },
  { title: "Your System", intro: "Tell your customer about the system you're recommending. This shows up after the water analysis." },
  { title: "Pricing & Investment", intro: "Set your pricing. Your rep can still adjust discounts live during the demo — these are the defaults." },
  { title: "Trust & Proof", intro: "Social proof closes deals. Show your customer you're trusted in their neighborhood." },
  { title: "Cost Comparison", intro: "Show homeowners what unfiltered water really costs them every month — then reveal the comparison." },
  { title: "Score Boost (RO)", intro: "The surprise upgrade. A free RO system that pushes their score to near-perfect." },
  { title: "Closing & Outcome", intro: "The handoff. What your customer sees at the end, and the outcome options your rep will log." },
];

const PREVIEW_STEP_MAP: Record<number, string> = {
  0: "welcome",
  1: "welcome",
  2: "system",
  3: "pricing",
  4: "trust",
  5: "comparison",
  6: "boost",
  7: "customerClose",
};

export function DemoSetupWizard({ company, onComplete, onSkip }: Props) {
  const updateDemoConfig = useMutation(api.dealerShared.updateDemoConfig);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const existingConfig = (company as any)?.demoConfig || {};
  const [cfg, setCfg] = useState<Record<string, any>>({
    accentColor: existingConfig.accentColor || "#3b82f6",
    logoUrl: existingConfig.logoUrl || (company as any)?.logoUrl || "",
    welcomeHeadline: existingConfig.welcomeHeadline || "",
    welcomeSubtext: existingConfig.welcomeSubtext || "",
    systemIncludes: existingConfig.systemIncludes || [
      { title: "Carbon Filtration", description: "Reduces chlorine, chemicals, bad taste & odor" },
      { title: "Water Softening", description: "Reduces hardness, scale & protects plumbing" },
      { title: "Sediment Filtration", description: "Reduces dirt, rust, sand & fine particles" },
    ],
    warrantyTitle: existingConfig.warrantyTitle || "20 Year Unlimited Warranty",
    revealPrice: existingConfig.revealPrice || "",
    discountOptions: existingConfig.discountOptions || [
      { id: "today", label: "Same-Day Decision", amount: 500, icon: "⚡" },
      { id: "referral", label: "Referral Credit", amount: 300, icon: "👥" },
    ],
    trustSection: existingConfig.trustSection || {
      installCount: 500,
      installArea: "",
      reviews: [{ name: "Sarah M.", rating: 5, quote: "Best investment we ever made for our home." }],
      certifications: [{ label: "WQA Certified", icon: "🏅" }, { label: "NSF Listed", icon: "✅" }],
    },
    costItems: existingConfig.costItems || [
      { label: "Bottled Water", monthlyCost: 120, enabled: true },
      { label: "Appliance Repairs", monthlyCost: 40, enabled: true },
      { label: "Plumbing Maintenance", monthlyCost: 30, enabled: true },
    ],
    systemCostMonthly: existingConfig.systemCostMonthly || "",
    roSystemName: existingConfig.roSystemName || "Reverse Osmosis System",
    roSystemDescription: existingConfig.roSystemDescription || "",
    roSystemImage: existingConfig.roSystemImage || "",
    boostedScore: existingConfig.boostedScore ?? 99,
    closeHeadline: existingConfig.closeHeadline || "",
    customerCloseSubtext: existingConfig.customerCloseSubtext || "",
    closeOptions: existingConfig.closeOptions || ["Sold — Install Scheduled", "Follow Up Needed", "Not Interested", "No Show"],
  });

  const update = useCallback((patch: Record<string, any>) => {
    setCfg((prev) => ({ ...prev, ...patch }));
  }, []);

  const saveProgress = async (final = false) => {
    setSaving(true);
    try {
      const config: Record<string, any> = { ...existingConfig };
      for (const [k, v] of Object.entries(cfg)) {
        if (Array.isArray(v)) { if (v.length > 0) config[k] = v; }
        else if (v !== "" && v !== undefined && v !== null) config[k] = v;
      }
      if (final) config.demoSetupComplete = true;
      await updateDemoConfig({ config });
      if (final) {
        setIsComplete(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleNext = async () => {
    if (step === SETUP_STEPS.length - 1) {
      await saveProgress(true);
    } else {
      saveProgress(false);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = async () => {
    await saveProgress(false);
    try {
      await updateDemoConfig({ config: { ...existingConfig, ...cfg, demoSetupComplete: true } });
    } catch { /* ignore */ }
    onSkip();
  };

  const accent = cfg.accentColor || "#3b82f6";

  /* ─── Celebration screen ─── */
  if (isComplete) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: "#070B14" }}>
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <span className="text-6xl block">🎉</span>
          <h2 className="text-2xl font-bold text-white">You're All Set!</h2>
          <p className="text-white/50 text-sm max-w-xs mx-auto">Your demo is configured and ready. You can always fine-tune everything in Settings.</p>
          <button
            onClick={onComplete}
            className="mt-6 px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all cursor-pointer hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${accent}, #3b82f6)` }}
          >
            Launch Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "#070B14" }}>
      {/* Card */}
      <div className="w-full max-w-4xl rounded-3xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm font-medium">Step {step + 1} of {SETUP_STEPS.length}</span>
            <div className="flex gap-1">
              {SETUP_STEPS.map((_, i) => (
                <div key={i} className="h-1.5 w-6 rounded-full transition-all duration-300" style={{ backgroundColor: i <= step ? accent : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>
          <button onClick={handleSkip} className="text-white/40 hover:text-white/70 text-sm transition-colors cursor-pointer">
            Skip Setup →
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left: Configure */}
          <div className="p-6 md:p-8 space-y-5 overflow-y-auto max-h-[70vh]">
            <div>
              <h2 className="text-xl font-bold text-white">{SETUP_STEPS[step].title}</h2>
              <p className="text-sm text-white/50 mt-1">{SETUP_STEPS[step].intro}</p>
            </div>
            {step === 0 && <BrandStep cfg={cfg} update={update} accent={accent} />}
            {step === 1 && <WelcomeStep cfg={cfg} update={update} />}
            {step === 2 && <SystemStep cfg={cfg} update={update} />}
            {step === 3 && <PricingStep cfg={cfg} update={update} />}
            {step === 4 && <TrustStep cfg={cfg} update={update} />}
            {step === 5 && <CostStep cfg={cfg} update={update} />}
            {step === 6 && <BoostStep cfg={cfg} update={update} />}
            {step === 7 && <ClosingStep cfg={cfg} update={update} />}
          </div>

          {/* Right: Live Preview iframe */}
          <div className="hidden md:flex items-center justify-center p-8" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
            <div className="relative">
              <div
                className="w-[280px] rounded-[2.5rem] overflow-hidden relative"
                style={{ aspectRatio: "9/19.5", border: "4px solid rgba(255,255,255,0.08)", backgroundColor: "#070B14" }}
              >
                {/* Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full z-10" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
                {/* Live iframe */}
                <iframe
                  src={`/demo/preview?step=${PREVIEW_STEP_MAP[step]}&brand=${encodeURIComponent(accent)}`}
                  className="w-full h-full border-0 pointer-events-none"
                  title="Demo Preview"
                  style={{ borderRadius: "2.2rem" }}
                />
              </div>
              <p className="text-center text-white/30 text-[10px] mt-3">Live preview of your demo</p>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white/90 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${accent}, #3b82f6)`, boxShadow: `0 4px 14px ${accent}40` }}
          >
            {step === SETUP_STEPS.length - 1 ? (
              <><Sparkles className="size-4" /> Finish Setup</>
            ) : (
              <>Next Step <ChevronRight className="size-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Step Components — Apple-clean styling ─────────────────────── */

function StepLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1.5 block">{children}</label>;
}

function StepInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:border-white/20 focus:outline-none transition-colors placeholder:text-white/20"
    />
  );
}

function StepTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm text-white bg-white/[0.04] border border-white/[0.08] focus:border-white/20 focus:outline-none transition-colors resize-none placeholder:text-white/20"
    />
  );
}

function BrandStep({ cfg, update, accent }: { cfg: any; update: (p: any) => void; accent: string }) {
  const readImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 15_000_000) { toast.error("Image must be under 15MB"); return; }
    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: String(reader.result || "") });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Logo upload */}
      <div>
        <StepLabel>Company Logo</StepLabel>
        <div className="flex items-center gap-4 mt-1">
          {cfg.logoUrl ? (
            <div className="relative">
              <img src={cfg.logoUrl} alt="Logo" className="h-14 max-w-[140px] object-contain rounded-xl border border-white/10 p-2" />
              <button onClick={() => update({ logoUrl: "" })} className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs cursor-pointer hover:scale-110 transition-transform">
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 text-white/40 text-sm hover:bg-white/[0.03] transition-colors cursor-pointer">
              <Upload className="size-4" /> Upload logo
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) readImageFile(f); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <StepLabel>Brand Color</StepLabel>
        <div className="flex flex-wrap gap-2 mt-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => update({ accentColor: c })}
              className={`size-9 rounded-xl transition-all cursor-pointer ${accent === c ? "ring-2 ring-offset-2 ring-offset-[#070B14] ring-blue-400 scale-110" : "hover:scale-105"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input type="color" value={accent} onChange={(e) => update({ accentColor: e.target.value })} className="w-9 h-9 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
          <span className="text-xs text-white/30">Custom color</span>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>Welcome Headline</StepLabel><StepInput value={cfg.welcomeHeadline} placeholder="Your Water Quality Report" onChange={(e) => update({ welcomeHeadline: e.target.value })} /></div>
      <div><StepLabel>Subtext</StepLabel><StepTextarea value={cfg.welcomeSubtext} placeholder="Let's look at what's in your water..." onChange={(e) => update({ welcomeSubtext: e.target.value })} rows={3} /></div>
    </div>
  );
}

function SystemStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>Warranty Title</StepLabel><StepInput value={cfg.warrantyTitle} placeholder="20 Year Unlimited Warranty" onChange={(e) => update({ warrantyTitle: e.target.value })} /></div>
      <div><StepLabel>System Includes ({cfg.systemIncludes?.length || 0} items)</StepLabel><p className="text-xs text-white/30 mt-1">Customize the full list later in Settings.</p></div>
    </div>
  );
}

function PricingStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>System Price</StepLabel><StepInput type="number" value={cfg.revealPrice || ""} placeholder="e.g. 9995" onChange={(e) => update({ revealPrice: Number(e.target.value) || undefined })} /></div>
      <div><StepLabel>Discounts ({cfg.discountOptions?.length || 0})</StepLabel><p className="text-xs text-white/30 mt-1">Pre-configured discounts your rep can toggle live. Edit in Settings later.</p></div>
    </div>
  );
}

function TrustStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  const trust = cfg.trustSection || {};
  const updateTrust = (patch: any) => update({ trustSection: { ...trust, ...patch } });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><StepLabel>Install Count</StepLabel><StepInput type="number" value={trust.installCount ?? 500} onChange={(e) => updateTrust({ installCount: Number(e.target.value) })} /></div>
        <div><StepLabel>Install Area</StepLabel><StepInput value={trust.installArea || ""} placeholder="Phoenix, AZ" onChange={(e) => updateTrust({ installArea: e.target.value })} /></div>
      </div>
      <p className="text-xs text-white/30">Reviews and certifications can be added in Settings.</p>
    </div>
  );
}

function CostStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>Your System Monthly Cost</StepLabel><StepInput type="number" value={cfg.systemCostMonthly || ""} placeholder="e.g. 49" onChange={(e) => update({ systemCostMonthly: Number(e.target.value) || undefined })} /></div>
      <div><StepLabel>Expense Items ({cfg.costItems?.length || 0})</StepLabel><p className="text-xs text-white/30 mt-1">Pre-configured monthly expenses. Customize in Settings.</p></div>
    </div>
  );
}

function BoostStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>RO System Name</StepLabel><StepInput value={cfg.roSystemName} placeholder="Reverse Osmosis System" onChange={(e) => update({ roSystemName: e.target.value })} /></div>
      <div><StepLabel>Description</StepLabel><StepTextarea value={cfg.roSystemDescription} placeholder="A premium under-sink RO system..." onChange={(e) => update({ roSystemDescription: e.target.value })} rows={3} /></div>
      <div><StepLabel>Boosted Score</StepLabel><StepInput type="number" value={cfg.boostedScore ?? 99} placeholder="99" onChange={(e) => update({ boostedScore: Number(e.target.value) })} /></div>
    </div>
  );
}

function ClosingStep({ cfg, update }: { cfg: any; update: (p: any) => void }) {
  return (
    <div className="space-y-4">
      <div><StepLabel>Close Headline</StepLabel><StepInput value={cfg.closeHeadline} placeholder="Thank You, {firstName}!" onChange={(e) => update({ closeHeadline: e.target.value })} /></div>
      <div><StepLabel>Close Subtext</StepLabel><StepTextarea value={cfg.customerCloseSubtext} placeholder="We're excited to help you achieve cleaner, safer water..." onChange={(e) => update({ customerCloseSubtext: e.target.value })} rows={2} /></div>
    </div>
  );
}
