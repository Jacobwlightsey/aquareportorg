/* ──── Sprint 3C: Real AI Assistant (replaces local pattern matching) ──── */
/* ──── Sprint 3D: Objection Handling Cards (tab in assistant panel) ──── */

import { useAction } from "convex/react";
import { Bot, MessageSquare, Send, Shield, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import type { ConcernData } from "./DemoConcernIntake";

interface Props {
  show: boolean;
  onToggle: () => void;
  report: any;
  contaminants: any[];
  currentStep: string;
  concerns?: ConcernData | null;
  score?: number;
  pricingState?: any;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

type TabType = "chat" | "objections";

/* ──── Quick prompts per step ──── */
const QUICK_PROMPTS: Record<string, string[]> = {
  intake: [
    "What should I ask about first?",
    "Tips for building rapport",
  ],
  welcome: [
    "Good icebreaker questions",
    "How to set the tone",
  ],
  score: [
    "What drives the score down most?",
    "Customer asks: 'Is this bad?'",
  ],
  contaminants: [
    "Explain this contaminant simply",
    "What are the long-term health effects?",
    "How does this compare to bottled water?",
  ],
  impact: [
    "Customer mentioned kids — what to focus on?",
    "How to make the impact personal",
  ],
  rooms: [
    "Which room usually resonates most?",
    "How to connect rooms to their concerns",
  ],
  test: [
    "What do these readings mean?",
    "Is this chlorine level concerning?",
    "Why is hardness important?",
  ],
  transform: [
    "How to make this moment emotional",
    "What if the projected score isn't much higher?",
  ],
  boost: [
    "How to position RO as a bonus",
    "Customer asks about RO maintenance",
  ],
  system: [
    "Which features to highlight?",
    "Customer asks about maintenance cost",
    "How long does installation take?",
  ],
  trust: [
    "How to present social proof effectively",
    "Customer asks about warranty details",
  ],
  pricing: [
    "Customer says it's too expensive",
    "Help me explain the ROI",
    "Best way to reveal the price",
  ],
  comparison: [
    "Help me explain the daily cost breakdown",
    "What about a pitcher filter instead?",
  ],
  customerClose: [
    "Customer seems hesitant — what to do?",
    "Draft a follow-up email",
  ],
  dealerClose: [
    "What's a good closing strategy?",
    "Help address remaining concerns",
  ],
};

/* ──── Sprint 3D: Objection cards ──── */
interface ObjectionCard {
  id: string;
  objection: string;
  icon: string;
  points: string[];
  personalizable: boolean;
}

const OBJECTION_CARDS: ObjectionCard[] = [
  {
    id: "too_expensive",
    objection: "It's too expensive",
    icon: "💰",
    points: [
      "Break it down to daily cost — often less than a coffee",
      "Compare to what they're already spending on bottled water, filters, appliance repairs",
      "Mention available financing options and monthly payment",
      "Highlight appliance protection savings over 10 years",
    ],
    personalizable: true,
  },
  {
    id: "think_about_it",
    objection: "I need to think about it",
    icon: "🤔",
    points: [
      "Acknowledge — 'Absolutely, it's a big decision'",
      "Remind them of the same-day discount they'd lose",
      "Offer to schedule a follow-up in 2-3 days",
      "Generate a spouse review link so they can share the data",
    ],
    personalizable: true,
  },
  {
    id: "water_is_fine",
    objection: "My water is fine / I don't see a problem",
    icon: "🚰",
    points: [
      "Point to their specific violations — X contaminants above legal limits",
      "Explain that many contaminants are invisible/tasteless",
      "EPA legal limits haven't been updated in decades — health guidelines are stricter",
      "Show the specific contaminants that affect their stated concerns",
    ],
    personalizable: true,
  },
  {
    id: "have_filter",
    objection: "I already have a filter (pitcher, fridge)",
    icon: "🫗",
    points: [
      "Pitchers only remove chlorine taste and some particulates",
      "They don't address heavy metals, VOCs, or most detected contaminants",
      "Pitcher only filters drinking water — not showers, laundry, or cooking",
      "A whole-home system protects every tap in the house",
    ],
    personalizable: true,
  },
  {
    id: "ask_spouse",
    objection: "I need to ask my spouse",
    icon: "👫",
    points: [
      "Totally understand — 'Let me make it easy to share'",
      "Generate a spouse review link with the key findings (no pricing)",
      "Offer: 'Can we do a quick call with them right now?'",
      "Schedule a time for all parties to review together",
    ],
    personalizable: false,
  },
  {
    id: "does_it_work",
    objection: "How do I know it works?",
    icon: "🔬",
    points: [
      "Reference certifications: WQA, NSF, BBB ratings",
      "Mention the install count — hundreds of homes in their area",
      "Offer warranty and satisfaction guarantee details",
      "Show before/after results from other installations",
    ],
    personalizable: false,
  },
];

export function DemoAssistant({
  show,
  onToggle,
  report,
  contaminants,
  currentStep,
  concerns,
  score,
  pricingState,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentRef = useRef(0); // Rate-limit cooldown

  const askAI = useAction(api.demoAssistant.askDemoAssistant);

  const quickPrompts = QUICK_PROMPTS[currentStep] ?? [];
  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health).length;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim() || loading) return;
    // 2s cooldown between requests
    const now = Date.now();
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Call real AI backend (Sprint 3C)
      const result = await askAI({
        question: msg,
        context: {
          currentStep,
          aquaScore: score,
          customerName: report?.customerName,
          companyName: report?.companyName,
          contaminantCount: contaminants.length,
          overLegal,
          overHealth,
          topContaminants: contaminants
            .filter((c: any) => c.over_legal || c.over_health)
            .slice(0, 5)
            .map((c: any) => c.name || c.contaminant_name),
          concerns: concerns?.concerns,
          currentSolution: concerns?.currentSolution,
          householdSize: concerns?.householdSize,
          hasKids: concerns?.hasKids,
        },
      });

      if (result.answer) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.answer! }]);
      } else {
        // Fallback to local response
        const fallback = generateLocalResponse(msg, report, contaminants, currentStep);
        setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      }
    } catch {
      // Fallback to local response on any error
      const fallback = generateLocalResponse(msg, report, contaminants, currentStep);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    }

    setLoading(false);
  };

  // Personalize an objection card
  const personalizeCard = (card: ObjectionCard): string[] => {
    if (!card.personalizable) return card.points;
    const points = [...card.points];

    if (card.id === "too_expensive" && pricingState) {
      const daily = (pricingState.monthlyPayment / 30).toFixed(2);
      points.push(`Their daily cost: $${daily}/day — less than a coffee`);
    }
    if (card.id === "water_is_fine") {
      if (overLegal > 0) {
        points.push(`Their water has ${overLegal} contaminant${overLegal > 1 ? "s" : ""} above federal legal limits`);
      }
      if (overHealth > 0) {
        points.push(`${overHealth} above recommended health guidelines`);
      }
    }
    if (card.id === "think_about_it" && pricingState?.discountsApplied?.length) {
      points.push(`They'd lose their applied discounts if they wait`);
    }
    if (card.id === "have_filter") {
      points.push(`Their water has ${contaminants.length} detected contaminants — a pitcher catches maybe 5-10 of those`);
    }

    return points;
  };

  // FAB
  if (!show) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-4 bottom-20 z-50 flex size-12 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
        style={{
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
        }}
      >
        <Bot className="size-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col" style={{ height: "55vh" }}>
      <button
        onClick={onToggle}
        className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent to-black/50"
      />

      <div className="flex-1 flex flex-col rounded-t-2xl border-t border-white/10 bg-[#0d1530]/95 backdrop-blur-xl overflow-hidden">
        {/* Header with tabs */}
        <div className="border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-blue-400" />
              <span className="text-sm font-bold">AI Assistant</span>
              <span className="text-[10px] text-white/30 bg-white/5 rounded-full px-2 py-0.5">
                {currentStep}
              </span>
            </div>
            <button
              onClick={onToggle}
              className="flex size-8 items-center justify-center rounded-lg bg-white/5 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex px-4 gap-1">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "chat"
                  ? "bg-white/5 text-white border-b-2 border-blue-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <MessageSquare className="size-3" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab("objections")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "objections"
                  ? "bg-white/5 text-white border-b-2 border-amber-400"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              <Shield className="size-3" />
              Objections
            </button>
          </div>
        </div>

        {/* Tab content */}
        {activeTab === "chat" ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Bot className="mx-auto size-8 text-white/20 mb-2" />
                  <p className="text-sm text-white/40">
                    Ask me anything about the demo, product, or objection handling
                  </p>
                  <p className="text-xs text-white/20 mt-1">Powered by AI • Knows this customer's data</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                      m.role === "user"
                        ? "bg-blue-500/20 text-white"
                        : "bg-white/5 text-white/80"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/5 px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-white/30 animate-bounce" />
                      <span className="size-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0.15s]" />
                      <span className="size-1.5 rounded-full bg-white/30 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length < 3 && quickPrompts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {quickPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    className="shrink-0 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/60 active:bg-white/10 cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/5 px-4 py-3 safe-area-bottom">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask a question..."
                  className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/10 px-4 text-sm text-white outline-none focus:border-white/30 placeholder:text-white/20"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 disabled:opacity-30 active:bg-blue-500/30 cursor-pointer"
                >
                  <Send className="size-4 text-blue-400" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Objection Cards (Sprint 3D) */
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 safe-area-bottom">
            <p className="text-xs text-white/40 text-center mb-2">
              Tap a card for personalized talking points
            </p>
            {OBJECTION_CARDS.map((card) => (
              <ObjectionCardItem
                key={card.id}
                card={card}
                points={personalizeCard(card)}
                onAsk={(q) => {
                  setActiveTab("chat");
                  handleSend(q);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──── Objection card UI ──── */
function ObjectionCardItem({
  card,
  points,
  onAsk,
}: {
  card: ObjectionCard;
  points: string[];
  onAsk: (q: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all ${
        expanded ? "border-amber-400/30 bg-amber-400/5" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 p-3 text-left cursor-pointer"
      >
        <span className="text-xl">{card.icon}</span>
        <p className="flex-1 text-sm font-semibold text-white/80">"{card.objection}"</p>
        <Shield className={`size-4 shrink-0 ${expanded ? "text-amber-400" : "text-white/20"}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-amber-400/10 pt-2">
          {points.map((point, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="size-1.5 rounded-full bg-amber-400/50 mt-1.5 shrink-0" />
              <p className="text-xs text-white/60 leading-relaxed">{point}</p>
            </div>
          ))}
          <button
            onClick={() => onAsk(`Customer says: "${card.objection}" — give me the best response using their data`)}
            className="w-full mt-1 rounded-lg bg-amber-400/10 border border-amber-400/20 py-2 text-xs font-bold text-amber-400 cursor-pointer active:bg-amber-400/20"
          >
            Get AI Response →
          </button>
        </div>
      )}
    </div>
  );
}

/* ──── Local response fallback (kept from original) ──── */
function generateLocalResponse(
  question: string,
  report: any,
  contaminants: any[],
  _step: string,
): string {
  const q = question.toLowerCase();
  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health).length;

  if (q.includes("expensive") || q.includes("cost") || q.includes("price")) {
    return `Great question. Right now the customer is likely spending $100-300/month on bottled water, pitcher filters, and early appliance replacements from hard water. A whole-home system typically runs $30-50/month — so it actually saves money while protecting their family's health.`;
  }
  if (q.includes("necessary") || q.includes("really need")) {
    return `Their water has ${contaminants.length} detected contaminants — ${overLegal} above legal limits and ${overHealth} above health guidelines. The EPA sets legal limits, but those haven't been updated in decades. It's about giving their family the cleanest water possible.`;
  }
  if (q.includes("maintenance")) {
    return `Most whole-home systems need minimal maintenance — a filter change every 6-12 months ($50-100) and salt refill for softeners every few months. Compare that to constantly buying bottled water or replacing pitcher filters.`;
  }
  if (q.includes("pitcher") || q.includes("brita")) {
    return `Pitcher filters only remove a few contaminants — mainly chlorine taste. They don't address heavy metals, VOCs, or most of the ${contaminants.length} contaminants found here. Plus, they only filter drinking water — not showers, laundry, or cooking.`;
  }
  if (q.includes("install") || q.includes("how long")) {
    return `Professional installation typically takes 2-4 hours. The system connects to the main water line, so every faucet and appliance gets filtered water immediately. Most customers notice the difference in the first shower.`;
  }
  if (q.includes("score") || q.includes("aquascore")) {
    return `The AquaScore rates water quality from 0-100. Their current score factors in ${overLegal} legal violations and ${overHealth} health guideline exceedances. With the right filtration, we can project their score jumping to 90+.`;
  }
  if (q.includes("follow-up") || q.includes("closing")) {
    return `A few strategies: (1) Remind them about their specific contaminants. (2) Emphasize cost savings over bottled water. (3) Mention the consumer link at myaquareport.com. (4) Offer to schedule a follow-up in 2-3 days. Let the data speak for itself.`;
  }
  if (q.includes("email") || q.includes("draft")) {
    const name = report.customerName?.split(" ")[0] || "there";
    return `Here's a draft:\n\nHi ${name},\n\nThank you for taking the time today. As we discussed, your water has ${contaminants.length} detected contaminants${overLegal > 0 ? `, including ${overLegal} above federal legal limits` : ""}.\n\nYou can review your full report anytime at the link I shared. If you have any questions, I'm here to help.\n\nBest regards`;
  }

  return `Based on their data showing ${contaminants.length} contaminants (${overLegal} above legal, ${overHealth} above health guidelines), I'd recommend focusing on the specific health impacts relevant to this customer's concerns. Would you like me to elaborate on any particular contaminant or objection?`;
}
