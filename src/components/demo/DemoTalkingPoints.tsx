/* ──── Sprint 3A: Rep Talking Points Overlay ──── */
/* Collapsible bottom drawer with per-step coaching notes, visible only in rep view. */

import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useState } from "react";
import { playTapSound } from "@/lib/demoSounds";

interface Props {
  currentStep: string;
  company?: any;
}

/** Default talking points per step key */
const DEFAULT_TALKING_POINTS: Record<string, string> = {
  intake:
    "Quick and casual — don't make it feel like a form. Chat while you fill it out. 'So who all lives here? Any little ones? Pets?'",
  welcome:
    "Build rapport. Ask about their family, how long they've lived here. Mirror their energy. This sets the tone for the whole demo.",
  score:
    "Pause here. Let the score sink in before speaking. Ask: 'What do you think about that?' Let them react first.",
  contaminants:
    "Focus on the red and amber ones first. Don't overwhelm — pick 3-4 that matter to them. If they mentioned kids, lead with child-relevant contaminants.",
  impact:
    "Match the tab to their concern. If they mentioned kids, start with Family Safety. Make it personal — 'With 3 kids in the home, this is especially important.'",
  rooms:
    "Walk through the rooms they use most. If they mentioned dry skin, start with bathroom. Make it tangible — 'Every time you shower, this is what you're absorbing.'",
  test:
    "This is hands-on time. Let them participate. Hand them the testing supplies. Engagement = investment.",
  transform:
    "Emotional moment. Show the journey from where they are to where they could be. 'Imagine turning on any tap and knowing it's clean.'",
  boost:
    "Position the RO as a free bonus, not an upsell. Emphasize 'included at no extra cost.' This is the cherry on top.",
  system:
    "Focus on 2-3 key features, not all of them. Match features to their specific concerns. Quality and warranty are universal winners.",
  trust:
    "Let the numbers and reviews do the talking. 'Over 500 families in your area already made this decision.' Social proof is powerful.",
  pricing:
    "Don't rush past the program price. Let them process it before revealing the offer. The contrast between program price and their price is the magic moment.",
  comparison:
    "Make it tangible. 'Less than your morning coffee' or 'less than your Netflix subscription.' Daily cost is more relatable than monthly.",
  customerClose:
    "Hand them the device. Let them see their results independently. Step back — don't hover. Confidence in the product = confidence in the decision.",
  dealerClose:
    "If they're hesitant, remind them of the same-day discount. Don't pressure — 'No rush, but I want to make sure you know about today's special.'",
};

export function DemoTalkingPoints({ currentStep, company }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Use company-customized talking points if available, otherwise defaults
  const customPoints = (company as any)?.demoConfig?.talkingPoints as Record<string, string> | undefined;
  const text = customPoints?.[currentStep] ?? DEFAULT_TALKING_POINTS[currentStep];

  if (!text) return null;

  // Get first sentence for collapsed preview
  const preview = text.split(/[.!?]/).filter(Boolean)[0]?.trim() ?? text;

  return (
    <div className="mx-4 mb-2">
      <button
        onClick={() => {
          playTapSound();
          setExpanded((e) => !e);
        }}
        className={`w-full rounded-xl border transition-all cursor-pointer ${
          expanded
            ? "border-amber-400/30 bg-amber-400/5"
            : "border-white/10 bg-white/[0.03]"
        }`}
      >
        {/* Collapsed bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Lightbulb className={`size-3.5 shrink-0 ${expanded ? "text-amber-400" : "text-amber-400/50"}`} />
          <p className="flex-1 text-left text-[11px] text-white/50 truncate">
            {expanded ? "Coaching Tip" : preview}
          </p>
          {expanded ? (
            <ChevronDown className="size-3.5 text-white/30 shrink-0" />
          ) : (
            <ChevronUp className="size-3.5 text-white/30 shrink-0" />
          )}
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="px-3 pb-3 text-left border-t border-amber-400/10">
            <p className="text-xs text-white/60 leading-relaxed mt-2 whitespace-pre-line">
              {text}
            </p>
          </div>
        )}
      </button>
    </div>
  );
}
