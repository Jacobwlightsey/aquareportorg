/* ──── Demo Report — Post-demo aggregated report ────
   Shows on the customer page after a demo is completed.
   Aggregates: concerns, readings, scores, pricing, timing.
   ──── */

import { Activity, Clock, Droplets, FileText, FlaskConical, ShieldCheck, Target } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { colors, scoreTierInfo } from "@/lib/designTokens";
import { AICoachReport } from "./AICoachReport";

interface DemoSession {
  _id: string;
  _creationTime: number;
  outcome: string;
  notes?: string;
  durationSeconds?: number;
  customerName?: string;
  waterScore?: number;
  selectedConcerns?: string; // JSON array
  liveReadings?: string; // JSON { chlorine, ph, hardness, tds }
  verifiedScore?: number;
  stepTimings?: string; // JSON array
  monthlyExpenses?: number;
  boostApplied?: boolean;
  pricingSnapshot?: string; // JSON
  demoMode?: string;
  // AI Coach
  aiCoachStatus?: string;
}

interface Props {
  session: DemoSession;
}

const CONCERN_LABELS: Record<string, string> = {
  drinking_water: "Drinking Water Safety",
  skin_hair: "Skin & Hair Health",
  appliance_life: "Appliance Longevity",
  taste_odor: "Taste & Odor",
  baby_family: "Baby & Family Safety",
  stains_buildup: "Stains & Buildup",
  peace_of_mind: "Peace of Mind",
  other: "Other",
};

const READING_LABELS: Record<string, { label: string; unit: string }> = {
  chlorine: { label: "Chlorine", unit: "ppm" },
  ph: { label: "pH", unit: "" },
  hardness: { label: "Hardness", unit: "gpg" },
  tds: { label: "TDS", unit: "ppm" },
};

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4" style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>{label}</span>
      </div>
      <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>{value}</p>
    </div>
  );
}

export function DemoReport({ session }: Props) {
  const concerns: string[] = session.selectedConcerns ? JSON.parse(session.selectedConcerns) : [];
  const readings: Record<string, number> = session.liveReadings ? JSON.parse(session.liveReadings) : {};
  const pricing = session.pricingSnapshot ? JSON.parse(session.pricingSnapshot) : null;
  const stepTimings: Array<{ stepKey: string; duration: number }> = session.stepTimings ? JSON.parse(session.stepTimings) : [];

  // AI Sales Coach
  const coachData = useQuery(
    api.demoCoach.getCoachReport,
    session.aiCoachStatus ? { sessionId: session._id as any } : "skip",
  );

  const tier = session.verifiedScore != null ? scoreTierInfo(session.verifiedScore) : session.waterScore != null ? scoreTierInfo(session.waterScore) : null;

  return (
    <div className="rounded-2xl p-6 space-y-6" style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
            <FileText className="size-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h3 className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>Demo Report</h3>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>
              {new Date(session._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <span
          className="text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide"
          style={{
            background: session.outcome === "closed_won" ? `${colors.success}15` : session.outcome === "closed_lost" ? `${colors.critical}15` : `${colors.warning}15`,
            color: session.outcome === "closed_won" ? colors.success : session.outcome === "closed_lost" ? colors.critical : colors.warning,
          }}
        >
          {session.outcome.replace(/_/g, " ")}
        </span>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={Clock} label="Duration" value={formatDuration(session.durationSeconds)} color={colors.primary} />
        <StatCard icon={Droplets} label="AquaScore" value={session.waterScore?.toString() ?? "—"} color={tier?.color ?? colors.textMuted} />
        <StatCard icon={ShieldCheck} label="Verified" value={session.verifiedScore?.toString() ?? "—"} color={tier?.color ?? colors.textMuted} />
        <StatCard icon={Activity} label="Expenses" value={session.monthlyExpenses ? `$${session.monthlyExpenses}/mo` : "—"} color={colors.warning} />
      </div>

      {/* Score tier */}
      {tier && (
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: `${tier.color}08`, border: `1px solid ${tier.color}18` }}>
          <div className="text-[28px] font-black" style={{ color: tier.color }}>{session.verifiedScore ?? session.waterScore}</div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: tier.color }}>{tier.label}</p>
            <p className="text-[12px]" style={{ color: colors.textMuted }}>{tier.desc}</p>
          </div>
        </div>
      )}

      {/* Selected concerns */}
      {concerns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="size-4" style={{ color: colors.primary }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Customer Concerns</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) => (
              <span key={c} className="text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: `${colors.primary}10`, color: colors.primary }}>
                {CONCERN_LABELS[c] ?? c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live readings */}
      {Object.keys(readings).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="size-4" style={{ color: colors.warning }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Live Test Readings</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(readings).map(([key, val]) => {
              const info = READING_LABELS[key];
              if (!info || val == null) return null;
              return (
                <div key={key} className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                  <p className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>
                    {val}{info.unit && <span className="text-[10px] font-normal ml-0.5" style={{ color: colors.textFaint }}>{info.unit}</span>}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide mt-1" style={{ color: colors.textMuted }}>{info.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing snapshot */}
      {pricing && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="size-4" style={{ color: colors.success }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Investment</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>${pricing.currentPrice?.toLocaleString()}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide mt-1" style={{ color: colors.textMuted }}>Final Price</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>${pricing.monthlyPayment}/mo</p>
              <p className="text-[10px] font-medium uppercase tracking-wide mt-1" style={{ color: colors.textMuted }}>Monthly</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[16px] font-bold" style={{ color: colors.success }}>
                {pricing.discountsApplied?.length ?? 0}
              </p>
              <p className="text-[10px] font-medium uppercase tracking-wide mt-1" style={{ color: colors.textMuted }}>Discounts</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textFaint }}>Rep Notes</p>
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: colors.textSecondary }}>{session.notes}</p>
        </div>
      )}

      {/* Step timings */}
      {stepTimings.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textFaint }}>Time per Section</p>
          <div className="space-y-1">
            {stepTimings
              .filter((s) => s.duration > 0)
              .sort((a, b) => b.duration - a.duration)
              .slice(0, 8)
              .map((s) => {
                const maxDur = Math.max(...stepTimings.map((t) => t.duration));
                const pct = maxDur > 0 ? (s.duration / maxDur) * 100 : 0;
                return (
                  <div key={s.stepKey} className="flex items-center gap-3">
                    <span className="text-[11px] font-medium w-28 truncate" style={{ color: colors.textMuted }}>
                      {s.stepKey}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${colors.primary}10` }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colors.primary }} />
                    </div>
                    <span className="text-[11px] font-medium w-12 text-right" style={{ color: colors.textFaint }}>
                      {formatDuration(s.duration)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* AI Sales Coach Report */}
      {coachData && (
        <AICoachReport
          status={coachData.status}
          error={coachData.error}
          report={coachData.report}
          transcript={coachData.transcript}
        />
      )}
    </div>
  );
}
