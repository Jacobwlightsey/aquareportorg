import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Clock,
  Droplets,
  Lock,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseContaminants } from "@/lib/pipeline";
import { hasDemoWizard, upgradeMessage } from "@/lib/planGate";
import { computeAquaScore, type FieldWaterReadings } from "@/lib/waterScore";
import { api } from "../../convex/_generated/api";
import { DemoCustomerStep } from "@/components/demo/DemoCustomerStep";
import { DemoContaminantWalkthrough } from "@/components/demo/DemoContaminantWalkthrough";
import { DemoScoreReveal } from "@/components/demo/DemoScoreReveal";
import { DemoSolution } from "@/components/demo/DemoSolution";
import { DemoLiveTest } from "@/components/demo/DemoLiveTest";
import { DemoCostComparison } from "@/components/demo/DemoCostComparison";
import { DemoNextSteps } from "@/components/demo/DemoNextSteps";
import { DemoAssistant } from "@/components/demo/DemoAssistant";
import { EndDemoModal } from "@/components/demo/EndDemoModal";

const STEPS = [
  { key: "customer", label: "Customer", color: "#3b82f6" },
  { key: "contaminants", label: "Your Water", color: "#f59e0b" },
  { key: "score", label: "AquaScore", color: "#10b981" },
  { key: "solution", label: "Solution", color: "#8b5cf6" },
  { key: "test", label: "Live Test", color: "#06b6d4" },
  { key: "comparison", label: "Compare", color: "#ec4899" },
  { key: "next", label: "Next Steps", color: "#22c55e" },
] as const;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1">
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

function scoreTier(score?: number) {
  const s = score ?? 0;
  if (s >= 80) return { label: "Gold", className: "border-amber-400/40 bg-amber-400/10 text-amber-200" };
  if (s >= 60) return { label: "Silver", className: "border-slate-300/40 bg-slate-300/10 text-slate-100" };
  if (s >= 40) return { label: "Bronze", className: "border-orange-400/40 bg-orange-400/10 text-orange-200" };
  return { label: "At Risk", className: "border-rose-400/40 bg-rose-500/10 text-rose-200" };
}

export function DemoWizardPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const report = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as any } : "skip"
  );
  const company = useQuery(api.companies.getMyCompany);

  const [currentStep, setCurrentStep] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [demoTimer, setDemoTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live test readings (mutable during demo)
  const [liveReadings, setLiveReadings] = useState<FieldWaterReadings>({});
  // Start timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDemoTimer((t) => t + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const contaminants = useMemo(
    () => parseContaminants(report?.contaminants),
    [report?.contaminants]
  );

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
  const tier = scoreTier(score);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const exitDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(`/customers/${reportId}`);
  }, [navigate, reportId]);

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
        <button
          onClick={() => navigate("/customers")}
          className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium"
        >
          Back
        </button>
      </div>
    );
  }

  // Plan gate — Demo Wizard requires Growth plan or above
  if (!hasDemoWizard(company)) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] to-[#111827] text-white">
        <Lock className="mb-4 size-12 text-white/20" />
        <p className="font-semibold text-lg">Demo Wizard</p>
        <p className="mt-2 text-sm text-white/50 max-w-xs text-center">
          {upgradeMessage("demo_wizard")}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/customers/${reportId}`)}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate("/subscription")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-500 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),linear-gradient(135deg,#061222,#0d1b34_52%,#06111f)] text-white">
      {/* Top Bar */}
      <div className="shrink-0 px-4 pt-3 pb-2 safe-area-top">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-blue-950/30 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">
                AquaReport interactive demo
              </p>
              <h1 className="truncate text-lg font-black">
                {report.customerName || report.utilityName}
              </h1>
              <p className="truncate text-xs text-white/50">
                {report.utilityName} · {report.city}, {report.state}
              </p>
            </div>
            <div className={`shrink-0 rounded-2xl border px-4 py-2 text-center ${tier.className}`}>
              <p className="text-2xl font-black leading-none">{score ?? "--"}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider">{tier.label}</p>
            </div>
          </div>
        </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowEndModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 active:bg-white/10"
        >
          <X className="size-3.5" />
          End
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5">
            <Clock className="size-3.5 text-white/50" />
            <span className="text-xs font-mono font-medium text-white/70">
              {formatTime(demoTimer)}
            </span>
          </div>
          <span className="text-xs font-semibold text-white/50">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>
      </div>
      </div>

      {/* Progress Bar */}
      <div className="shrink-0 px-4 pb-3">
        <ProgressBar step={currentStep} total={STEPS.length} />
        <p className="mt-1.5 text-center text-xs font-semibold text-white/40">
          {STEPS[currentStep].label}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-28">
        {currentStep === 0 && (
          <DemoCustomerStep report={report} onNext={goNext} />
        )}
        {currentStep === 1 && (
          <DemoContaminantWalkthrough
            contaminants={contaminants}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 2 && (
          <DemoScoreReveal
            score={score}
            contaminants={contaminants}
            report={report}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <DemoSolution
            score={score}
            company={company}
            report={report}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <DemoLiveTest
            report={report}
            contaminants={contaminants}
            liveReadings={liveReadings}
            onUpdateReadings={setLiveReadings}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {currentStep === 5 && (
          <DemoCostComparison onNext={goNext} onBack={goBack} />
        )}
        {currentStep === 6 && (
          <DemoNextSteps
            report={report}
            reportId={reportId!}
            onEndDemo={() => setShowEndModal(true)}
          />
        )}
      </div>

      {/* Bottom Nav (except last step) */}
      {currentStep < STEPS.length - 1 && (
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
            Next
            <ArrowRight className="size-4" />
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
          onFinished={(_outcome: string) => {
            exitDemo();
          }}
        />
      )}
    </div>
  );
}
