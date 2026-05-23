import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Droplets,
  Lock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseContaminants } from "@/lib/pipeline";
import { hasPlanOverride, upgradeMessage } from "@/lib/planGate";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { computeAquaScore, type FieldWaterReadings } from "@/lib/waterScore";
import { playTapSound } from "@/lib/demoSounds";
import { api } from "../../convex/_generated/api";

// Step components
import { DemoWelcome } from "@/components/demo/DemoWelcome";
import { DemoScoreReveal } from "@/components/demo/DemoScoreReveal";
import { DemoContaminantWalkthrough } from "@/components/demo/DemoContaminantWalkthrough";
import { DemoImpact } from "@/components/demo/DemoImpact";
import { DemoLiveTest } from "@/components/demo/DemoLiveTest";
import { DemoScoreTransform } from "@/components/demo/DemoScoreTransform";
import { DemoSystemInfo } from "@/components/demo/DemoSystemInfo";
import { DemoPricing, type PricingState } from "@/components/demo/DemoPricing";
import { DemoCostComparison } from "@/components/demo/DemoCostComparison";
import { DemoScoreBoost } from "@/components/demo/DemoScoreBoost";
import { DemoCustomerClose } from "@/components/demo/DemoCustomerClose";
import { DemoDealerClose } from "@/components/demo/DemoDealerClose";
import { DemoAssistant } from "@/components/demo/DemoAssistant";
import { EndDemoModal } from "@/components/demo/EndDemoModal";

