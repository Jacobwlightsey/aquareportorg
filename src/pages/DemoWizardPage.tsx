import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Droplets,
  Lock,
  Monitor,
  MonitorOff,
  User,
  Home,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { parseContaminants } from "@/lib/pipeline";
import { hasPlanOverride, upgradeMessage } from "@/lib/planGate";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { computeAquaScore, type FieldWaterReadings } from "@/lib/waterScore";
import { playTapSound, setGlobalMute } from "@/lib/demoSounds";
import { api } from "../../convex/_generated/api";

// Sprint 0 hooks
import {
  PresentationModeContext,
  usePresentationModeProvider,
  usePresentationMode,
} from "@/hooks/usePresentationMode";
import {
  DemoModeContext,
  useDemoModeProvider,
  useDemoMode,
  DEFAULT_MODE_STEPS,
  MODE_LABELS,
  type DemoModeType,
} from "@/hooks/useDemoMode";
import {
  ViewModeContext,
  useViewModeProvider,
  useViewMode,
  type ViewModeType,
} from "@/hooks/useViewMode";

// Sprint 1: mute hook
import {
  SoundMuteContext,
  useSoundMuteProvider,
  useSoundMute,
} from "@/hooks/useSoundMute";

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

// Sprint 1 components
import { DemoStepWrapper } from "@/components/demo/DemoStepWrapper";
import { DemoProgressBar, type StepDef } from "@/components/demo/DemoProgressBar";

/* ──────────────── All possible steps ──────────────── */
const ALL_STEPS: StepDef[] = [
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
];

/* ──────────────── Helpers ──────────────── */
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ──────────────── Demo Mode Selector (shown on Welcome) ──────────────── */
function DemoModeSelector({
  companyDemoModes,
}: {
  companyDemoModes?: Record<string, string[]>;
}) {
  const { demoMode, setDemoMode } = useDemoMode();

  const modes: DemoModeType[] = ["quick", "standard", "full"];

  return (
    <div className="flex gap-2 w-full max-w-sm mx-auto">
      {modes.map((mode) => {
        const isActive = demoMode === mode;
        const info = MODE_LABELS[mode];
        return (
          <button
            key={mode}
            onClick={() => {
              playTapSound();
              setDemoMode(mode);
            }}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-center transition-all ${
              isActive
                ? "border-cyan-400/50 bg-cyan-400/10 text-white shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"
            }`}
          >
            <p className={`text-sm font-bold ${isActive ? "text-white" : ""}`}>
              {info.label}
            </p>
            <p className="text-[10px] text-white/40 mt-0.5">{info.time}</p>
          </button>
        );
      })}
    </div>
  );
}

/* ──────────────── View Mode Toggle Button ──────────────── */
function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();
  const isRep = viewMode === "rep";

  return (
    <button
      onClick={() => {
        playTapSound();
        toggleViewMode();
      }}
      className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
        isRep
          ? "bg-white/5 text-white/70 active:bg-white/10"
          : "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30 active:bg-cyan-400/20"
      }`}
      title={isRep ? "Switch to Customer View" : "Switch to Rep View"}
    >
      {isRep ? <User className="size-3" /> : <Home className="size-3" />}
      <span className="hidden sm:inline">{isRep ? "Rep" : "Customer"}</span>
    </button>
  );
}

/* ──────────────── Presentation Mode Toggle Button ──────────────── */
function PresentationToggle() {
  const { isPresentationMode, toggle } = usePresentationMode();

  return (
    <button
      onClick={() => {
        playTapSound();
        toggle();
      }}
      className={`flex items-center justify-center rounded-lg p-1.5 transition-all ${
        isPresentationMode
          ? "bg-amber-400/10 text-amber-300 border border-amber-400/30"
          : "bg-white/5 text-white/70 active:bg-white/10"
      }`}
      title={isPresentationMode ? "Exit Presentation Mode" : "Presentation Mode"}
    >
      {isPresentationMode ? (
        <MonitorOff className="size-3.5" />
      ) : (
        <Monitor className="size-3.5" />
      )}
    </button>
  );
}

/* ──────────────── Mute Toggle Button (Sprint 1 addition) ──────────────── */
function MuteToggle() {
  const { isMuted, toggleMute } = useSoundMute();

  return (
    <button
      onClick={() => {
        toggleMute();
      }}
      className={`flex items-center justify-center rounded-lg p-1.5 transition-all ${
        isMuted
          ? "bg-red-400/10 text-red-300 border border-red-400/30"
          : "bg-white/5 text-white/70 active:bg-white/10"
      }`}
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? (
        <VolumeX className="size-3.5" />
      ) : (
        <Volume2 className="size-3.5" />
      )}
    </button>
  );
}

/* ──────────────── Swipe Detection Hook ──────────────── */
function useSwipeNavigation(goNext: () => void, goBack: () => void) {
  const touchStart = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      target: e.target,
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      // Flag #3: skip swipe if the touch started inside a .swipe-disabled container
      const target = touchStart.current.target as HTMLElement | null;
      if (target?.closest?.(".swipe-disabled")) {
        touchStart.current = null;
        return;
      }

      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > 30) return;
      if (dx < 0) goNext();
      else goBack();
    },
    [goNext, goBack],
  );

  return { onTouchStart, onTouchEnd };
}

