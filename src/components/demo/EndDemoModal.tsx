import { Check, Clock, ThumbsDown, ThumbsUp, Timer, X } from "lucide-react";
import { useState } from "react";

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
  {
    key: "interested",
    label: "Interested",
    desc: "Customer wants to move forward",
    icon: ThumbsUp,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.25)",
  },
  {
    key: "follow_up",
    label: "Follow Up",
    desc: "Needs time to decide",
    icon: Clock,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.25)",
  },
  {
    key: "not_interested",
    label: "Not Interested",
    desc: "Customer declined",
    icon: ThumbsDown,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.25)",
  },
] as const;

export function EndDemoModal({ report, demoTime, onClose, onFinished }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0d1530] p-6 space-y-5 safe-area-bottom">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg bg-white/5"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="text-center">
          <h3 className="text-xl font-black">End Demo</h3>
          <p className="text-sm text-white/50 mt-1">
            How did it go with {report.customerName?.split(" ")[0] || "the customer"}?
          </p>
        </div>

        {/* Timer Summary */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3">
          <Timer className="size-4 text-white/40" />
          <span className="text-sm font-mono font-bold text-white/60">
            Demo Duration: {formatTime(demoTime)}
          </span>
        </div>

        {/* Outcome Selection */}
        <div className="space-y-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              onClick={() => setSelected(o.key)}
              className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all active:scale-[0.98]"
              style={{
                background: selected === o.key ? o.bg : "rgba(255,255,255,0.03)",
                border: `1px solid ${selected === o.key ? o.border : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{ background: `${o.color}15` }}
              >
                <o.icon className="size-5" style={{ color: o.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{o.label}</p>
                <p className="text-xs text-white/40">{o.desc}</p>
              </div>
              {selected === o.key && (
                <Check className="size-5 shrink-0" style={{ color: o.color }} />
              )}
            </button>
          ))}
        </div>

        {/* Notes */}
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this demo..."
            rows={3}
            className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 resize-none placeholder:text-white/20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white/60 active:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selected) return;
              onFinished(selected);
            }}
            disabled={!selected}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold disabled:opacity-40 active:scale-[0.97] transition-transform"
            style={{
              background: selected
                ? `linear-gradient(135deg, ${OUTCOMES.find((o) => o.key === selected)?.color ?? "#3b82f6"}, ${OUTCOMES.find((o) => o.key === selected)?.color ?? "#3b82f6"}cc)`
                : "rgba(255,255,255,0.1)",
            }}
          >
            <Check className="size-4" />
            Finish Demo
          </button>
        </div>
      </div>
    </div>
  );
}
