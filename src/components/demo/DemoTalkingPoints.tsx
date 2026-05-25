/* ──── Phase 4A: Rep Talking Points — Concern-Aware Dealer Prompts ────
   Collapsible bottom drawer with per-step coaching notes, visible only in rep view.
   Now adapts based on what the homeowner selected as their priorities.
   ──── */

import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface Props {
  currentStep: string;
  company?: any;
  /** Homeowner-selected concerns — drives contextual dealer prompts */
  customerConcerns?: { selected: CustomerConcernKey[]; emphasis: string } | null;
}

/** Default talking points per step key */
const DEFAULT_TALKING_POINTS: Record<string, string> = {
  intake:
    "Quick and casual — don't make it feel like a form. Chat while you fill it out. 'So who all lives here? Any little ones? Pets?'",
  welcome:
    "Build rapport. Ask about their family, how long they've lived here. Mirror their energy. This sets the tone for the whole demo.",
  homeProfile:
    "Let them look at the street view. Ask 'How long have you been here?' — it builds investment in the home.",
  customerConcerns:
    "Watch what they pick — this tells you exactly how to frame the rest. Don't rush past it.",
  score:
    "Pause here. Let the score sink in before speaking. Ask: 'What do you think about that?' Let them react first.",
  contaminants:
    "Focus on the red and amber ones first. Don't overwhelm — pick 3-4 that matter to them.",
  topConcerns:
    "These are your ammunition for the rest of the demo. Refer back to these specific findings.",
  impact:
    "Match the tab to their concern. Make it personal — 'With 3 kids in the home, this is especially important.'",
  rooms:
    "Walk through the rooms they use most. Make it tangible — 'Every time you shower, this is what you're absorbing.'",
  test:
    "This is hands-on time. Let them participate. Hand them the testing supplies. Engagement = investment.",
  verifiedScore:
    "Compare the live result to the report score. 'This confirms what we expected — let me show you what this means.'",
  transform:
    "Emotional moment. Let the numbers breathe. 'Imagine turning on any tap and knowing it's clean.'",
  trust:
    "Let the numbers and reviews do the talking. Social proof is powerful — don't over-explain it.",
  boost:
    "Position the RO as a free bonus, not an upsell. 'This is included at no extra cost.' Cherry on top.",
  system:
    "Focus on 2-3 key features, not all of them. Match features to their specific concerns. Warranty is a universal winner.",
  pricing:
    "Don't rush past the program price. Let them process it before revealing the offer. The contrast is the magic moment.",
  comparison:
    "Make it tangible. 'Less than your morning coffee.' Daily cost is more relatable than monthly.",
  summary:
    "Recap briefly. 'So here's everything we covered today.' Let the summary do the heavy lifting.",
  decision:
    "Back off here. Let them choose. No pressure = more closes. 'Whatever makes sense for your timeline.'",
  customerClose:
    "Hand them the device. Let them see their results independently. Step back — don't hover.",
  dealerClose:
    "If they're hesitant, remind them of the same-day availability. Don't pressure — 'No rush, just want to make sure you know.'",
};

