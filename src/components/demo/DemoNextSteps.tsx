import { useAction } from "convex/react";
import {
  Calendar,
  Check,
  ClipboardCopy,
  ExternalLink,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Share2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";

interface Props {
  report: any;
  reportId: string;
  onEndDemo: () => void;
}

export function DemoNextSteps({ report, reportId, onEndDemo }: Props) {
  const [referralUrl, setReferralUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const createReferral = useAction(api.referrals.createConsumerReferral);

  const shareUrl = report.shareToken
    ? `${window.location.origin}/r/${report.shareToken}`
    : null;

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const result = await createReferral({ reportId: reportId as any });
      setReferralUrl(result.referralUrl);
      toast.success("Consumer link created!");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
    setCreating(false);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 mb-3">
          <Check className="size-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-black">Next Steps</h2>
        <p className="text-sm text-white/50 mt-1">
          Send their report and set up the follow-through
        </p>
      </div>

      {/* Send Customer Link */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Share Report with Customer
        </p>

        {referralUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
              <Check className="size-5 text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-emerald-300">Consumer link ready</p>
                <p className="text-xs text-emerald-400/60 truncate">{referralUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(referralUrl, "Link")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold active:bg-white/10"
              >
                <ClipboardCopy className="size-4" />
                Copy Link
              </button>
              {report.customerEmail && (
                <a
                  href={`mailto:${report.customerEmail}?subject=Your Water Quality Report&body=Hi ${report.customerName?.split(" ")[0] || ""},%0A%0AHere's your personalized water quality report: ${encodeURIComponent(referralUrl)}%0A%0AView your AquaScore and detailed contaminant analysis.`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-500/15 border border-blue-500/25 py-3 text-sm font-semibold text-blue-400 active:bg-blue-500/25"
                >
                  <Mail className="size-4" />
                  Email
                </a>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold active:scale-[0.97] transition-transform"
            style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}
          >
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                Generate myaquareport.com Link
              </>
            )}
          </button>
        )}

        {/* Also share full report */}
        {shareUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => copy(shareUrl, "Report link")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-white/60 active:bg-white/10"
            >
              <ExternalLink className="size-3.5" />
              Copy Full Report Link
            </button>
            <a
              href={`${shareUrl}/flipbook`}
              target="_blank"
              rel="noopener"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-white/60 active:bg-white/10"
            >
              <MessageSquare className="size-3.5" />
              Open Flipbook
            </a>
          </div>
        )}
      </div>

      {/* Quick Notes */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Demo Notes
        </p>
        <textarea
          placeholder="Jot down notes from this demo — customer concerns, questions, follow-up items..."
          rows={4}
          className="w-full rounded-xl bg-white/[0.06] border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/30 resize-none placeholder:text-white/20"
        />
      </div>

      {/* Follow-up Actions */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Follow-Up
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10">
            <Calendar className="size-4 text-blue-400 shrink-0" />
            Schedule Follow-Up
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10">
            <Send className="size-4 text-violet-400 shrink-0" />
            Send Proposal
          </button>
        </div>
      </div>

      {/* End Demo Button */}
      <button
        onClick={onEndDemo}
        className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-base font-bold text-white/70 active:bg-white/10"
      >
        End Demo
      </button>
    </div>
  );
}
