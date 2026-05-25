/* ──── Phase 3+4A: Transitional Narration Overlay ────
   Emotional bridge cues between key steps.
   Phase 4A: narration adapts to what the homeowner selected as their concerns.
   Appears for ~2.8s then fades, giving breathing room between beats.
   ──── */

import { useEffect, useState } from "react";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface TransitionDef {
  /** Step key that triggers this overlay */
  beforeStep: string;
  /** Default narration line */
  text: string;
  /** Subtle emoji/icon for visual anchor */
  icon?: string;
  /** Concern-specific overrides — use the first matching concern */
  overrides?: { concerns: CustomerConcernKey[]; text: string }[];
}

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
    overrides: [
      { concerns: ["family_health"], text: "Here's how this affects\nyour family every day." },
      { concerns: ["skin_and_hair"], text: "Here's what your water does\nto your skin and hair." },
      { concerns: ["appliances_plumbing", "stains_buildup"], text: "Here's what your water\nis doing to your home." },
      { concerns: ["taste_or_smell", "drinking_water"], text: "Here's what you're actually\ndrinking every day." },
    ],
  },
  {
    beforeStep: "comparison",
    text: "Most homeowners don't realize\nwhat poor water quietly costs them.",
    icon: "💡",
    overrides: [
      { concerns: ["bottled_water_costs"], text: "Let's look at what you're\nalready spending on water." },
      { concerns: ["appliances_plumbing"], text: "Between repairs, replacements,\nand energy — it adds up fast." },
    ],
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
    overrides: [
      { concerns: ["family_health"], text: "Here's what changes\nfor your family." },
      { concerns: ["skin_and_hair"], text: "Here's what changes\nfrom the very first day." },
    ],
  },
];

const TRANSITION_MAP = new Map(TRANSITIONS.map((t) => [t.beforeStep, t]));

/** Duration the overlay is visible (ms) */
const VISIBLE_MS = 2800;
const FADE_IN_MS = 600;
const FADE_OUT_MS = 500;

interface Props {
  currentStep: string;
  onComplete: () => void;
  /** Homeowner concerns — used to pick contextual narration */
  customerConcerns?: { selected: CustomerConcernKey[] } | null;
}

function resolveText(def: TransitionDef, selected?: CustomerConcernKey[]): string {
  if (!def.overrides || !selected?.length) return def.text;
  const s = new Set(selected);
  for (const ov of def.overrides) {
    if (ov.concerns.some((c) => s.has(c))) return ov.text;
  }
  return def.text;
}

export function DemoTransitionOverlay({ currentStep, onComplete, customerConcerns }: Props) {
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting" | "done">("done");
  const [activeDef, setActiveDef] = useState<TransitionDef | null>(null);
  const [activeText, setActiveText] = useState("");

  useEffect(() => {
    const def = TRANSITION_MAP.get(currentStep);
    if (!def) {
      onComplete();
      return;
    }

    setActiveDef(def);
    setActiveText(resolveText(def, customerConcerns?.selected));
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
        setPhase("done");
        onComplete();
      }}
    >
      <div className="text-center px-8 max-w-md pointer-events-auto">
        {activeDef.icon && (
          <div className="text-4xl mb-5 opacity-60">{activeDef.icon}</div>
        )}
        <p className="text-xl font-medium text-white/80 leading-relaxed whitespace-pre-line tracking-wide">
          {activeText}
        </p>
      </div>
    </div>
  );
}

export function hasTransition(stepKey: string): boolean {
  return TRANSITION_MAP.has(stepKey);
}
