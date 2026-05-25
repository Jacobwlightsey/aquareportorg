/* ──── Phase 2: Decision Page ────
   Clean decision step before QR/customer close.
   Three non-pushy options that keep non-buyers in the funnel.
   ──── */

import { ArrowRight, Calendar, FileText, Sparkles } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic, playCelebrationSound } from "@/lib/demoSounds";

export type DecisionChoice = "move_forward" | "schedule_followup" | "send_report";

interface Props {
  customerName?: string;
  companyColor?: string;
  onDecision: (choice: DecisionChoice) => void;
}

const OPTIONS: {
  key: DecisionChoice;
  icon: typeof Sparkles;
  label: string;
  description: string;
  color: string;
  gradient: string;
}[] = [
  {
    key: "move_forward",
    icon: Sparkles,
    label: "Move Forward Today",
    description: "Let's get your system scheduled and start protecting your home",
    color: "#10b981",
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
  },
  {
    key: "schedule_followup",
    icon: Calendar,
    label: "Schedule a Follow-Up",
    description: "Take time to think it over — we'll check back at a time that works for you",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
  },
  {
    key: "send_report",
    icon: FileText,
    label: "Send My Report",
    description: "Get your full water analysis report sent to your email to review",
    color: "#8b5cf6",
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
  },
];

export function DemoDecisionPage({
  customerName,
  companyColor = "#2563eb",
  onDecision,
}: Props) {
  const [selected, setSelected] = useState<DecisionChoice | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const firstName = customerName?.split(" ")[0] || "there";

  const handleSelect = (key: DecisionChoice) => {
    playTapSound();
    haptic("light");
    setSelected(key);
  };

  const handleConfirm = () => {
    if (!selected) return;
    playTapSound();
    if (selected === "move_forward") {
      playCelebrationSound();
    }
    setConfirmed(true);
    // Slight delay for the animation
    setTimeout(() => onDecision(selected), 600);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${companyColor}B3` }}>
          NEXT STEP
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          What Makes Sense for You?
        </h2>
        <p className="text-sm text-white/40 mt-1.5">
          No pressure — just the option that fits your timeline.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={confirmed}
              className={`w-full text-left rounded-2xl border p-5 transition-all cursor-pointer disabled:cursor-default ${
                isSelected
                  ? "border-white/20 bg-white/[0.06] scale-[1.01]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              } ${confirmed && isSelected ? "ring-2 ring-offset-2 ring-offset-[#060a10]" : ""}`}
              style={
                confirmed && isSelected
                  ? { ringColor: opt.color }
                  : undefined
              }
            >
              <div className="flex items-start gap-4">
                <div
                  className="size-12 shrink-0 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? opt.gradient : "rgba(255,255,255,0.04)",
                  }}
                >
                  <Icon
                    className="size-5 transition-colors"
                    style={{ color: isSelected ? "white" : opt.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${isSelected ? "text-white" : "text-white/70"}`}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">
                    {opt.description}
                  </p>
                </div>
                <div
                  className={`size-6 shrink-0 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-white bg-white"
                      : "border-white/20"
                  }`}
                >
                  {isSelected && (
                    <div className="size-2.5 rounded-full bg-[#0a0e1a]" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Confirm */}
      <button
        onClick={handleConfirm}
        disabled={!selected || confirmed}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:scale-100"
        style={{
          background:
            selected && !confirmed
              ? `linear-gradient(135deg, ${companyColor}, #06b6d4)`
              : "rgba(255,255,255,0.06)",
          boxShadow:
            selected && !confirmed ? `0 4px 24px ${companyColor}30` : "none",
        }}
      >
        {confirmed ? (
          "Great choice! Moving on..."
        ) : selected ? (
          <>
            Continue <ArrowRight className="size-5" />
          </>
        ) : (
          "Select an option above"
        )}
      </button>
    </div>
  );
}
