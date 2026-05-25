import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Droplets,
  Lock,
  Maximize,
  Minimize,
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
import { DemoTopConcerns } from "@/components/demo/DemoTopConcerns";
import { DemoSummaryScreen } from "@/components/demo/DemoSummaryScreen";
// DemoHomeProfile removed from flow
import { DemoCustomerConcerns, type CustomerConcernState } from "@/components/demo/DemoCustomerConcerns";
import { DemoDecisionPage } from "@/components/demo/DemoDecisionPage";
// DemoTransitionOverlay removed
import { DemoDealerClose } from "@/components/demo/DemoDealerClose";
import { DemoAssistant } from "@/components/demo/DemoAssistant";
import { EndDemoModal } from "@/components/demo/EndDemoModal";

// Sprint 1 components
import { DemoStepWrapper } from "@/components/demo/DemoStepWrapper";
import { DemoProgressBar, type StepDef } from "@/components/demo/DemoProgressBar";

// Sprint 2 components
import { DemoConcernIntake, type ConcernData } from "@/components/demo/DemoConcernIntake";
import { DemoRoomImpact } from "@/components/demo/DemoRoomImpact";
import { DemoTrustProof } from "@/components/demo/DemoTrustProof";

// Sprint 3 components
import { DemoTalkingPoints } from "@/components/demo/DemoTalkingPoints";
import {
  evaluateCoaching,
  type CoachingState,
  type StepTiming,
} from "@/lib/demoCoaching";

// Sprint 4C: Save & Resume
import {
  useDemoAutoSave,
  useDemoResume,
  clearDemoState,
  type DemoSaveState,
} from "@/hooks/useDemoSaveRestore";

// Sprint 4E: Offline mode
import { useOfflineBanner } from "@/hooks/useDemoOffline";

// Visual sprint: Orientation lock + Header
import { DemoOrientationLock } from "@/components/demo/DemoOrientationLock";
import { DemoHeader } from "@/components/demo/DemoHeader";
import { DemoBackground } from "@/components/demo/DemoBackground";

/* ──────────────── All possible steps — Phase 2 psychological sales flow ────
   Personalize → Diagnose → Verify → Emotionalize → Recommend → Transform → Justify → Decide
   ──────────────── */
