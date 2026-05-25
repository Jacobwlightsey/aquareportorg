/* ──── Transitional Narration Overlay — Keynote Chapter Beats ────
   Atmospheric, cinematic, intentional.
   Think: Apple keynote chapter transition, NOT popup.
   
   Huge centered text. Almost no UI chrome.
   Darker backdrop. Staggered text appearance. Slower fade.
   ──── */

import { useEffect, useState, useRef } from "react";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";
import { colors } from "@/lib/designTokens";

interface TransitionDef {
  beforeStep: string;
  text: string;
  overrides?: { concerns: CustomerConcernKey[]; text: string }[];
}

const TRANSITIONS: TransitionDef[] = [
  {
    beforeStep: "verifiedScore",
    text: "The report shows the local picture.\nNow let's see how today's live test compares.",
  },
  {
    beforeStep: "impact",
    text: "Here's how this affects\ndaily life in your home.",
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
    overrides: [
      { concerns: ["bottled_water_costs"], text: "Let's look at what you're\nalready spending on water." },
      { concerns: ["appliances_plumbing"], text: "Between repairs, replacements,\nand energy — it adds up fast." },
    ],
  },
  {
    beforeStep: "pricing",
    text: "The goal isn't to add a system —\nit's to solve the underlying issue.",
  },
  {
    beforeStep: "transform",
    text: "Here's the transformation\nwe're talking about.",
    overrides: [
      { concerns: ["family_health"], text: "Here's what changes\nfor your family." },
      { concerns: ["skin_and_hair"], text: "Here's what changes\nfrom the very first day." },
    ],
  },
];

const TRANSITION_MAP = new Map(TRANSITIONS.map((t) => [t.beforeStep, t]));

/* Timing — slower, more intentional */
const FADE_IN_MS = 800;
const VISIBLE_MS = 3200;
const FADE_OUT_MS = 600;
const TEXT_STAGGER_MS = 400;

interface Props {
  currentStep: string;
  onComplete: () => void;
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
  const [textVisible, setTextVisible] = useState(false);
  const activeDefRef = useRef<TransitionDef | null>(null);
  const [activeText, setActiveText] = useState("");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    const def = TRANSITION_MAP.get(currentStep);
    if (!def) {
      onComplete();
      return;
    }

    activeDefRef.current = def;
    setActiveText(resolveText(def, customerConcerns?.selected));
    setPhase("entering");
    setTextVisible(false);

    clearTimers();

    // Stagger: backdrop fades in, then text appears
    timersRef.current.push(
      setTimeout(() => setTextVisible(true), TEXT_STAGGER_MS),
      setTimeout(() => setPhase("visible"), FADE_IN_MS),
      setTimeout(() => setPhase("exiting"), FADE_IN_MS + VISIBLE_MS),
      setTimeout(() => {
        setPhase("done");
        onComplete();
      }, FADE_IN_MS + VISIBLE_MS + FADE_OUT_MS),
    );

    return clearTimers;
  }, [currentStep, onComplete]);

  if (phase === "done") return null;

  const backdropOpacity =
    phase === "entering" ? 0.6 :
    phase === "visible" ? 1 :
    0;

  const textOpacity = textVisible && phase !== "exiting" ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{
        background: `${colors.bg}f0`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        opacity: backdropOpacity,
        transition: `opacity ${phase === "entering" ? FADE_IN_MS : FADE_OUT_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      onClick={() => {
        clearTimers();
        setPhase("done");
        onComplete();
      }}
    >
      <div
        className="text-center px-10 max-w-lg"
        style={{
          opacity: textOpacity,
          transform: textOpacity ? "translateY(0)" : "translateY(12px)",
          transition: `all ${FADE_IN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {/* Huge centered text — the keynote moment */}
        <p
          className="font-semibold leading-snug whitespace-pre-line"
          style={{
            fontSize: "clamp(22px, 5vw, 32px)",
            color: colors.textPrimary,
            letterSpacing: "-0.01em",
          }}
        >
          {activeText}
        </p>
      </div>
    </div>
  );
}

export function hasTransition(stepKey: string): boolean {
  return TRANSITION_MAP.has(stepKey);
}
