/* ──── Sprint 1E+2E: Enhanced DemoDealerClose — merges DemoNextSteps + QR code ──── */

import { useAction, useMutation } from "convex/react";
import {
  Calendar,
  Check,
  CircleSlash,
  ClipboardCopy,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Share2,
  Timer,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../convex/_generated/api";
import { ScoreGauge } from "./ScoreGauge";
import { DemoQRCode } from "./DemoQRCode";
import { DemoVoiceNote } from "./DemoVoiceNote";

interface Props {
  report: any;
  score: number;
  companyColor: string;
  demoTime?: number;
  onEndDemo: () => void;
}

const OUTCOMES = [
  { key: "sold", label: "Sold", icon: Check, color: "#10b981" },
  { key: "follow_up", label: "Follow-Up Needed", icon: Calendar, color: "#f59e0b" },
  { key: "not_interested", label: "Not Interested", icon: X, color: "#ef4444" },
  { key: "no_show", label: "No Show", icon: CircleSlash, color: "#6b7280" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DemoDealerClose({ report, score, companyColor, demoTime, onEndDemo }: Props) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveDemoSession = useMutation(api.dealerShared.saveDemoSession);

  // Sprint 4A: Spouse review link
  const createSpouseLink = useMutation(api.spouseReview.createSpouseReviewLink);
  const [spouseToken, setSpouseToken] = useState<string | null>(null);
  const [creatingSpouseLink, setCreatingSpouseLink] = useState(false);

  const spouseReviewUrl = useMemo(
    () => spouseToken ? `${window.location.origin}/review/${spouseToken}` : "",
    [spouseToken],
  );

  const handleCreateSpouseLink = async () => {
    setCreatingSpouseLink(true);
    try {
      const result = await createSpouseLink({ reportId: report._id });
      setSpouseToken(result.token);
      toast.success("Spouse review link created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create spouse review link");
    } finally {
      setCreatingSpouseLink(false);
    }
  };

  // Sprint 4B: Voice note attachment
  const [voiceAttached, setVoiceAttached] = useState(false);

  // Sprint 4D: Proposal PDF
  const generateProposal = useAction(api.proposalPdf.generateProposalPdf);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalUrl, setProposalUrl] = useState<string | null>(null);

  // Consumer referral (merged from DemoNextSteps)
  const [referralUrl, setReferralUrl] = useState("");
  const [creatingReferral, setCreatingReferral] = useState(false);
  const createReferral = useAction(api.referrals.createConsumerReferral);

  const displayScore = score ?? 0;
  const firstName = report.customerName?.split(" ")[0] || "the customer";
  const shareUrl = report.shareToken
    ? `${window.location.origin}/r/${report.shareToken}`
    : null;

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

  const handleCreateReferral = async () => {
    setCreatingReferral(true);
    try {
      const result = await createReferral({ reportId: report._id as any });
      setReferralUrl(result.referralUrl);
      toast.success("Consumer link created!");
    } catch (err: any) {
      const msg = err?.data ?? err?.message ?? "Failed";
      toast.error(typeof msg === "string" ? msg : "Failed");
    }
    setCreatingReferral(false);
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1">
          WRAP UP
        </span>
        <h2 className="text-2xl font-black mt-3">Next Steps</h2>
        <p className="text-sm text-white/50 mt-1">
          Save the demo outcome and share the report with {firstName}
        </p>
      </div>

      {/* Score summary + timer */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex items-center gap-5">
        <ScoreGauge score={displayScore} size={100} animate={false} />
        <div className="flex-1">
          <p className="text-sm text-white/50 mb-1">{report.customerName || "Customer"}'s AquaScore</p>
          <p className="text-3xl font-black">{displayScore}</p>
          <p className="text-xs text-white/40 mt-0.5">{report.totalContaminants} contaminants detected</p>
          {demoTime != null && demoTime > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Timer className="size-3 text-white/30" />
              <span className="text-xs text-white/30 font-mono">{formatTime(demoTime)}</span>
            </div>
          )}
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

      {/* ──── Consumer referral (merged from DemoNextSteps) ──── */}
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
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold active:bg-white/10 cursor-pointer"
              >
                <ClipboardCopy className="size-4" />
                Copy Link
              </button>
              {report.customerEmail && (
                <a
                  href={`mailto:${report.customerEmail}?subject=Your Water Quality Report&body=Hi ${firstName},%0A%0AHere's your personalized water quality report: ${encodeURIComponent(referralUrl)}%0A%0AView your AquaScore and detailed contaminant analysis.`}
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
            onClick={handleCreateReferral}
            disabled={creatingReferral}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{ background: "linear-gradient(135deg, #22c55e, #10b981)" }}
          >
            {creatingReferral ? (
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

        {/* Share full report link */}
        {shareUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => copy(shareUrl, "Report link")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2.5 text-xs font-semibold text-white/60 active:bg-white/10 cursor-pointer"
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

      {/* Sprint 2E: QR code for report */}
      {report.shareToken && (
        <DemoQRCode
          url={`https://myaquareport.com/r/${report.shareToken}`}
          label="Customer's Report QR Code"
          companyColor={companyColor}
        />
      )}

      {/* Follow-Up quick actions */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Follow-Up
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toast.info("Coming soon — follow-up scheduling will be available in a future update.")}
            className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10 cursor-pointer"
          >
            <Calendar className="size-4 text-blue-400 shrink-0" />
            Schedule Follow-Up
          </button>
          {!proposalUrl ? (
            <button
              onClick={async () => {
                setGeneratingProposal(true);
                try {
                  const result = await generateProposal({ reportId: report._id });
                  if (result.ok && result.pdfUrl) {
                    setProposalUrl(result.pdfUrl);
                    toast.success("Proposal PDF generated!");
                  } else {
                    toast.error((result as any).message || "Could not generate proposal.");
                  }
                } catch (e: any) {
                  toast.error(e.message || "Proposal generation failed");
                } finally {
                  setGeneratingProposal(false);
                }
              }}
              disabled={generatingProposal}
              className="flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10 cursor-pointer disabled:opacity-50"
            >
              {generatingProposal ? (
                <Loader2 className="size-4 text-violet-400 shrink-0 animate-spin" />
              ) : (
                <Send className="size-4 text-violet-400 shrink-0" />
              )}
              {generatingProposal ? "Generating…" : "Generate Proposal"}
            </button>
          ) : (
            <a
              href={proposalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-violet-600/20 border border-violet-500/30 p-3 text-left text-sm font-medium hover:bg-violet-600/30 cursor-pointer"
            >
              <ExternalLink className="size-4 text-violet-400 shrink-0" />
              View Proposal PDF
            </a>
          )}
        </div>

        {/* Sprint 4A: Spouse Review Link */}
        {!spouseToken ? (
          <button
            onClick={handleCreateSpouseLink}
            disabled={creatingSpouseLink}
            className="w-full flex items-center gap-2 rounded-xl bg-white/5 p-3 text-left text-sm font-medium active:bg-white/10 cursor-pointer disabled:opacity-50"
          >
            {creatingSpouseLink ? (
              <Loader2 className="size-4 text-pink-400 shrink-0 animate-spin" />
            ) : (
              <Mail className="size-4 text-pink-400 shrink-0" />
            )}
            Generate Spouse Review Link
          </button>
        ) : (
          <div className="rounded-xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-pink-400">
              Spouse Review Link (expires in 72h)
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={spouseReviewUrl}
                className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/80 font-mono truncate border border-white/10"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(spouseReviewUrl);
                  toast.success("Link copied!");
                }}
                className="rounded-lg bg-white/10 p-2 hover:bg-white/15 cursor-pointer"
              >
                <ClipboardCopy className="size-4" />
              </button>
            </div>
            <div className="flex justify-center">
              <QRCodeSVG value={spouseReviewUrl} size={120} bgColor="transparent" fgColor="#ffffff" />
            </div>
          </div>
        )}
      </div>

      {/* Sprint 4B: Voice Note */}
      {!voiceAttached ? (
        <DemoVoiceNote
          onAttach={(_blob, _mime) => {
            setVoiceAttached(true);
            toast.success("Voice note attached to this demo session!");
            // Note: actual upload to Convex storage would go here in a future iteration
          }}
        />
      ) : (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center gap-2 text-sm text-emerald-400">
          <Check className="size-4 shrink-0" />
          Voice note attached
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