const ALL_STEPS: StepDef[] = [
  // ── Personalize ──
  { key: "intake",            label: "Intake",          color: "#8b5cf6" },   // Dealer-only pre-demo
  { key: "welcome",           label: "Welcome",         color: "#3b82f6" },   // Welcome / Agenda
  { key: "customerConcerns",  label: "Priorities",      color: "#8b5cf6" },   // What Matters Most
  // ── Diagnose ──
  { key: "topConcerns",       label: "Top Concerns",    color: "#f97316" },   // Top 3 Concerns
  { key: "contaminants",      label: "Contaminants",    color: "#f59e0b" },   // Full Contaminant Breakdown
  { key: "score",             label: "AquaScore",       color: "#10b981" },   // Initial Water Score
  // ── Verify ──
  { key: "test",              label: "Live Test",       color: "#06b6d4" },   // Live Water Test
  { key: "verifiedScore",     label: "Verified",        color: "#10b981" },   // Verified Score view
  // ── Emotionalize ──
  { key: "impact",            label: "Impact",          color: "#f43f5e" },   // Personalized Impact
  // ── Transform ──
  { key: "transform",         label: "Transform",       color: "#8b5cf6" },   // Score Journey
  { key: "rooms",             label: "Rooms",           color: "#f43f5e" },   // Room-by-room
  // ── Justify ──
  { key: "comparison",        label: "Expenses",        color: "#ec4899" },   // Cost of Inaction
  { key: "pricing",           label: "Investment",      color: "#10b981" },   // Investment
  { key: "boost",             label: "Upgrade",         color: "#f59e0b" },   // RO upsell
  // ── Convince ──
  { key: "trust",             label: "Proof",           color: "#22c55e" },   // Trust proof
  // ── Decide ──
  { key: "summary",           label: "Summary",         color: "#10b981" },   // Final Summary
  { key: "decision",          label: "Decision",        color: "#2563eb" },   // Decision Page
  { key: "customerClose",     label: "Close",           color: "#22c55e" },   // Customer Close / QR
  { key: "dealerClose",       label: "Wrap Up",         color: "#64748b" },   // Dealer Close
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
            className="flex-1 rounded-xl px-3 py-2.5 text-center transition-all"
            style={{
              background: isActive ? "rgba(111,211,255,0.08)" : "rgba(255,255,255,0.02)",
              border: isActive ? "1px solid rgba(111,211,255,0.3)" : "1px solid rgba(255,255,255,0.06)",
              color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
            }}
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


/* ──────────────── Fullscreen Toggle ──────────────── */
function FullscreenToggle() {
  const [isFs, setIsFs] = React.useState(!!document.fullscreenElement);

  React.useEffect(() => {
    const handler = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <button
      onClick={toggle}
      className={`flex items-center justify-center rounded-lg p-1.5 transition-all ${
        isFs
          ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30"
          : "bg-white/5 text-white/70 active:bg-white/10"
      }`}
      title={isFs ? "Exit Fullscreen" : "Fullscreen"}
    >
      {isFs ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
    </button>
  );
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
    return () => setGlobalMute(false);
  }, [soundMuteCtx.isMuted]);

  return (
    <SoundMuteContext.Provider value={soundMuteCtx}>
      <PresentationModeContext.Provider value={presentationCtx}>
        <DemoModeContext.Provider value={demoModeCtx}>
          <ViewModeContext.Provider value={viewModeCtx}>
            <DemoOrientationLock>
              <DemoWizardInner />
            </DemoOrientationLock>
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
  const [coachingOpen, setCoachingOpen] = useState(false);

  // State shared across steps
  const [liveReadings, setLiveReadings] = useState<FieldWaterReadings>({});
  const [pricingState, setPricingState] = useState<PricingState | null>(null);
  const [boostApplied, setBoostApplied] = useState(false);
  const [isCustomerHandOff, setIsCustomerHandOff] = useState(false);
  const [concerns, setConcerns] = useState<ConcernData | null>(null);
  const [customerConcerns, setCustomerConcerns] = useState<CustomerConcernState | null>(null);
  // transitionDone removed — transitions handled by DemoBackground

  // Sprint 3E: Coaching indicators
  const [stepEnteredAt, setStepEnteredAt] = useState(Date.now());
  const [stepTimings, setStepTimings] = useState<StepTiming[]>([]);
  const [scoreRevealSkipped, setScoreRevealSkipped] = useState(false);
  const [coaching, setCoaching] = useState<CoachingState>({ level: "green", tip: "" });
  const [showCoachingTip, setShowCoachingTip] = useState(false);

  // Auto-dismiss coaching tooltip after 4s
  useEffect(() => {
    if (!showCoachingTip) return;
    const t = setTimeout(() => setShowCoachingTip(false), 4000);
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-coaching-dot]")) {
        setShowCoachingTip(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => { clearTimeout(t); document.removeEventListener("pointerdown", handler); };
  }, [showCoachingTip]);

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

  // Sprint 4C: Save & Resume
  const { showResume, savedState, onResume, onFresh } = useDemoResume(reportId);

  const getStateForSave = useCallback((): DemoSaveState | null => {
    if (!reportId) return null;
    return {
      currentStep,
      liveReadings,
      pricingState,
      boostApplied,
      concerns,
      customerConcerns,
      demoMode,
      viewMode,
      demoTime: demoTimer,
      demoStarted,
      stepTimings,
      timestamp: Date.now(),
    };
  }, [currentStep, liveReadings, pricingState, boostApplied, concerns, customerConcerns, demoMode, viewMode, demoTimer, demoStarted, stepTimings, reportId]);

  useDemoAutoSave(reportId, getStateForSave, currentStep, demoStarted);

  // Sprint 4E: Offline banner
  const offlineBanner = useOfflineBanner();

  // Restore state when user chooses "Resume"
  useEffect(() => {
    if (!savedState || showResume) return; // Only restore after user clicks Resume
    setCurrentStep(savedState.currentStep);
    setLiveReadings(savedState.liveReadings as FieldWaterReadings);
    setPricingState(savedState.pricingState as PricingState | null);
    setBoostApplied(savedState.boostApplied);
    setConcerns(savedState.concerns as ConcernData | null);
    setCustomerConcerns(savedState.customerConcerns as CustomerConcernState | null);
    setDemoTimer(savedState.demoTime);
    setDemoStarted(savedState.demoStarted);
    setStepTimings(savedState.stepTimings as StepTiming[]);
  }, [savedState, showResume]);

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

  const goToStep = useCallback((targetKey: string) => {
    playTapSound();
    const idx = activeSteps.findIndex((s) => s.key === targetKey);
    if (idx >= 0) setCurrentStep(idx);
  }, [activeSteps]);

  const exitDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (reportId) clearDemoState(reportId); // Sprint 4C: clear saved state on exit
    navigate(`/customers/${reportId}`);
  }, [navigate, reportId]);

  // Sprint 3E: Track step timing + update coaching
  const stepKey = activeSteps[currentStep]?.key ?? "welcome";


  const overLegalCount = useMemo(
    () => contaminants.filter((c: any) => c.over_legal).length,
    [contaminants],
  );

  useEffect(() => {
    // Record timing for previous step
    setStepTimings((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.stepKey !== stepKey) {
        return [
          ...prev.slice(0, -1),
          { ...last, duration: (Date.now() - last.enteredAt) / 1000 },
          { stepKey, enteredAt: Date.now(), duration: 0 },
        ];
      }
      if (!last || last.stepKey !== stepKey) {
        return [...prev, { stepKey, enteredAt: Date.now(), duration: 0 }];
      }
      return prev;
    });
    setStepEnteredAt(Date.now());
  }, [stepKey]);

  // Update coaching indicator every 5 seconds
  useEffect(() => {
    if (!demoStarted) return;
    const interval = setInterval(() => {
      setCoaching(
        evaluateCoaching(stepKey, stepEnteredAt, stepTimings, overLegalCount, scoreRevealSkipped),
      );
    }, 5000);
    // Also evaluate immediately on step change
    setCoaching(
      evaluateCoaching(stepKey, stepEnteredAt, stepTimings, overLegalCount, scoreRevealSkipped),
    );
    return () => clearInterval(interval);
  }, [stepKey, stepEnteredAt, demoStarted, overLegalCount, scoreRevealSkipped]);

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
  // stepKey already declared above (Sprint 3E coaching)
  const isCustomerFacing = isCustomerHandOff && stepKey === "customerClose";
  const isCustomerView = viewMode === "customer";

  // In customer view, hide certain UI elements
  const showTopBarChrome = !isCustomerFacing && !isCustomerView;
  const showStepLabel = !isCustomerFacing && !isCustomerView && !isPresentationMode;
  const showTimer = !isCustomerFacing && !isCustomerView;
  const showProgressBar = !isCustomerFacing;
  const showAssistantFAB = !isCustomerView;

  /* Sprint 4C: Resume dialog */
  if (showResume && savedState) {
    const mins = Math.floor(savedState.demoTime / 60);
    const secs = savedState.demoTime % 60;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0d1530] to-[#111827] text-white p-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center space-y-4">
          <div className="text-3xl">💾</div>
          <h2 className="text-lg font-bold">Resume Previous Demo?</h2>
          <p className="text-sm text-white/60">
            You have a saved demo in progress — step {savedState.currentStep + 1},{" "}
            {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} elapsed.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onFresh}
              className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-semibold hover:bg-white/15 transition-colors"
            >
              Start Fresh
            </button>
            <button
              onClick={onResume}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold hover:bg-blue-500 transition-colors"
            >
              Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col text-white ${isPresentationMode ? "presentation-mode" : ""}`}
      style={{ background: "#070B14" }}
      {...swipeProps}
    >
      {/* ─── Atmospheric Background Image ─── */}
      <DemoBackground stepKey={stepKey} />

      {/* ─── Top Bar ─── */}
      {!isCustomerFacing && (
        <div
          className={`relative z-10 flex shrink-0 items-center justify-between px-4 safe-area-top ${isPresentationMode ? "pt-4 pb-2" : "pt-3 pb-2"}`}
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
            <FullscreenToggle />
            <ViewModeToggle />
            {showStepLabel && (
              <p className="text-xs font-bold tracking-wider text-white/40">
                {currentStep + 1}/{activeSteps.length} —{" "}
                {currentStepDef?.label.toUpperCase()}
              </p>
            )}
          </div>

          {/* Right: Timer + Coaching dot */}
          {showTimer ? (
            <div className="flex items-center gap-2">
              {/* Sprint 3E: Coaching indicator */}
              {demoStarted && (
                <button
                  data-coaching-dot
                  onClick={() => setShowCoachingTip((s) => !s)}
                  className="relative cursor-pointer"
                  title={coaching.tip}
                >
                  <span
                    className={`block size-2.5 rounded-full transition-colors ${
                      coaching.level === "green"
                        ? "bg-emerald-400"
                        : coaching.level === "yellow"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-red-400 animate-pulse"
                    }`}
                  />
                  {showCoachingTip && (
                    <div className="absolute top-7 right-0 z-50 w-56 rounded-xl border border-white/10 bg-[#0d1530]/95 backdrop-blur-xl p-3 shadow-xl">
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        {coaching.tip}
                      </p>
                    </div>
                  )}
                </button>
              )}
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
            </div>
          ) : (
            <div className="w-16" /> /* spacer */
          )}
        </div>
      )}

      {/* ─── Visual Sprint: Persistent brand header bar ─── */}
      <div className="relative z-10">
      <DemoHeader
        currentStep={currentStep + 1}
        totalSteps={activeSteps.length}
        companyName={report.companyName || company?.name}
        companyLogo={company?.logo}
        isRepView={viewMode === "rep"}
        coachingOpen={coachingOpen}
        onToggleCoaching={() => setCoachingOpen((o: boolean) => !o)}
      />
      </div>

      {/* ─── Sprint 4E: Offline Banner ─── */}
      {offlineBanner.show && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 bg-amber-600/90 text-white text-xs font-semibold">
          <span>📡 You're offline — demo data is cached, but AI assistant and saving are unavailable.</span>
          <button onClick={offlineBanner.dismiss} className="text-white/80 hover:text-white text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Progress Bar (Sprint 1D: grouped) ─── */}
      {showProgressBar && (
        <div className="relative z-10 shrink-0 px-4 pb-3">
          <DemoProgressBar
            currentStepKey={stepKey}
            steps={activeSteps}
            isPresentationMode={isPresentationMode}
            grouped={activeSteps.length > 6}
          />
        </div>
      )}

      {/* Transition overlay removed per user request */}

      {/* ─── Step Content (Sprint 1G: wrapped in error boundary) ─── */}
      <div
        className={`relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 pb-28 ${isPresentationMode ? "presentation-content" : ""}`}
      >
        <DemoStepWrapper stepName={stepKey}>
          {stepKey === "intake" && (
              <DemoConcernIntake
                onNext={(data) => {
                  setConcerns(data);
                  goNext();
                }}
                onBack={goBack}
                initial={concerns}
              />
          )}
          {stepKey === "welcome" && (
            <div className="space-y-5">
              <DemoWelcome
                report={report}
                companyColor={companyColor}
                onNext={goNext}
              />
              {/* Demo mode selector removed — always full demo */}
            </div>
          )}
          {/* homeProfile step removed per flow restructure */}
          {stepKey === "customerConcerns" && (
            <DemoCustomerConcerns
              initial={customerConcerns}
              companyColor={companyColor}
              onNext={(state) => {
                setCustomerConcerns(state);
                goNext();
              }}
            />
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
          {stepKey === "topConcerns" && (
            <DemoTopConcerns
              contaminants={contaminants}
              onViewFull={() => goToStep("contaminants")}
            />
          )}
          {stepKey === "impact" && (
            <DemoImpact contaminants={contaminants} onNext={goNext} onBack={goBack} customerConcerns={customerConcerns} />
          )}
          {stepKey === "rooms" && (
            <DemoRoomImpact
              onNext={goNext}
              onBack={goBack}
              concerns={concerns}
            />
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
          {stepKey === "verifiedScore" && (
            <DemoScoreReveal
              score={score}
              contaminants={contaminants}
              report={report}
              onNext={goNext}
              onBack={goBack}
              skipScoreAnimation={skipScoreAnimation}
              verifiedMode
              liveReadings={liveReadings}
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
          {stepKey === "trust" && (
            <DemoTrustProof
              company={company}
              report={report}
              onNext={goNext}
            />
          )}
          {stepKey === "pricing" && (
            <DemoPricing
              company={company}
              onNext={goNext}
              onBack={goBack}
              onPricingChange={setPricingState}
              initialState={pricingState}
            />
          )}
          {stepKey === "comparison" && (
            <DemoCostComparison
              company={company}
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
          {stepKey === "summary" && (
            <DemoSummaryScreen
              report={report}
              company={company}
              initialScore={score}
              verifiedScore={score}
              projectedScore={projectedScore}
              contaminants={contaminants}
              boostApplied={boostApplied}
              companyColor={companyColor}
              customerConcerns={customerConcerns}
              onNext={goNext}
            />
          )}
          {stepKey === "decision" && (
            <DemoDecisionPage
              customerName={report.customerName}
              companyColor={companyColor}
              onDecision={() => goNext()}
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

      {/* Rep Coaching Panel — slide-out drawer (only in rep view) */}
      {viewMode === "rep" && demoStarted && (
        <DemoTalkingPoints
          currentStep={stepKey}
          company={company}
          customerConcerns={customerConcerns}
          isOpen={coachingOpen}
          onClose={() => setCoachingOpen(false)}
        />
      )}

      {/* ─── Bottom nav for middle steps ─── */}
      {!isCustomerFacing &&
        !isCustomerView &&
        currentStep > 0 &&
        currentStep < activeSteps.length - 2 && (
          <div
            className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 py-3 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/90 to-transparent safe-area-bottom"
          >
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center justify-center size-10 rounded-full bg-white/5 disabled:opacity-20 active:bg-white/10 transition-all"
              aria-label="Back"
            >
              <ChevronLeft className="size-5 text-white/70" />
            </button>
            <span className="text-[11px] font-medium tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
              {currentStep + 1} / {activeSteps.length}
            </span>
            <button
              onClick={goNext}
              className="flex items-center justify-center size-10 rounded-full active:scale-[0.93] transition-transform"
              style={{
                background: currentStepDef?.color ?? "#3b82f6",
              }}
              aria-label="Next"
            >
              <ArrowRight className="size-5" />
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
          concerns={concerns}
          score={score}
          pricingState={pricingState}
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