const STEPS = [
  { key: "welcome",       label: "Welcome",       color: "#3b82f6" },
  { key: "score",          label: "AquaScore",     color: "#10b981" },
  { key: "contaminants",   label: "Contaminants",  color: "#f59e0b" },
  { key: "impact",         label: "Impact",        color: "#f43f5e" },
  { key: "test",           label: "Live Test",     color: "#06b6d4" },
  { key: "transform",      label: "Transform",     color: "#8b5cf6" },
  { key: "system",         label: "System",        color: "#6366f1" },
  { key: "pricing",        label: "Pricing",       color: "#10b981" },
  { key: "comparison",     label: "Compare",       color: "#ec4899" },
  { key: "boost",          label: "Boost",         color: "#f59e0b" },
  { key: "customerClose",  label: "Close",         color: "#22c55e" },
  { key: "dealerClose",    label: "Wrap Up",       color: "#64748b" },
] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-all duration-500"
          style={{
            background:
              i < step
                ? STEPS[i]?.color ?? "#3b82f6"
                : i === step
                  ? `${STEPS[i]?.color ?? "#3b82f6"}80`
                  : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

export function DemoWizardPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const report = useQuery(api.reports.getReport, reportId ? { reportId: reportId as any } : "skip");
  const company = useQuery(api.companies.getMyCompany);
  const { effectivePlan } = useFreeTrial();

  const [currentStep, setCurrentStep] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [demoTimer, setDemoTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // State shared across steps
  const [liveReadings, setLiveReadings] = useState<FieldWaterReadings>({});
  const [pricingState, setPricingState] = useState<PricingState | null>(null);
  const [boostApplied, setBoostApplied] = useState(false);
  const [isCustomerHandOff, setIsCustomerHandOff] = useState(false);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setDemoTimer((t) => t + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Contaminants & score
  const contaminants = useMemo(() => parseContaminants(report?.contaminants), [report?.contaminants]);

  const score = useMemo(() => {
    if (!report) return undefined;
    const readings: FieldWaterReadings = {
      chlorine: liveReadings.chlorine ?? report.chlorine,
      hardness: liveReadings.hardness ?? report.hardness,
      tds: liveReadings.tds ?? report.tds,
      ph: liveReadings.ph ?? report.ph,
    };
    return computeAquaScore(report.waterScore, contaminants, readings);
  }, [report, contaminants, liveReadings]);

  // Projected score: always 94 with whole-home filtration, 99 with RO
  const projectedScore = 94;
  const boostedScore = 99;
  const finalScore = boostApplied ? boostedScore : projectedScore;

  const companyColor = company?.primaryColor || report?.companyColor || "#2563eb";

  const goNext = useCallback(() => { playTapSound(); setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1)); }, []);
  const goBack = useCallback(() => { playTapSound(); setCurrentStep((s) => Math.max(s - 1, 0)); }, []);
  const exitDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(`/customers/${reportId}`);
  }, [navigate, reportId]);

  // Loading
  if (report === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] to-[#111827]">
        <Droplets className="size-12 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] to-[#111827] text-white">
        <AlertTriangle className="mb-4 size-12 text-amber-500/50" />
        <p className="font-semibold">Customer not found</p>
        <button onClick={() => navigate("/customers")} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium">
          Back
        </button>
      </div>
    );
  }

  // Plan gate
  if (!hasPlanOverride(effectivePlan as any, "growth")) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] to-[#111827] text-white">
        <Lock className="mb-4 size-12 text-white/20" />
        <p className="font-semibold text-lg">Demo Wizard</p>
        <p className="mt-2 text-sm text-white/50 max-w-xs text-center">{upgradeMessage("demo_wizard")}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate(`/customers/${reportId}`)} className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors">
            ← Back
          </button>
          <button onClick={() => navigate("/subscription")} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors">
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const stepKey = STEPS[currentStep].key;

  // Customer-facing steps hide the top bar timer etc
  const isCustomerFacing = isCustomerHandOff && stepKey === "customerClose";

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white">
      {/* Top Bar */}
      {!isCustomerFacing && (
        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2 safe-area-top">
          <button
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 active:bg-white/10"
          >
            <ChevronLeft className="size-3.5" />
            Exit
          </button>
          <p className="text-xs font-bold tracking-wider text-white/40">
            {currentStep + 1}/{STEPS.length} — {STEPS[currentStep].label.toUpperCase()}
          </p>
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-white/70">{formatTime(demoTimer)}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {!isCustomerFacing && (
        <div className="shrink-0 px-4 pb-3">
          <ProgressBar step={currentStep} total={STEPS.length} />
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28">
        {stepKey === "welcome" && (
          <DemoWelcome report={report} companyColor={companyColor} onNext={goNext} />
        )}
        {stepKey === "score" && (
          <DemoScoreReveal
            score={score}
            contaminants={contaminants}
            report={report}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {stepKey === "contaminants" && (
          <DemoContaminantWalkthrough contaminants={contaminants} onNext={goNext} onBack={goBack} />
        )}
        {stepKey === "impact" && (
          <DemoImpact onNext={goNext} onBack={goBack} />
        )}
        {stepKey === "test" && (
          <DemoLiveTest
            report={report}
            contaminants={contaminants}
            liveReadings={liveReadings}
            onUpdateReadings={setLiveReadings}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {stepKey === "transform" && (
          <DemoScoreTransform
            score={score ?? 0}
            report={report}
            company={company}
            contaminants={contaminants}
            liveReadings={liveReadings}
            projectedScore={projectedScore ?? score ?? 0}
            onNext={goNext}
          />
        )}
        {stepKey === "system" && (
          <DemoSystemInfo company={company} report={report} onNext={goNext} />
        )}
        {stepKey === "pricing" && (
          <DemoPricing
            company={company}
            onNext={goNext}
            onPricingChange={setPricingState}
            initialState={pricingState}
          />
        )}
        {stepKey === "comparison" && (
          <DemoCostComparison company={company} monthlyPayment={pricingState?.monthlyPayment} onNext={goNext} onBack={goBack} />
        )}
        {stepKey === "boost" && (
          <DemoScoreBoost
            projectedScore={projectedScore ?? score ?? 0}
            boostedScore={boostedScore}
            company={company}
            report={report}
            onBoostApplied={setBoostApplied}
            onNext={goNext}
          />
        )}
        {stepKey === "customerClose" && (
          <DemoCustomerClose
            report={report}
            company={company}
            finalScore={finalScore}
            companyColor={companyColor}
            onEndDemo={() => {
              setIsCustomerHandOff(false);
              goNext(); // → dealerClose
            }}
          />
        )}
        {stepKey === "dealerClose" && (
          <DemoDealerClose
            report={report}
            score={finalScore}
            companyColor={companyColor}
            onEndDemo={exitDemo}
          />
        )}
      </div>

      {/* Bottom nav for middle steps */}
      {!isCustomerFacing && currentStep > 0 && currentStep < STEPS.length - 2 && (
        <div className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pb-4 pt-3 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a] to-transparent safe-area-bottom">
          <button
            onClick={goBack}
            disabled={currentStep === 0}
            className="flex items-center gap-1 rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold disabled:opacity-30 active:bg-white/10"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <button
            onClick={goNext}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold active:scale-[0.97] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${STEPS[currentStep].color}, ${STEPS[Math.min(currentStep + 1, STEPS.length - 1)].color})`,
            }}
          >
            Next <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* AI Assistant */}
      <DemoAssistant
        show={showAssistant}
        onToggle={() => setShowAssistant((s) => !s)}
        report={report}
        contaminants={contaminants}
        currentStep={STEPS[currentStep].key}
      />

      {/* End Demo Modal */}
      {showEndModal && (
        <EndDemoModal
          report={report}
          demoTime={demoTimer}
          onClose={() => setShowEndModal(false)}
          onFinished={exitDemo}
        />
      )}
    </div>
  );
}
