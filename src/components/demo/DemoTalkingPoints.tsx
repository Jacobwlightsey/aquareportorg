/* ──── Rep Coaching Panel — Slide-out drawer with 4 tabs ────
   Mockup-faithful: full panel that slides in from right (tablet) or bottom (mobile).
   4 sections: Talking Points, Objections, Next Step, What to Highlight.
   Concern-aware coaching cards. Rep-only indicator.
   Toggle via Lightbulb icon in DemoHeader.
   ──── */

import { ArrowRight, Eye, Lightbulb, MessageSquare, ShieldAlert, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface Props {
  currentStep: string;
  company?: any;
  customerConcerns?: { selected: CustomerConcernKey[]; emphasis: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Section definitions ── */
const SECTION_KEYS = ["talkingPoints", "objections", "nextStep", "highlight"] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const SECTION_META: Record<SectionKey, { label: string; Icon: typeof MessageSquare }> = {
  talkingPoints: { label: "Key Talking Points", Icon: MessageSquare },
  objections: { label: "Objections to Anticipate", Icon: ShieldAlert },
  nextStep: { label: "Next Best Step", Icon: ArrowRight },
  highlight: { label: "What to Highlight", Icon: Sparkles },
};

/* ── Per-step coaching content ── */
const STEP_COACHING: Record<string, Record<SectionKey, string>> = {
  intake: {
    talkingPoints: "Keep it casual — don't make it feel like a form. Chat while you fill it out. \"So who all lives here? Any little ones? Pets?\"",
    objections: "\"Why do you need this info?\" → We tailor everything to your home. Bigger households = more impact.",
    nextStep: "Transition naturally to the welcome. \"Alright, let me show you what we found about your water.\"",
    highlight: "This is your chance to build rapport. Mirror their energy. Take it slow.",
  },
  welcome: {
    talkingPoints: "Build rapport first. Ask about their family, how long they've lived here. This sets the entire tone.",
    objections: "\"How long will this take?\" → About 20 minutes, and we'll customize everything to your home.",
    nextStep: "Smoothly transition to trust/proof. \"Let me show you what we're seeing in your area.\"",
    highlight: "The agenda preview builds trust — they know what's coming. No surprises.",
  },
  homeProfile: {
    talkingPoints: "Let them look at the street view. Ask \"How long have you been here?\" — it builds investment in the home.",
    objections: "\"How do you know this about my house?\" → Public records and your water report.",
    nextStep: "Bridge to concerns. \"Now I'd love to know what matters most to you.\"",
    highlight: "The home profile makes it personal. This is THEIR data, not a generic pitch.",
  },
  customerConcerns: {
    talkingPoints: "Watch what they pick — this tells you exactly how to frame everything. Don't rush past it.",
    objections: "\"I don't really have concerns.\" → That's common — most people don't think about water until they see the data.",
    nextStep: "Use their selections to frame the next steps. \"Great choices — let's see what the data says about those.\"",
    highlight: "Their selections drive the entire presentation. This is the most strategic screen.",
  },
  score: {
    talkingPoints: "Pause here. Let the score sink in before speaking. Ask: \"What do you think about that?\" Let them react first.",
    objections: "\"How is this score calculated?\" → Based on EPA guidelines, health standards, and the contaminants in your local water.",
    nextStep: "Don't rush. Let them process. Then: \"Let me show you exactly what's in your water.\"",
    highlight: "The reveal moment is emotional. Silence is your friend. Let the number do the talking.",
  },
  contaminants: {
    talkingPoints: "Focus on the red and amber ones first. Don't overwhelm — pick 3-4 that matter to THEM.",
    objections: "\"But the city says our water is safe.\" → Legal limits ≠ health limits. Show the health guideline comparison.",
    nextStep: "Transition to the top concerns summary. \"Let me show you the ones that matter most for your family.\"",
    highlight: "Connect each contaminant to their specific concerns. Make it personal, not clinical.",
  },
  topConcerns: {
    talkingPoints: "These are your ammunition for the rest of the demo. Refer back to these specific findings.",
    objections: "\"Is it really that bad?\" → It's not about fear — it's about awareness. These are the facts from YOUR water.",
    nextStep: "Bridge to impact. \"Now let's look at how these actually affect your daily life.\"",
    highlight: "This is the transition from data to emotion. Make it tangible.",
  },
  impact: {
    talkingPoints: "Match the tab to their concern. Make it personal — \"With 3 kids, this is especially important.\"",
    objections: "\"We've been fine so far.\" → Many effects are cumulative. It's about long-term protection.",
    nextStep: "Move to rooms. \"Let me show you exactly where this affects your home.\"",
    highlight: "The severity badges create urgency without you having to push. Let the data speak.",
  },
  rooms: {
    talkingPoints: "Walk through the rooms they use most. Make it tangible. \"Every shower, this is what you're absorbing.\"",
    objections: "\"We just use a Brita filter.\" → Point filters only treat one tap. Your whole home needs protection.",
    nextStep: "Transition to the live test. \"Let's see what's in your water right now.\"",
    highlight: "Rooms make it tangible. Abstract contaminants become concrete daily impact.",
  },
  test: {
    talkingPoints: "Let them participate. Hand them the testing supplies. Engagement = investment.",
    objections: "\"How accurate are these tests?\" → Very. And they confirm what the lab report already shows.",
    nextStep: "Bridge to verified score. \"Now let's see how today's results compare to the report.\"",
    highlight: "This is hands-on time. The more they participate, the more invested they become.",
  },
  verifiedScore: {
    talkingPoints: "Compare the live result to the report score. \"This confirms what we expected.\"",
    objections: "\"The numbers are different.\" → That's normal — water quality varies day to day. The trend is what matters.",
    nextStep: "Move to the score journey. \"Now let me show you what changes with the right system.\"",
    highlight: "Verification builds trust. The live test proves the report wasn't exaggerated.",
  },
  transform: {
    talkingPoints: "Emotional moment. Let the numbers breathe. \"Imagine turning on any tap and knowing it's clean.\"",
    objections: "\"Seems too good to be true.\" → These are real results from homes in your area with the same water.",
    nextStep: "Build to trust/social proof. \"You're not the first family to make this choice.\"",
    highlight: "The three-gauge journey is your most powerful visual. Let it land.",
  },
  trust: {
    talkingPoints: "Let the numbers and reviews do the talking. Social proof is powerful — don't over-explain.",
    objections: "\"How do I know those reviews are real?\" → They're from verified customers in your area.",
    nextStep: "Transition to system info. \"Let me show you exactly what we'd put in your home.\"",
    highlight: "The local angle is key. \"Your neighbors\" is more powerful than \"our customers.\"",
  },
  system: {
    talkingPoints: "Focus on 2-3 key features, not all of them. Match features to their concerns. Warranty is universal.",
    objections: "\"What about maintenance?\" → Minimal. We handle everything.",
    nextStep: "Bridge to comparison. \"Before we look at pricing, let me show you what you're already spending.\"",
    highlight: "Keep it simple. Feature overload kills deals. Less is more.",
  },
  comparison: {
    talkingPoints: "Make it tangible. \"Less than your morning coffee.\" Daily cost > monthly cost.",
    objections: "\"We don't spend that much on water.\" → Add up bottled water, appliance repairs, skin products, energy waste.",
    nextStep: "Transition to pricing. \"Now let me show you the investment.\"",
    highlight: "The comparison reframes pricing before they even see the number. This is the setup.",
  },
  pricing: {
    talkingPoints: "Lead with the monthly payment, not the total. Let the financing do the work.",
    objections: "\"That's a lot.\" → Compare to what they're already spending. \"It's less than $5/day for your whole family.\"",
    nextStep: "If they engage, move to boost. If hesitant, let them process. \"Take your time.\"",
    highlight: "The guarantee badge reduces risk. Point it out: \"30 days to make sure you love it.\"",
  },
  boost: {
    talkingPoints: "Position the RO as a free bonus. \"This is included at no extra cost.\" Cherry on top.",
    objections: "\"Do we need it?\" → It's the difference between good and exceptional. And it's already included.",
    nextStep: "Move to summary. \"Let me put everything together for you.\"",
    highlight: "This is a value-add, not an upsell. Frame it as something they're already getting.",
  },
  summary: {
    talkingPoints: "Brief recap. Let the summary do the heavy lifting. \"Here's everything we covered today.\"",
    objections: "\"I need to think about it.\" → Totally understand. Here's your personalized plan to review.",
    nextStep: "Naturally lead to decision. \"So what feels right for your timeline?\"",
    highlight: "The priority pills remind them why they said yes in the first place.",
  },
  decision: {
    talkingPoints: "Back off. Let them choose. No pressure = more closes. \"Whatever makes sense for your timeline.\"",
    objections: "\"I need to talk to my spouse.\" → Completely understand. Would it help if I could share this with them?",
    nextStep: "Match to their choice. Ready → close. Think → leave materials. Not now → thank them warmly.",
    highlight: "Silence after presenting options is the most powerful close.",
  },
  customerClose: {
    talkingPoints: "Hand them the device. Let them see results independently. Step back — don't hover.",
    objections: "Last objections? Address calmly. The data is on their side.",
    nextStep: "Thank them warmly regardless of outcome. Leave on a positive note.",
    highlight: "The QR code lets them review at their own pace. Independence builds trust.",
  },
  dealerClose: {
    talkingPoints: "Review your demo stats. What worked? What could improve? Log follow-up items.",
    objections: "No objections at this stage — this is your personal debrief.",
    nextStep: "Set your follow-up reminder if they chose \"Need to Think.\"",
    highlight: "Every demo makes you better. Review the engagement data.",
  },
};

/* ── Concern-specific coaching cards ── */
const CONCERN_COACHING: Record<CustomerConcernKey, { icon: string; title: string; tip: string }> = {
  family_health: { icon: "👨‍👩‍👧‍👦", title: "They selected Family Health", tip: "Lead with lead, nitrates, chlorine, and child-relevant contaminants. Frame everything around protecting their kids." },
  skin_and_hair: { icon: "✨", title: "Start on Skin & Hair tab", tip: "They flagged this as important. Lead with the benefits they'll feel from day one — softer skin, less irritation." },
  appliances_plumbing: { icon: "🏠", title: "They're protecting their home", tip: "Emphasize scale buildup costs and appliance lifespan. Make it about money saved." },
  taste_or_smell: { icon: "👃", title: "Taste & odor matters to them", tip: "Focus on chlorine removal and TDS. \"Imagine water that tastes like it should.\"" },
  bottled_water_costs: { icon: "💰", title: "They're spending on bottled water", tip: "Tie the cost back to what they're already paying. \"You're already investing in better water — let's make it whole-home.\"" },
  stains_buildup: { icon: "🪨", title: "Hard water is their pain point", tip: "Show the appliance damage and cleaning costs. This is the practical buyer — give them ROI." },
  drinking_water: { icon: "🚰", title: "Clean drinking water is priority", tip: "Focus on what's actually in every glass. Health guidelines vs actual levels." },
  peace_of_mind: { icon: "🕊️", title: "They want peace of mind", tip: "This buyer wants reassurance. Emphasize testing, verification, warranty, and ongoing monitoring." },
};

export function DemoTalkingPoints({ currentStep, company: _company, customerConcerns, isOpen, onClose }: Props) {
  const [activeSection, setActiveSection] = useState<SectionKey>("talkingPoints");

  const stepContent = STEP_COACHING[currentStep] || STEP_COACHING.welcome;
  const concernCards = useMemo(() => {
    if (!customerConcerns?.selected?.length) return [];
    return customerConcerns.selected
      .map((key) => CONCERN_COACHING[key])
      .filter(Boolean);
  }, [customerConcerns]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      {/* Panel — slides from right on desktop, bottom on mobile */}
      <div
        className="fixed z-50 right-0 top-0 bottom-0 w-[380px] flex flex-col overflow-hidden"
        style={{
          background: colors.bg,
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: "-4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>Rep Coaching</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer" style={{ color: colors.textMuted }}>
              <X className="size-5" />
            </button>
          </div>
          <p className="text-[13px]" style={{ color: colors.textMuted }}>Personalized Guidance</p>
        </div>

        {/* 4 tabs — vertical list */}
        <div className="shrink-0 px-3 py-3 space-y-1" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {SECTION_KEYS.map((key) => {
            const meta = SECTION_META[key];
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                onClick={() => { playTapSound(); setActiveSection(key); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-left"
                style={{
                  background: isActive ? colors.primary : "transparent",
                  color: isActive ? "#000" : colors.textMuted,
                }}
              >
                <meta.Icon className="size-4 shrink-0" />
                <span className="text-[14px] font-medium">{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content area — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Step content */}
          <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-[14px] leading-relaxed" style={{ color: colors.textSecondary }}>
              {stepContent[activeSection]}
            </p>
          </div>

          {/* Concern-aware coaching cards */}
          {concernCards.length > 0 && activeSection === "talkingPoints" && (
            <>
              <div className="flex items-center gap-2">
                <Lightbulb className="size-3.5" style={{ color: colors.primary }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
                  Based on their selected priorities
                </p>
              </div>
              <div className="space-y-3">
                {concernCards.map((card) => (
                  <div key={card.title} className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{card.icon}</span>
                      <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                        {card.title}
                      </p>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: colors.textMuted }}>
                      {card.tip}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="size-3.5" style={{ color: colors.textFaint }} />
            <span className="text-[12px]" style={{ color: colors.textFaint }}>Only you can see this</span>
          </div>
          <p className="text-[13px] italic" style={{ color: colors.textMuted }}>
            You're not just presenting. You're helping their family.
          </p>
        </div>
      </div>
    </>
  );
}
