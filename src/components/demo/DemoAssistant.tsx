import { Bot, Send, X } from "lucide-react";
import { useState } from "react";

interface Props {
  show: boolean;
  onToggle: () => void;
  report: any;
  contaminants: any[];
  currentStep: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  customer: [
    "What should I know about this utility?",
    "How does the water source affect quality?",
  ],
  contaminants: [
    "Explain this contaminant simply",
    "What are the long-term health effects?",
    "How does this compare to bottled water?",
  ],
  score: [
    "What drives the score down most?",
    "How can we improve this score?",
    "What does Gold tier really mean?",
  ],
  solution: [
    "Customer says: 'Is it really necessary?'",
    "Customer asks about maintenance cost",
    "How long does installation take?",
  ],
  test: [
    "What do these readings mean?",
    "Is this chlorine level concerning?",
    "Why is hardness important?",
  ],
  comparison: [
    "Customer says it's too expensive",
    "Help me explain the ROI",
    "What about a pitcher filter instead?",
  ],
  next: [
    "Draft a follow-up email",
    "What's a good closing strategy?",
    "Help address remaining concerns",
  ],
};

export function DemoAssistant({ show, onToggle, report, contaminants, currentStep }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const quickPrompts = QUICK_PROMPTS[currentStep] ?? [];

  const handleSend = async (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Simulate AI response (will be replaced with real AI call)
    setTimeout(() => {
      const response = generateLocalResponse(msg, report, contaminants, currentStep);
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      setLoading(false);
    }, 800);
  };

  // FAB (always visible)
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
      {/* Backdrop */}
      <button
        onClick={onToggle}
        className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-transparent to-black/50"
      />

      {/* Panel */}
      <div className="flex-1 flex flex-col rounded-t-2xl border-t border-white/10 bg-[#0d1530]/95 backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-blue-400" />
            <span className="text-sm font-bold">AI Assistant</span>
            <span className="text-[10px] text-white/30 bg-white/5 rounded-full px-2 py-0.5">
              {currentStep}
            </span>
          </div>
          <button
            onClick={onToggle}
            className="flex size-8 items-center justify-center rounded-lg bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <Bot className="mx-auto size-8 text-white/20 mb-2" />
              <p className="text-sm text-white/40">
                Ask me anything about the demo, product, or objection handling
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
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
        </div>

        {/* Quick Prompts */}
        {messages.length < 3 && quickPrompts.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="shrink-0 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-[11px] font-medium text-white/60 active:bg-white/10"
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
              className="flex size-10 items-center justify-center rounded-xl bg-blue-500/20 disabled:opacity-30 active:bg-blue-500/30"
            >
              <Send className="size-4 text-blue-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Local response generation (placeholder — will be replaced with AI backend)
function generateLocalResponse(
  question: string,
  report: any,
  contaminants: any[],
  _step: string
): string {
  const q = question.toLowerCase();
  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health).length;

  if (q.includes("expensive") || q.includes("cost") || q.includes("price")) {
    return `Great question. Right now the customer is likely spending $100-300/month on bottled water, pitcher filters, and early appliance replacements from hard water. A whole-home system typically runs $30-50/month — so it actually saves money while protecting their family's health. Plus, no more carrying bottles or changing filters constantly.`;
  }
  if (q.includes("necessary") || q.includes("really need")) {
    return `I'd point out that their water has ${contaminants.length} detected contaminants — ${overLegal} above legal limits and ${overHealth} above health guidelines. The EPA sets legal limits, but those haven't been updated in decades. Health experts like EWG set much stricter guidelines. Every glass, every shower, every meal uses this water. It's not about fear — it's about giving their family the cleanest water possible.`;
  }
  if (q.includes("maintenance")) {
    return `Most whole-home systems need minimal maintenance — typically a filter change every 6-12 months ($50-100) and a salt refill for softeners every few months. Many companies offer service plans. Compare that to constantly buying bottled water or replacing pitcher filters every 2-4 weeks.`;
  }
  if (q.includes("pitcher") || q.includes("brita")) {
    return `Pitcher filters like Brita only remove a few contaminants — mainly chlorine taste and some particulates. They don't address heavy metals, VOCs, or most of the ${contaminants.length} contaminants found in this water. Plus, they only filter drinking water — not showers, laundry, or cooking water. A whole-home system protects every tap.`;
  }
  if (q.includes("install") || q.includes("how long")) {
    return `Professional installation typically takes 2-4 hours. The system connects to the main water line before it enters the home, so every faucet and appliance gets filtered water immediately. Most customers notice the difference in taste and feel within the first shower.`;
  }
  if (q.includes("score") || q.includes("aquascore")) {
    return `The AquaScore rates water quality from 0-100. Their current score factors in ${overLegal} legal violations and ${overHealth} health guideline exceedances. With the right filtration, we can project their score jumping to 90+ (Gold tier), meaning their water meets or exceeds all health guidelines.`;
  }
  if (q.includes("follow-up") || q.includes("closing")) {
    return `A few strategies: (1) Remind them about the specific contaminants that concern them most. (2) Emphasize the cost savings over bottled water. (3) Mention the consumer link — they can review their full report anytime at myaquareport.com. (4) Offer to schedule a follow-up in 2-3 days to answer any remaining questions. Don't push — let the data speak for itself.`;
  }
  if (q.includes("email") || q.includes("draft")) {
    const name = report.customerName?.split(" ")[0] || "there";
    return `Here's a draft:\n\nHi ${name},\n\nThank you for taking the time today to review your water quality report. As we discussed, your water has ${contaminants.length} detected contaminants, ${overLegal > 0 ? `including ${overLegal} above federal legal limits` : "with several above health guidelines"}.\n\nYou can review your full report anytime at the link I shared. If you have any questions or are ready to take the next step, I'm here to help.\n\nBest regards`;
  }

  return `Based on the ${report.utilityName} data showing ${contaminants.length} contaminants detected (${overLegal} above legal limits, ${overHealth} above health guidelines), I'd recommend focusing on the specific health impacts relevant to this customer's concerns. Would you like me to elaborate on any particular contaminant or objection?`;
}
