import { useMutation } from "convex/react";
import { Calendar, Check, CircleSlash, Link as LinkIcon, MessageSquare, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  report: any;
  score: number;
  companyColor: string;
  onEndDemo: () => void;
}

const OUTCOMES = [
  { key: "sold", label: "Sold", icon: Check, color: "#10b981" },
  { key: "follow_up", label: "Follow-Up Needed", icon: Calendar, color: "#f59e0b" },
  { key: "not_interested", label: "Not Interested", icon: X, color: "#ef4444" },
  { key: "no_show", label: "No Show", icon: CircleSlash, color: "#6b7280" },
];

export function DemoDealerClose({ report, score, companyColor, onEndDemo }: Props) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveDemoSession = useMutation(api.dealerShared.saveDemoSession);

  const handleSave = async () => {
    if (!outcome) {
      toast.error("Please select a demo outcome first");
      return;
    }
    setSaving(true);
    try {
      await saveDemoSession({
        reportId: report._id,
        outcome,
        notes: notes.trim() || undefined,
      });
      setSaved(true);
      toast.success("Demo session saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const displayScore = score ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
          WRAP UP
        </span>
        <h2 className="text-2xl font-black mt-3">Next Steps</h2>
        <p className="text-sm text-white/50 mt-1">
          Save the demo outcome and share the report with {report.customerName?.split(" ")[0] || "the customer"}
        </p>
      </div>

      {/* Score summary */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-5">
        <ScoreGauge score={displayScore} size={100} animate={false} />
        <div>
          <p className="text-sm text-white/50 mb-1">{report.customerName || "Customer"}'s AquaScore</p>
          <p className="text-3xl font-black">{displayScore}</p>
          <p className="text-xs text-white/40 mt-0.5">{report.totalContaminants} contaminants detected</p>
        </div>
      </div>

      {/* Outcome selection */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Demo Outcome</p>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map((o) => (
            <button
              key={o.key}
              onClick={() => setOutcome(o.key)}
              className={`flex items-center gap-2 rounded-xl p-3 border transition-all cursor-pointer ${
                outcome === o.key
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <o.icon
                className="size-4 shrink-0"
                style={{ color: outcome === o.key ? o.color : "rgba(255,255,255,0.3)" }}
              />
              <span className={`text-sm font-medium ${outcome === o.key ? "text-white" : "text-white/50"}`}>
                {o.label}
              </span>
            </button>
          ))}
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Demo Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key takeaways, objections, follow-up items…"
            className="w-full h-24 rounded-xl bg-white/[0.06] border border-white/10 p-3 text-sm text-white placeholder-white/20 outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Share link */}
      {report.shareToken && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="size-4 text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Share Report</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={`${window.location.origin}/r/${report.shareToken}`}
              className="flex-1 rounded-lg bg-white/[0.06] border border-white/10 px-3 py-2 text-xs text-white/60 outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/r/${report.shareToken}`);
                toast.success("Link copied!");
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium cursor-pointer hover:bg-white/15 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Save & End */}
      {!saved ? (
        <button
          onClick={handleSave}
          disabled={saving || !outcome}
          className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${companyColor}, #10b981)`, boxShadow: `0 4px 24px ${companyColor}30` }}
        >
          {saving ? "Saving…" : "Save & End Demo"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
            <Check className="size-5 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">Demo session saved!</span>
          </div>
          <button
            onClick={onEndDemo}
            className="w-full rounded-2xl border border-white/10 py-4 text-base font-medium cursor-pointer hover:bg-white/5 transition-colors"
          >
            Back to Customer Detail
          </button>
        </div>
      )}
    </div>
  );
}