/** Concern-specific additions — appended to the default for certain steps */
const CONCERN_ADDITIONS: Record<string, Partial<Record<CustomerConcernKey, string>>> = {
  contaminants: {
    family_health: "\n\n💡 They selected Family Health — lead with lead, nitrates, and any child-relevant contaminants.",
    skin_and_hair: "\n\n💡 They care about Skin & Hair — highlight chlorine and chloramine levels first.",
    drinking_water: "\n\n💡 Drinking water is their priority — focus on TDS, chlorine byproducts, and anything above health guidelines.",
    appliances_plumbing: "\n\n💡 They're worried about appliances — lead with hardness and scale-forming minerals.",
  },
  topConcerns: {
    family_health: "\n\n💡 Connect these findings back to their kids/family. 'This is especially relevant for younger family members.'",
    bottled_water_costs: "\n\n💡 They're spending on bottled water — these findings show why their tap water doesn't taste right.",
  },
  impact: {
    family_health: "\n\n💡 Start on the Family Safety tab. They told you this matters most. 'You mentioned your family's health — here's what the data shows.'",
    skin_and_hair: "\n\n💡 Start on Skin & Hair. They flagged this. 'You mentioned skin and hair concerns — watch this.'",
    appliances_plumbing: "\n\n💡 Start on Home & Appliances. They're concerned about their investment. 'Let's look at what hard water does to your plumbing.'",
    taste_or_smell: "\n\n💡 Start on Taste & Drinking. Lead with their direct experience. 'You noticed the taste — here's why.'",
    stains_buildup: "\n\n💡 Start on Home & Appliances. They've seen the buildup. 'Those stains you're seeing? Here's the source.'",
  },
  transform: {
    family_health: "\n\n💡 Frame the transformation around family protection. 'This is what changes for your kids.'",
    bottled_water_costs: "\n\n💡 Frame it around savings. 'No more buying bottled water — this is what your tap water becomes.'",
  },
  pricing: {
    bottled_water_costs: "\n\n💡 They already told you they're spending on bottled water. Tie the price back to what they're already paying. 'Remember what we showed on the cost comparison — this replaces all of that.'",
    appliances_plumbing: "\n\n💡 Frame the investment as protecting their biggest asset. 'Think of this as appliance insurance that also gives you clean water.'",
  },
  comparison: {
    bottled_water_costs: "\n\n💡 This is your strongest slide for them. They already know they're overspending — now show them the real number.",
    appliances_plumbing: "\n\n💡 Emphasize the repair and energy costs. 'Most homeowners don't realize hard water is costing them $300-500/year in repairs.'",
  },
  system: {
    family_health: "\n\n💡 Lead with contaminant removal. Warranty is secondary — safety is primary for this homeowner.",
    skin_and_hair: "\n\n💡 Emphasize the softening component. 'This is what changes the shower experience on day one.'",
    appliances_plumbing: "\n\n💡 Lead with scale prevention and appliance protection. Warranty hits especially hard here.",
  },
  summary: {
    family_health: "\n\n💡 Recap: 'We identified X contaminants, and with your family's health as the priority, this system removes all of them.'",
    bottled_water_costs: "\n\n💡 Recap: 'You're currently spending $X/year on bottled water — this system eliminates that cost entirely.'",
  },
};

function buildTalkingPoint(
  step: string,
  company: any,
  selected?: CustomerConcernKey[],
): string | null {
  // Company-customized points take priority
  const customPoints = (company as any)?.demoConfig?.talkingPoints as Record<string, string> | undefined;
  let base = customPoints?.[step] ?? DEFAULT_TALKING_POINTS[step];
  if (!base) return null;

  // Append concern-specific additions
  if (selected?.length && CONCERN_ADDITIONS[step]) {
    const additions = CONCERN_ADDITIONS[step];
    for (const concern of selected) {
      const add = additions[concern];
      if (add) {
        base += add;
        break; // Only add the first matching concern tip
      }
    }
  }

  return base;
}

export function DemoTalkingPoints({ currentStep, company, customerConcerns }: Props) {
  const [expanded, setExpanded] = useState(false);

  const text = useMemo(
    () => buildTalkingPoint(currentStep, company, customerConcerns?.selected),
    [currentStep, company, customerConcerns],
  );

  if (!text) return null;

  // Check if there's a concern-specific addition (the 💡 line)
  const hasConcernTip = text.includes("💡");

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
            : hasConcernTip
              ? "border-violet-400/20 bg-violet-400/5"
              : "border-white/10 bg-white/[0.03]"
        }`}
      >
        {/* Collapsed bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Lightbulb className={`size-3.5 shrink-0 ${
            expanded ? "text-amber-400" :
            hasConcernTip ? "text-violet-400" :
            "text-amber-400/50"
          }`} />
          <p className="flex-1 text-left text-[11px] text-white/50 truncate">
            {expanded ? "Coaching Tip" : preview}
          </p>
          {hasConcernTip && !expanded && (
            <span className="text-[9px] bg-violet-400/10 text-violet-400/70 border border-violet-400/20 rounded-full px-2 py-0.5 shrink-0">
              Personalized
            </span>
          )}
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
