/* ──── End Demo Modal ────
   Outcome selection + notes. designTokens colors.
   ──── */

import { Check, Clock, ThumbsDown, ThumbsUp, Timer, X } from "lucide-react";
import { useState } from "react";
import { colors } from "@/lib/designTokens";

interface Props {
  report: any;
  demoTime: number;
  onClose: () => void;
  onFinished: (outcome: string) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const OUTCOMES = [
  { key: "interested", label: "Interested", desc: "Customer wants to move forward", icon: ThumbsUp, color: colors.success },
  { key: "follow_up", label: "Follow Up", desc: "Needs time to decide", icon: Clock, color: colors.warning },
  { key: "not_interested", label: "Not Interested", desc: "Customer declined", icon: ThumbsDown, color: colors.critical },
] as const;

export function EndDemoModal({ report, demoTime, onClose, onFinished }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button onClick={onClose} className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />

      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 space-y-5 safe-area-bottom" style={{ background: colors.elevated }}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg cursor-pointer"
          style={{ background: `${colors.textFaint}10` }}
        >
          <X className="size-4" style={{ color: colors.textFaint }} />
        </button>

        <div className="text-center">
          <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>End Demo</h3>
          <p className="text-[14px] mt-1" style={{ color: colors.textMuted }}>
            How did it go with {report.customerName?.split(" ")[0] || "the customer"}?
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 rounded-xl p-3" style={{ background: `${colors.textFaint}08` }}>
          <Timer className="size-4" style={{ color: colors.textFaint }} />
          <span className="text-[14px] font-mono font-bold" style={{ color: colors.textMuted }}>
            Demo Duration: {formatTime(demoTime)}
          </span>
        </div>

        <div className="space-y-2">
          {OUTCOMES.map((o) => {
            const isSelected = selected === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setSelected(o.key)}
                className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all active:scale-[0.98] cursor-pointer"
                style={{
                  background: isSelected ? `${o.color}10` : `${colors.textFaint}05`,
                  border: `1px solid ${isSelected ? `${o.color}30` : colors.border}`,
                }}
              >
                <div className="flex size-10 items-center justify-center rounded-lg" style={{ background: `${o.color}12` }}>
                  <o.icon className="size-5" style={{ color: o.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{o.label}</p>
                  <p className="text-[12px]" style={{ color: colors.textMuted }}>{o.desc}</p>
                </div>
                {isSelected && <Check className="size-5 shrink-0" style={{ color: o.color }} />}
              </button>
            );
          })}
        </div>

        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this demo..."
            rows={3}
            className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-none"
            style={{
              background: `${colors.textFaint}08`,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl py-3 text-[14px] font-semibold cursor-pointer" style={{ background: colors.surface, color: colors.textMuted }}>
            Cancel
          </button>
          <button
            onClick={() => { if (selected) onFinished(selected); }}
            disabled={!selected}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold disabled:opacity-40 active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${OUTCOMES.find((o) => o.key === selected)?.color ?? colors.primary}, ${OUTCOMES.find((o) => o.key === selected)?.color ?? colors.primary}cc)`
                : colors.surface,
            }}
          >
            <Check className="size-4" />Finish Demo
          </button>
        </div>
      </div>
    </div>
  );
}
