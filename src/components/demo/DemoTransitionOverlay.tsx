/* ──── Phase 3: Transitional Narration Overlay ────
   Emotional bridge cues between key steps.
   Not scripts the rep reads — on-screen narration the homeowner sees.
   Appears for ~2.5s then fades, giving a "breathing room" between beats.
   ──── */

import { useEffect, useState } from "react";

interface TransitionDef {
  /** Step key that triggers this overlay (shown when entering this step) */
  beforeStep: string;
  /** The narration line */
  text: string;
  /** Subtle emoji/icon for visual anchor */
  icon?: string;
}

/** Transitions keyed by the step they precede */
const TRANSITIONS: TransitionDef[] = [
  {
    beforeStep: "verifiedScore",
    text: "The report shows the local picture.\nNow let's see how today's live test compares.",
    icon: "🔬",
  },
  {
    beforeStep: "impact",
    text: "Here's how this affects\ndaily life in your home.",
    icon: "🏠",
  },
  {
    beforeStep: "comparison",
    text: "Most homeowners don't realize\nwhat poor water quietly costs them.",
    icon: "💡",
  },
  {
    beforeStep: "pricing",
    text: "The goal isn't to add a system —\nit's to solve the underlying issue.",
    icon: "🎯",
  },
  {
    beforeStep: "transform",
    text: "Here's the transformation\nwe're talking about.",
    icon: "✨",
  },
];

const TRANSITION_MAP = new Map(TRANSITIONS.map((t) => [t.beforeStep, t]));

/** Duration the overlay is visible (ms) */
const VISIBLE_MS = 2800;
/** Fade-in duration (ms) */
const FADE_IN_MS = 600;
/** Fade-out duration (ms) */
const FADE_OUT_MS = 500;

interface Props {
  currentStep: string;
  /** Call this when the overlay finishes to allow step content to appear */
  onComplete: () => void;
}

export function DemoTransitionOverlay({ currentStep, onComplete }: Props) {
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting" | "done">("done");
  const [activeDef, setActiveDef] = useState<TransitionDef | null>(null);

  useEffect(() => {
    const def = TRANSITION_MAP.get(currentStep);
    if (!def) {
      onComplete();
      return;
    }

    setActiveDef(def);
    setPhase("entering");

    const fadeInTimer = setTimeout(() => setPhase("visible"), FADE_IN_MS);
    const exitTimer = setTimeout(() => setPhase("exiting"), VISIBLE_MS);
    const doneTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, VISIBLE_MS + FADE_OUT_MS);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [currentStep]);

  if (phase === "done" || !activeDef) return null;

  const opacity =
    phase === "entering" ? 0 :
    phase === "visible" ? 1 :
    0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/90 backdrop-blur-sm pointer-events-none"
      style={{
        opacity,
        transition: `opacity ${phase === "entering" ? FADE_IN_MS : FADE_OUT_MS}ms ease`,
      }}
      onClick={() => {
        // Allow tap to skip
        setPhase("done");
        onComplete();
      }}
    >
      <div className="text-center px-8 max-w-md pointer-events-auto">
        {activeDef.icon && (
          <div className="text-4xl mb-5 opacity-60">{activeDef.icon}</div>
        )}
        <p className="text-xl font-medium text-white/80 leading-relaxed whitespace-pre-line tracking-wide">
          {activeDef.text}
        </p>
      </div>
    </div>
  );
}

/** Check if a step has a transition overlay */
export function hasTransition(stepKey: string): boolean {
  return TRANSITION_MAP.has(stepKey);
}