/* ═══════════════════════════════════════════════════════
   Main Page — wraps everything in context providers
   ═══════════════════════════════════════════════════════ */
export function DemoWizardPage() {
  const presentationCtx = usePresentationModeProvider();
  const demoModeCtx = useDemoModeProvider();
  const viewModeCtx = useViewModeProvider();
  const soundMuteCtx = useSoundMuteProvider();

  // Sync mute state to the global sound module
  useEffect(() => {
    setGlobalMute(soundMuteCtx.isMuted);
  }, [soundMuteCtx.isMuted]);

  return (
    <SoundMuteContext.Provider value={soundMuteCtx}>
      <PresentationModeContext.Provider value={presentationCtx}>
        <DemoModeContext.Provider value={demoModeCtx}>
          <ViewModeContext.Provider value={viewModeCtx}>
            <DemoWizardInner />
          </ViewModeContext.Provider>
        </DemoModeContext.Provider>
      </PresentationModeContext.Provider>
    </SoundMuteContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════
   Inner component — all demo logic
   ═══════════════════════════════════════════════════════ */
function DemoWizardInner() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const report = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as any } : "skip",
  );
  const company = useQuery(api.companies.getMyCompany);
  const { effectivePlan } = useFreeTrial();

  // Sprint 0 contexts
  const { isPresentationMode } = usePresentationMode();
  const { demoMode } = useDemoMode();
  const { viewMode } = useViewMode();

  const [currentStep, setCurrentStep] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [demoTimer, setDemoTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [demoStarted, setDemoStarted] = useState(false);

  // State shared across steps
  const [liveReadings, setLiveReadings] = useState<FieldWaterReadings>({});
  const [pricingState, setPricingState] = useState<PricingState | null>(null);
  const [boostApplied, setBoostApplied] = useState(false);
  const [isCustomerHandOff, setIsCustomerHandOff] = useState(false);

  // skipScoreAnimation from company config (Sprint 1 flag #2)
  const skipScoreAnimation = !!(company as any)?.demoConfig?.skipScoreAnimation;

  /* ─── Active steps based on demo mode ─── */
  const activeSteps: StepDef[] = useMemo(() => {
    const companyModes = (company as any)?.demoConfig?.demoModes as
      | Record<string, string[]>
      | undefined;

    const modeKeys = companyModes?.[demoMode] ?? DEFAULT_MODE_STEPS[demoMode];

    if (!modeKeys || modeKeys.length === 0) {
      return [...ALL_STEPS];
    }

    const stepMap = new Map(ALL_STEPS.map((s) => [s.key, s]));
    return modeKeys
      .map((k) => stepMap.get(k))
      .filter((s): s is StepDef => s !== undefined);
  }, [demoMode, company]);

  // Timer — only runs after demo starts
  useEffect(() => {
    if (!demoStarted) return;
    timerRef.current = setInterval(() => setDemoTimer((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [demoStarted]);

  // Contaminants & score
  const contaminants = useMemo(
    () => parseContaminants(report?.contaminants),
    [report?.contaminants],
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

  // Projected scores
  const projectedScore = 94;
  const boostedScore = 99;
  const finalScore = boostApplied ? boostedScore : projectedScore;

  const companyColor =
    company?.primaryColor || report?.companyColor || "#2563eb";

  /* ─── Navigation ─── */
  const goNext = useCallback(() => {
    playTapSound();
    if (!demoStarted) setDemoStarted(true);
    setCurrentStep((s) => Math.min(s + 1, activeSteps.length - 1));
  }, [activeSteps.length, demoStarted]);

  const goBack = useCallback(() => {
    playTapSound();
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const exitDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate(`/customers/${reportId}`);
  }, [navigate, reportId]);

  // Swipe navigation
  const swipeProps = useSwipeNavigation(goNext, goBack);

  // Clamp step when mode changes shrinks the list
  useEffect(() => {
    setCurrentStep((s) => Math.min(s, activeSteps.length - 1));
  }, [activeSteps.length]);

  /* ─── Loading ─── */
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

  /* ─── Plan gate ─── */
  if (!hasPlanOverride(effectivePlan as any, "growth")) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a] to-[#111827] text-white">
        <Lock className="mb-4 size-12 text-white/20" />
        <p className="text-lg font-semibold">Demo Wizard</p>
        <p className="mt-2 max-w-xs text-center text-sm text-white/50">
          {upgradeMessage("demo_wizard")}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/customers/${reportId}`)}
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/15"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate("/subscription")}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-blue-500"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  const currentStepDef = activeSteps[currentStep];
  const stepKey = currentStepDef?.key ?? "welcome";
  const isCustomerFacing = isCustomerHandOff && stepKey === "customerClose";
  const isCustomerView = viewMode === "customer";

  // In customer view, hide certain UI elements
  const showTopBarChrome = !isCustomerFacing && !isCustomerView;
  const showStepLabel = !isCustomerFacing && !isCustomerView && !isPresentationMode;
  const showTimer = !isCustomerFacing && !isCustomerView;
  const showProgressBar = !isCustomerFacing;
  const showAssistantFAB = !isCustomerView;

  return (
    <div
      className={`fixed inset-0 flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white ${isPresentationMode ? "presentation-mode" : ""}`}
      {...swipeProps}
    >
      {/* ─── Top Bar ─── */}
      {!isCustomerFacing && (
        <div
          className={`flex shrink-0 items-center justify-between px-4 safe-area-top ${isPresentationMode ? "pt-4 pb-2" : "pt-3 pb-2"}`}
        >
          {/* Left: Exit */}
          <button
            onClick={() => setShowEndModal(true)}
            className={`flex items-center gap-1.5 rounded-lg bg-white/5 text-white/70 active:bg-white/10 ${isPresentationMode ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs"} font-medium`}
          >
            <ChevronLeft className={isPresentationMode ? "size-4" : "size-3.5"} />
            Exit
          </button>

          {/* Center: controls cluster */}
          <div className="flex items-center gap-2">
            <MuteToggle />
            <PresentationToggle />
            <ViewModeToggle />
            {showStepLabel && (
              <p className="text-xs font-bold tracking-wider text-white/40">
                {currentStep + 1}/{activeSteps.length} —{" "}
                {currentStepDef?.label.toUpperCase()}
              </p>
            )}
          </div>

          {/* Right: Timer */}
          {showTimer ? (
            <div
              className={`flex items-center gap-1.5 rounded-lg bg-white/5 ${isPresentationMode ? "px-4 py-2" : "px-3 py-1.5"}`}
            >
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span
                className={`font-mono font-medium text-white/70 ${isPresentationMode ? "text-sm" : "text-xs"}`}
              >
                {formatTime(demoTimer)}
              </span>
            </div>
          ) : (
            <div className="w-16" /> /* spacer */
          )}
        </div>
      )}

      {/* ─── Progress Bar (Sprint 1D: grouped) ─── */}
      {showProgressBar && (
        <div className="shrink-0 px-4 pb-3">
          <DemoProgressBar
            currentStepKey={stepKey}
            steps={activeSteps}
            isPresentationMode={isPresentationMode}
            grouped={activeSteps.length > 6}
          />
        </div>
      )}

      {/* ─── Step Content (Sprint 1G: wrapped in error boundary) ─── */}
      <div
        className={`flex-1 overflow-y-auto overscroll-contain px-4 pb-28 ${isPresentationMode ? "presentation-content" : ""}`}
      >
        <DemoStepWrapper stepName={stepKey}>
          {stepKey === "welcome" && (
            <div className="space-y-5">
              <DemoWelcome
                report={report}
                companyColor={companyColor}
                onNext={goNext}
              />
              {/* Demo Mode Selector — shown on Welcome before starting */}
              {!demoStarted && (
                <div className="mx-auto max-w-lg space-y-3 pb-4">
                  <p className="text-center text-[10px] font-bold uppercase tracking-widest text-white/30">
                    Demo Mode
                  </p>
                  <DemoModeSelector
                    companyDemoModes={
                      (company as any)?.demoConfig?.demoModes
                    }
                  />
                </div>
              )}
            </div>
          )}
          {stepKey === "score" && (
            <DemoScoreReveal
              score={score}
              contaminants={contaminants}
              report={report}
              onNext={goNext}
              onBack={goBack}
              skipScoreAnimation={skipScoreAnimation}
            />
          )}
          {stepKey === "contaminants" && (
            <DemoContaminantWalkthrough
              contaminants={contaminants}
              onNext={goNext}
              onBack={goBack}
            />
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
            <DemoCostComparison
              company={company}
              monthlyPayment={pricingState?.monthlyPayment}
              onNext={goNext}
              onBack={goBack}
            />
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
              demoTime={demoTimer}
              onEndDemo={exitDemo}
            />
          )}
        </DemoStepWrapper>
      </div>

      {/* ─── Bottom nav for middle steps ─── */}
      {!isCustomerFacing &&
        currentStep > 0 &&
        currentStep < activeSteps.length - 2 && (
          <div
            className={`fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 pt-3 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a] to-transparent safe-area-bottom ${isPresentationMode ? "pb-5" : "pb-4"}`}
          >
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 rounded-xl bg-white/5 font-semibold disabled:opacity-30 active:bg-white/10 ${isPresentationMode ? "px-6 py-4 text-base" : "px-5 py-3 text-sm"}`}
            >
              <ChevronLeft className={isPresentationMode ? "size-5" : "size-4"} />
              Back
            </button>
            <button
              onClick={goNext}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl font-bold active:scale-[0.97] transition-transform ${isPresentationMode ? "py-4 text-base" : "py-3 text-sm"}`}
              style={{
                background: `linear-gradient(135deg, ${currentStepDef?.color ?? "#3b82f6"}, ${activeSteps[Math.min(currentStep + 1, activeSteps.length - 1)]?.color ?? "#3b82f6"})`,
              }}
            >
              Next{" "}
              <ArrowRight className={isPresentationMode ? "size-5" : "size-4"} />
            </button>
          </div>
        )}

      {/* ─── AI Assistant (hidden in customer view) ─── */}
      {showAssistantFAB && (
        <DemoAssistant
          show={showAssistant}
          onToggle={() => setShowAssistant((s) => !s)}
          report={report}
          contaminants={contaminants}
          currentStep={stepKey}
        />
      )}

      {/* ─── End Demo Modal ─── */}
      {showEndModal && (
        <EndDemoModal
          report={report}
          demoTime={demoTimer}
          onClose={() => setShowEndModal(false)}
          onFinished={exitDemo}
        />
      )}

      {/* ─── Presentation Mode CSS (injected) ─── */}
      {isPresentationMode && <PresentationModeStyles />}
    </div>
  );
}

/* ──────────────── Presentation Mode CSS ──────────────── */
function PresentationModeStyles() {
  return (
    <style>{`
      .presentation-mode .presentation-content {
        zoom: 1.25;
        max-width: 100%;
      }
      @supports not (zoom: 1.25) {
        .presentation-mode .presentation-content {
          transform: scale(1.25);
          transform-origin: top center;
        }
      }
      .presentation-mode .presentation-content > * {
        max-width: 42rem;
        margin-left: auto;
        margin-right: auto;
      }
      /* Larger touch targets in presentation mode */
      .presentation-mode button,
      .presentation-mode [role="button"],
      .presentation-mode a {
        min-height: 48px;
        min-width: 48px;
      }
    `}</style>
  );
}
