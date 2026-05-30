/* ──── Dealer Close — "Wrap Up" ────
   Save outcome, share report, follow-up. Surface cards, designTokens.
   ──── */

import { useAction, useMutation, useQuery } from "convex/react";
import {
  Calendar, Check, CircleSlash, ClipboardCopy, ExternalLink,
  Loader2, Mail, MessageSquare, Send, Share2, Star, Timer, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import { ScoreGauge } from "./ScoreGauge";
import { DemoQRCode } from "./DemoQRCode";
import { DemoVoiceNote } from "./DemoVoiceNote";
import { colors } from "@/lib/designTokens";

interface DemoReportData {
  selectedConcerns?: string;
  liveReadings?: string;
  verifiedScore?: number;
  stepTimings?: string;
  monthlyExpenses?: number;
  boostApplied?: boolean;
  pricingSnapshot?: string;
}

interface Props {
  report: any;
  score: number;
  companyColor: string;
  demoTime?: number;
  onEndDemo: () => void;
  demoReportData?: DemoReportData;
}

const OUTCOMES = [
  { key: "sold", label: "Sold", icon: Check, color: colors.success, hint: "→ Commission created · Stage → Closed Won" },
  { key: "follow_up", label: "Follow-Up Needed", icon: Calendar, color: colors.warning, hint: "→ Follow-up task created · Stage → Demo Completed" },
  { key: "not_interested", label: "Not Interested", icon: X, color: colors.critical, hint: "→ Stage → Closed Lost" },
  { key: "no_show", label: "No Show", icon: CircleSlash, color: "#6b7280", hint: "→ Stage → New Lead (reschedule)" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function DemoDealerClose({ report, score, companyColor, demoTime, onEndDemo, demoReportData }: Props) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveDemoSession = useMutation(api.dealerShared.saveDemoSession);

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

  const [voiceAttached, setVoiceAttached] = useState(false);

  const generateProposal = useAction(api.proposalPdf.generateProposalPdf);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalUrl, setProposalUrl] = useState<string | null>(null);

  // If company has a custom proposal PDF uploaded, resolve its storage URL
  const customProposalStorageId = report.customProposalUrl;
  const resolvedCustomUrl = useQuery(
    api.dealerShared.getStorageUrl,
    customProposalStorageId ? { storageId: customProposalStorageId } : "skip",
  );

  const advanceLeadStage = useMutation(api.leads.advanceLeadByReport);
  const createFollowUp = useMutation(api.followUps.createFollowUpTask);
  const [creatingFollowUp, setCreatingFollowUp] = useState(false);

  const createReviewRequest = useMutation(api.retention.createReviewRequest);
  const [creatingReview, setCreatingReview] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  const [referralUrl, setReferralUrl] = useState("");
  const [creatingReferral, setCreatingReferral] = useState(false);
  const createReferral = useAction(api.referrals.createConsumerReferral);

  const displayScore = score ?? 0;
  const firstName = report.customerName?.split(" ")[0] || "the customer";
  const shareUrl = report.shareToken ? `${window.location.origin}/r/${report.shareToken}` : null;

  const handleSave = async () => {
    if (!outcome) { toast.error("Please select a demo outcome first"); return; }
    setSaving(true);
    try {
      await saveDemoSession({
        reportId: report._id,
        outcome,
        notes: notes.trim() || undefined,
        durationSeconds: demoTime || undefined,
        ...demoReportData,
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
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
          WRAP UP
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">Next Steps</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Save the demo outcome and share the report with {firstName}
        </p>
      </div>

      {/* Score summary + timer */}
      <div className="rounded-2xl p-5 flex items-center gap-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <ScoreGauge score={displayScore} size={100} animate={false} />
        <div className="flex-1">
          <p className="text-[13px] mb-1" style={{ color: colors.textMuted }}>{report.customerName || "Homeowner"}'s AquaScore</p>
          <p className="text-[32px] font-bold" style={{ color: colors.textPrimary }}>{displayScore}</p>
          <p className="text-[12px] mt-0.5" style={{ color: colors.textFaint }}>{report.totalContaminants} contaminants detected</p>
          {demoTime != null && demoTime > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Timer className="size-3" style={{ color: colors.textFaint }} />
              <span className="text-[12px] font-mono" style={{ color: colors.textFaint }}>{formatTime(demoTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Outcome selection */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Demo Outcome</p>
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map((o) => {
            const isSelected = outcome === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setOutcome(o.key)}
                className="flex flex-col items-start gap-1 rounded-xl p-3 transition-all cursor-pointer"
                style={{
                  background: isSelected ? `${o.color}12` : `${colors.textFaint}08`,
                  border: `1px solid ${isSelected ? `${o.color}30` : colors.border}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <o.icon className="size-4 shrink-0" style={{ color: isSelected ? o.color : colors.textFaint }} />
                  <span className="text-[14px] font-medium" style={{ color: isSelected ? colors.textPrimary : colors.textMuted }}>
                    {o.label}
                  </span>
                </div>
                {isSelected && (
                  <span className="text-[11px] pl-6" style={{ color: `${o.color}cc` }}>{o.hint}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textFaint }}>Demo Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key takeaways, objections, follow-up items…"
            className="w-full h-24 rounded-xl p-3 text-[14px] outline-none transition-colors resize-none"
            style={{
              background: `${colors.textFaint}08`,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
        </div>
      </div>

      {/* Share Report */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
          Share Report with Customer
        </p>

        {referralUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
              <Check className="size-5 shrink-0" style={{ color: colors.success }} />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium" style={{ color: colors.success }}>Consumer link ready</p>
                <p className="text-[12px] truncate" style={{ color: `${colors.success}80` }}>{referralUrl}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copy(referralUrl, "Link")}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold cursor-pointer"
                style={{ background: `${colors.textFaint}08`, color: colors.textSecondary }}
              >
                <ClipboardCopy className="size-4" />Copy Link
              </button>
              {report.customerEmail && (
                <a
                  href={`mailto:${report.customerEmail}?subject=Your Water Quality Report&body=Hi ${firstName},%0A%0AHere's your personalized water quality report: ${encodeURIComponent(referralUrl)}%0A%0AView your AquaScore and detailed contaminant analysis.`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold"
                  style={{ background: `${colors.primary}12`, color: colors.primary }}
                >
                  <Mail className="size-4" />Email
                </a>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={handleCreateReferral}
            disabled={creatingReferral}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, #22c55e, ${colors.success})` }}
          >
            {creatingReferral ? <><Loader2 className="size-4 animate-spin" />Creating...</> : <><Share2 className="size-4" />Generate myaquareport.com Link</>}
          </button>
        )}

        {shareUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => copy(shareUrl, "Report link")}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold cursor-pointer"
              style={{ background: `${colors.textFaint}08`, color: colors.textMuted }}
            >
              <ExternalLink className="size-3.5" />Copy Full Report Link
            </button>
            <a
              href={`${shareUrl}/flipbook`}
              target="_blank"
              rel="noopener"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold"
              style={{ background: `${colors.textFaint}08`, color: colors.textMuted }}
            >
              <MessageSquare className="size-3.5" />Open Flipbook
            </a>
          </div>
        )}
      </div>

      {/* QR */}
      {report.shareToken && (
        <DemoQRCode url={`https://myaquareport.com/r/${report.shareToken}`} label="Customer's Report QR Code" companyColor={companyColor} />
      )}

      {/* Follow-Up */}
      <div className="rounded-2xl p-5 space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Follow-Up</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={async () => {
              setCreatingFollowUp(true);
              try {
                await createFollowUp({
                  reportId: report._id,
                  customerName: report.customerName,
                  notes: notes.trim() || undefined,
                });
                toast.success("Follow-up scheduled for 2 days from now!");
              } catch (e: any) {
                toast.error(e.message || "Failed to create follow-up");
              }
              setCreatingFollowUp(false);
            }}
            disabled={creatingFollowUp}
            className="flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer disabled:opacity-50"
            style={{ background: `${colors.textFaint}08`, color: colors.textSecondary }}
          >
            {creatingFollowUp ? <Loader2 className="size-4 shrink-0 animate-spin" style={{ color: colors.primary }} /> : <Calendar className="size-4 shrink-0" style={{ color: colors.primary }} />}
            {creatingFollowUp ? "Scheduling…" : "Schedule Follow-Up"}
          </button>
          {(() => {
            const effectiveUrl = proposalUrl || resolvedCustomUrl;
            if (effectiveUrl) return (
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa" }}
              >
                <ExternalLink className="size-4 shrink-0" />{resolvedCustomUrl && !proposalUrl ? "Send Proposal" : "View Proposal PDF"}
              </a>
            );
            return (
              <button
                onClick={async () => {
                  setGeneratingProposal(true);
                  try {
                    const result = await generateProposal({ reportId: report._id });
                    if (result.ok && result.pdfUrl) {
                      setProposalUrl(result.pdfUrl);
                      toast.success("Proposal PDF generated!");
                      // Auto-update deal to proposal_sent (#14)
                      advanceLeadStage({ reportId: report._id, stage: "forms_sent" }).catch(() => {});
                    }
                    else toast.error((result as any).message || "Could not generate proposal.");
                  } catch (e: any) { toast.error(e.message || "Proposal generation failed"); }
                  finally { setGeneratingProposal(false); }
                }}
                disabled={generatingProposal}
                className="flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer disabled:opacity-50"
                style={{ background: `${colors.textFaint}08`, color: colors.textSecondary }}
              >
                {generatingProposal ? <Loader2 className="size-4 shrink-0 animate-spin" style={{ color: "#8b5cf6" }} /> : <Send className="size-4 shrink-0" style={{ color: "#8b5cf6" }} />}
                {generatingProposal ? "Generating…" : "Generate Proposal"}
              </button>
            );
          })()}
        </div>

        {/* Spouse Review Link */}
        {!spouseToken ? (
          <button
            onClick={handleCreateSpouseLink}
            disabled={creatingSpouseLink}
            className="w-full flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer disabled:opacity-50"
            style={{ background: `${colors.textFaint}08`, color: colors.textSecondary }}
          >
            {creatingSpouseLink ? <Loader2 className="size-4 shrink-0 animate-spin" style={{ color: "#ec4899" }} /> : <Mail className="size-4 shrink-0" style={{ color: "#ec4899" }} />}
            Generate Spouse Review Link
          </button>
        ) : (
          <DemoQRCode url={spouseReviewUrl} size={120} label="Spouse Review Link (expires 72h)" companyColor="#ec4899" />
        )}

        {/* Send Review Request (#15) */}
        {!reviewSent ? (
          <button
            onClick={async () => {
              setCreatingReview(true);
              try {
                await createReviewRequest({
                  customerName: report.customerName || "Customer",
                  customerEmail: report.customerEmail,
                  customerPhone: report.customerPhone,
                  delayDays: 3,
                });
                setReviewSent(true);
                toast.success("Review request scheduled (3 days after today)!");
              } catch (e: any) {
                toast.error(e.message || "Failed to send review request");
              }
              setCreatingReview(false);
            }}
            disabled={creatingReview}
            className="w-full flex items-center gap-2 rounded-xl p-3 text-left text-[14px] font-medium cursor-pointer disabled:opacity-50"
            style={{ background: `${colors.textFaint}08`, color: colors.textSecondary }}
          >
            {creatingReview ? <Loader2 className="size-4 shrink-0 animate-spin" style={{ color: "#f59e0b" }} /> : <Star className="size-4 shrink-0" style={{ color: "#f59e0b" }} />}
            {creatingReview ? "Sending…" : "Send Review Request"}
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-xl p-3 text-[14px] font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
            <Check className="size-4" /> Review request scheduled
          </div>
        )}
      </div>

      {/* Voice Note */}
      {!voiceAttached ? (
        <DemoVoiceNote
          onAttach={(_blob, _mime) => {
            setVoiceAttached(true);
            toast.success("Voice note attached to this demo session!");
          }}
        />
      ) : (
        <div className="rounded-xl p-3 space-y-1" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: colors.success }}>
            <Check className="size-4 shrink-0" />Voice note attached
          </div>
          <p className="text-[10px] pl-6" style={{ color: colors.textFaint }}>Saved for this session — cloud upload coming soon</p>
        </div>
      )}

      {/* Save & End */}
      {!saved ? (
        <button
          onClick={handleSave}
          disabled={saving || !outcome}
          className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: `linear-gradient(135deg, ${companyColor}, ${colors.success})`, boxShadow: `0 4px 24px ${companyColor}20` }}
        >
          {saving ? "Saving…" : "Save & End Demo"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 rounded-xl p-3" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
            <Check className="size-5" style={{ color: colors.success }} />
            <span className="text-[14px] font-bold" style={{ color: colors.success }}>Demo session saved!</span>
          </div>
          <button
            onClick={onEndDemo}
            className="w-full rounded-2xl py-4 text-[16px] font-medium cursor-pointer transition-colors"
            style={{ background: colors.surface, color: colors.textSecondary }}
          >
            Back to Customer Detail
          </button>
        </div>
      )}
    </div>
  );
}
