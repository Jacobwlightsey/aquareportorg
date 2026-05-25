/* ──── Transitional Narration Overlay — Keynote Chapter Beats ────
   Mockup-faithful: Droplets icon with glow at top center.
   Big centered text with ONE keyword in primary color.
   Subtitle line. "Tap anywhere to continue" at bottom.
   ──── */

import { Droplets } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";
import { colors } from "@/lib/designTokens";

interface TransitionDef {
  beforeStep: string;
  /** Lines of text. Use {primary}...{/primary} to highlight in cyan. */
  lines: string[];
  subtitle: string;
  overrides?: { concerns: CustomerConcernKey[]; lines: string[]; subtitle: string }[];
}

const TRANSITIONS: TransitionDef[] = [
  {
    beforeStep: "verifiedScore",
    lines: ["The report shows the local picture.", "Now let's see how {primary}today's live test{/primary} compares."],
    subtitle: "Real-time verification of your water quality.",
  },
  {
    beforeStep: "impact",
    lines: ["Every drop affects", "your {primary}family{/primary} every day."],
    subtitle: "Let's look at what's really in your water and how it impacts what matters most.",
    overrides: [
      { concerns: ["family_health"], lines: ["Every drop affects", "your {primary}family{/primary} every day."], subtitle: "Let's look at what's really in your water and how it impacts what matters most." },
      { concerns: ["skin_and_hair"], lines: ["Every shower affects", "your {primary}skin{/primary} and hair."], subtitle: "Let's see what your water is doing to you every day." },
      { concerns: ["appliances_plumbing", "stains_buildup"], lines: ["Every gallon affects", "your {primary}home{/primary} every day."], subtitle: "Let's see what your water is doing to your home and appliances." },
      { concerns: ["taste_or_smell", "drinking_water"], lines: ["Every glass you drink", "tells a {primary}story{/primary}."], subtitle: "Let's look at what you're actually drinking every day." },
    ],
  },
  {
    beforeStep: "comparison",
    lines: ["Most homeowners don't realize", "what poor water {primary}quietly costs{/primary} them."],
    subtitle: "The hidden expenses add up faster than you'd think.",
    overrides: [
      { concerns: ["bottled_water_costs"], lines: ["Let's look at what", "you're {primary}already spending{/primary} on water."], subtitle: "The numbers might surprise you." },
      { concerns: ["appliances_plumbing"], lines: ["Between repairs and energy,", "it {primary}adds up fast{/primary}."], subtitle: "Hard water costs more than you think." },
    ],
  },
  {
    beforeStep: "pricing",
    lines: ["The goal isn't to add a system —", "it's to {primary}solve{/primary} the underlying issue."],
    subtitle: "Simple, transparent pricing for lasting protection.",
  },
  {
    beforeStep: "transform",
    lines: ["Here's the {primary}transformation{/primary}", "we're talking about."],
    subtitle: "See how your water quality changes with the right system.",
    overrides: [
      { concerns: ["family_health"], lines: ["Here's what changes", "for your {primary}family{/primary}."], subtitle: "The difference proper treatment makes." },
      { concerns: ["skin_and_hair"], lines: ["Here's what changes", "from the {primary}very first day{/primary}."], subtitle: "Feel the difference immediately." },
    ],
  },
];

const TRANSITION_MAP = new Map(TRANSITIONS.map((t) => [t.beforeStep, t]));

const FADE_IN_MS = 800;
const VISIBLE_MS = 3200;
const FADE_OUT_MS = 600;
const TEXT_STAGGER_MS = 400;

interface Props {
  currentStep: string;
  onComplete: () => void;
  customerConcerns?: { selected: CustomerConcernKey[] } | null;
}

function resolveTransition(def: TransitionDef, selected?: CustomerConcernKey[]): { lines: string[]; subtitle: string } {
  if (!def.overrides || !selected?.length) return { lines: def.lines, subtitle: def.subtitle };
  const s = new Set(selected);
  for (const ov of def.overrides) {
    if (ov.concerns.some((c) => s.has(c))) return { lines: ov.lines, subtitle: ov.subtitle };
  }
  return { lines: def.lines, subtitle: def.subtitle };
}

/** Render text with {primary}...{/primary} highlights */
function RichLine({ text }: { text: string }) {
  const parts = text.split(/(\{primary\}.*?\{\/primary\})/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("{primary}")) {
          const inner = part.replace("{primary}", "").replace("{/primary}", "");
          return <span key={i} style={{ color: colors.primary }}>{inner}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function DemoTransitionOverlay({ currentStep, onComplete, customerConcerns }: Props) {
  const [phase, setPhase] = useState<"entering" | "visible" | "exiting" | "done">("done");
  const [textVisible, setTextVisible] = useState(false);
  const activeDefRef = useRef<TransitionDef | null>(null);
  const [activeLines, setActiveLines] = useState<string[]>([]);
  const [activeSubtitle, setActiveSubtitle] = useState("");
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
    const resolved = resolveTransition(def, customerConcerns?.selected);
    setActiveLines(resolved.lines);
    setActiveSubtitle(resolved.subtitle);
    setPhase("entering");
    setTextVisible(false);

    clearTimers();

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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{
        background: `${colors.bg}f0`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
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
        className="flex flex-col items-center text-center px-10 max-w-2xl"
        style={{
          opacity: textOpacity,
          transform: textOpacity ? "translateY(0)" : "translateY(16px)",
          transition: `all ${FADE_IN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      >
        {/* Droplets icon with glow */}
        <div className="mb-10">
          <Droplets
            className="size-12"
            style={{
              color: colors.primary,
              filter: `drop-shadow(0 0 20px ${colors.primary}40)`,
            }}
          />
        </div>

        {/* Main text — large, centered */}
        <div className="space-y-1 mb-6">
          {activeLines.map((line, i) => (
            <p
              key={i}
              className="font-semibold leading-snug"
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                color: colors.textPrimary,
                letterSpacing: "-0.01em",
              }}
            >
              <RichLine text={line} />
            </p>
          ))}
        </div>

        {/* Subtitle */}
        <p className="text-[15px] max-w-md leading-relaxed mb-16" style={{ color: colors.textMuted }}>
          {activeSubtitle}
        </p>

        {/* Tap to continue — positioned at bottom */}
        <p className="text-[13px] absolute bottom-12 inset-x-0 text-center" style={{ color: colors.textFaint }}>
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}

export function hasTransition(stepKey: string): boolean {
  return TRANSITION_MAP.has(stepKey);
}
