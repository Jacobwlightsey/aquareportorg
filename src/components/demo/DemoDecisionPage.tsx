/* ──── Decision Page — "What Makes Sense for You?" ────
   Three non-pushy options. Calm, premium.
   Fix #12: setTimeout cleanup on unmount.
   ──── */

import { ArrowRight, Calendar, FileText, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playTapSound, haptic, playCelebrationSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";

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
}[] = [
  {
    key: "move_forward",
    icon: Sparkles,
    label: "Move Forward Today",
    description: "Let's get your system scheduled and start protecting your home",
    color: colors.success,
  },
  {
    key: "schedule_followup",
    icon: Calendar,
    label: "Schedule a Follow-Up",
    description: "Take time to think it over — we'll check back at a time that works for you",
    color: colors.primary,
  },
  {
    key: "send_report",
    icon: FileText,
    label: "Send My Report",
    description: "Get your full water analysis report sent to your email to review",
    color: "#8b5cf6",
  },
];

export function DemoDecisionPage({ customerName: _customerName, companyColor = "#2563eb", onDecision }: Props) {
  const [selected, setSelected] = useState<DecisionChoice | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fix #12: cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSelect = (key: DecisionChoice) => {
    playTapSound();
    haptic("light");
    setSelected(key);
  };

  const handleConfirm = () => {
    if (!selected) return;
    playTapSound();
    if (selected === "move_forward") playCelebrationSound();
    setConfirmed(true);
    timerRef.current = setTimeout(() => onDecision(selected), 600);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${companyColor}b0` }}>
          NEXT STEP
        </p>
        <h2 className="text-[28px] font-bold mt-3 leading-tight tracking-tight">
          What Makes Sense for You?
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
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
              className="w-full text-left rounded-2xl p-5 transition-all cursor-pointer disabled:cursor-default"
              style={{
                background: isSelected ? `${opt.color}10` : colors.surface,
                border: `1px solid ${isSelected ? `${opt.color}30` : colors.border}`,
                transform: isSelected ? "scale(1.01)" : "scale(1)",
                ...(confirmed && isSelected ? { boxShadow: `0 0 0 2px ${opt.color}50` } : {}),
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="size-12 shrink-0 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isSelected ? `linear-gradient(135deg, ${opt.color}, ${opt.color}cc)` : `${opt.color}10`,
                  }}
                >
                  <Icon className="size-5" style={{ color: isSelected ? "white" : opt.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold" style={{ color: isSelected ? colors.textPrimary : colors.textSecondary }}>
                    {opt.label}
                  </p>
                  <p className="text-[13px] mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                    {opt.description}
                  </p>
                </div>
                <div
                  className="size-6 shrink-0 mt-0.5 rounded-full flex items-center justify-center transition-all"
                  style={{
                    border: `2px solid ${isSelected ? opt.color : colors.textFaint}`,
                    background: isSelected ? opt.color : "transparent",
                  }}
                >
                  {isSelected && <div className="size-2.5 rounded-full" style={{ background: colors.bg }} />}
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
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-all cursor-pointer disabled:opacity-40 disabled:scale-100"
        style={{
          background: selected && !confirmed ? `linear-gradient(135deg, ${companyColor}, ${colors.primary})` : colors.surface,
          boxShadow: selected && !confirmed ? `0 4px 24px ${companyColor}30` : "none",
          color: selected && !confirmed ? "white" : colors.textFaint,
        }}
      >
        {confirmed ? (
          "Great choice! Moving on..."
        ) : selected ? (
          <>Continue <ArrowRight className="size-5" /></>
        ) : (
          "Select an option above"
        )}
      </button>
    </div>
  );
}
