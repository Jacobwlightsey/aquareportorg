/* ──── Live Water Test ────
   Real-time reading input + score update. Surface cards, designTokens.
   ──── */

import { useAction } from "convex/react";
import { ArrowRight, Check, Droplets, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { playTapSound, playRevealSound, playPenaltySound } from "@/lib/demoSounds";
import { computeAquaScore, readingPayload, type FieldWaterReadings } from "@/lib/waterScore";
import { api } from "../../../convex/_generated/api";
import { ScoreGauge } from "./ScoreGauge";
import { colors } from "@/lib/designTokens";

interface Props {
  report: any;
  contaminants: any[];
  liveReadings: FieldWaterReadings;
  onUpdateReadings: (readings: FieldWaterReadings) => void;
  onNext: () => void;
  onBack: () => void;
}

function getSeverity(key: string, value: string): { label: string; color: string } | null {
  const v = parseFloat(value);
  if (isNaN(v)) return null;
  switch (key) {
    case "chlorine":
      if (v < 0.2) return { label: "Good", color: colors.success };
      if (v <= 1) return { label: "Elevated", color: colors.warning };
      if (v <= 2) return { label: "High", color: "#f97316" };
      if (v <= 4) return { label: "Severe", color: colors.critical };
      return { label: "Extreme", color: "#dc2626" };
    case "ph":
      if (v >= 6.8 && v <= 7.4) return { label: "Normal", color: colors.success };
      if (v >= 6.5 && v < 6.8) return { label: "Acidic", color: colors.warning };
      if (v < 6.5) return { label: "Very Acidic", color: colors.critical };
      if (v > 7.4 && v <= 8.5) return { label: "Slightly Alk", color: colors.warning };
      return { label: "High Alk", color: colors.critical };
    case "hardness":
      if (v <= 1) return { label: "Soft", color: colors.success };
      if (v <= 3.5) return { label: "Slightly Hard", color: "#22c55e" };
      if (v <= 7) return { label: "Moderate", color: colors.warning };
      if (v <= 10.5) return { label: "Hard", color: "#f97316" };
      if (v <= 15) return { label: "Very Hard", color: colors.critical };
      return { label: "Severe", color: "#dc2626" };
    case "tds":
      if (v <= 50) return { label: "Excellent", color: colors.success };
      if (v <= 150) return { label: "Good", color: "#22c55e" };
      if (v <= 300) return { label: "Elevated", color: colors.warning };
      if (v <= 500) return { label: "Acceptable", color: "#f97316" };
      if (v <= 1000) return { label: "High", color: colors.critical };
      return { label: "Severe", color: "#dc2626" };
    default:
      return null;
  }
}

function ReadingInput({ label, unit, value, placeholder, onChange, icon, color, fieldKey }: {
  label: string; unit: string; value: string; placeholder: string;
  onChange: (v: string) => void; icon: string; color: string; fieldKey: string;
}) {
  const severity = getSeverity(fieldKey, value);
  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: `${color}06`,
        border: `1px solid ${severity ? severity.color + "35" : color + "18"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${color}a0` }}>{label}</span>
        </div>
        {severity && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md animate-in fade-in"
            style={{ color: severity.color, background: `${severity.color}12`, border: `1px solid ${severity.color}25` }}
          >
            {severity.label}
          </span>
        )}
      </div>
      <div className="relative">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 rounded-lg px-4 text-[20px] font-bold outline-none transition-colors"
          style={{
            background: `${colors.textFaint}08`,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium" style={{ color: colors.textFaint }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

const LABELS: Record<string, { label: string; unit: string; icon: string }> = {
  chlorine: { label: "Chlorine", unit: "ppm", icon: "🧪" },
  hardness: { label: "Hardness", unit: "gpg", icon: "💎" },
  tds: { label: "TDS", unit: "ppm", icon: "💧" },
  ph: { label: "pH Level", unit: "", icon: "⚗️" },
};

export function DemoLiveTest({ report, contaminants, liveReadings, onUpdateReadings, onNext: _onNext, onBack: _onBack }: Props) {
  const [local, setLocal] = useState({
    chlorine: liveReadings.chlorine?.toString() || "",
    hardness: liveReadings.hardness?.toString() || "",
    tds: liveReadings.tds?.toString() || "",
    ph: liveReadings.ph?.toString() || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveInHomeTest = useAction(api.dealerShared.saveReportInHomeTest);

  const handleFieldChange = (key: string, value: string) => {
    const next = { ...local, [key]: value };
    setLocal(next);
    setSaved(false);
    const parsed: FieldWaterReadings = {};
    if (next.chlorine) parsed.chlorine = parseFloat(next.chlorine);
    if (next.hardness) parsed.hardness = parseFloat(next.hardness);
    if (next.tds) parsed.tds = parseFloat(next.tds);
    if (next.ph) parsed.ph = parseFloat(next.ph);
    onUpdateReadings(parsed);
  };

  const hasReadings = Object.values(local).some((v) => v !== "");

  const baseScore = computeAquaScore(report.waterScore, contaminants, {
    chlorine: report.chlorine, hardness: report.hardness, tds: report.tds, ph: report.ph,
  });

  const liveScore = computeAquaScore(report.waterScore, contaminants, {
    chlorine: local.chlorine ? parseFloat(local.chlorine) : report.chlorine,
    hardness: local.hardness ? parseFloat(local.hardness) : report.hardness,
    tds: local.tds ? parseFloat(local.tds) : report.tds,
    ph: local.ph ? parseFloat(local.ph) : report.ph,
  });

  const delta = liveScore - baseScore;

  /* Play descending penalty sound when score drops */
  const prevDeltaRef = useRef(0);
  useEffect(() => {
    if (delta < prevDeltaRef.current && delta < 0 && hasReadings) {
      playPenaltySound();
    }
    prevDeltaRef.current = delta;
  }, [delta, hasReadings]);

  const handleSaveAndSync = async () => {
    setSaving(true);
    try {
      const payload = readingPayload(local);
      await saveInHomeTest({ reportId: report._id, readings: payload, waterScore: liveScore });
      setSaved(true);
      playRevealSound();
      toast.success("Test results saved & synced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  const readingRows = (["chlorine", "hardness", "tds", "ph"] as const)
    .filter((key) => local[key] !== "")
    .map((key) => {
      const info = LABELS[key];
      const reportVal = report[key];
      const liveVal = parseFloat(local[key]);
      const severity = getSeverity(key, local[key]);
      return { key, ...info, reportVal, liveVal, severity };
    });

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
          LIVE TESTING
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">Live Water Test</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Enter readings — watch your score update in real time
        </p>
      </div>

      {/* Live Gauge */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={liveScore} size={180} animate={true} animationDuration={800} />
        {hasReadings && delta !== 0 && (
          <div
            className="mt-3 flex items-center gap-2 rounded-full px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{
              background: delta < 0 ? `${colors.critical}08` : `${colors.success}08`,
              border: `1px solid ${delta < 0 ? `${colors.critical}20` : `${colors.success}20`}`,
            }}
          >
            {delta < 0 ? <TrendingDown className="size-4" style={{ color: colors.critical }} /> : <TrendingUp className="size-4" style={{ color: colors.success }} />}
            <span className="text-[14px] font-bold" style={{ color: delta < 0 ? colors.critical : colors.success }}>
              {delta > 0 ? "+" : ""}{delta} from report score ({baseScore})
            </span>
          </div>
        )}
      </div>

      {/* Reading Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <ReadingInput label="Chlorine" unit="ppm" value={local.chlorine} placeholder="0.5" onChange={(v) => handleFieldChange("chlorine", v)} icon="🧪" color={colors.primary} fieldKey="chlorine" />
        <ReadingInput label="Hardness" unit="gpg" value={local.hardness} placeholder="7" onChange={(v) => handleFieldChange("hardness", v)} icon="💎" color="#8b5cf6" fieldKey="hardness" />
        <ReadingInput label="TDS" unit="ppm" value={local.tds} placeholder="350" onChange={(v) => handleFieldChange("tds", v)} icon="💧" color="#3b82f6" fieldKey="tds" />
        <ReadingInput label="pH Level" unit="" value={local.ph} placeholder="7.2" onChange={(v) => handleFieldChange("ph", v)} icon="⚗️" color={colors.success} fieldKey="ph" />
      </div>

      {/* Reading Comparison */}
      {readingRows.length > 0 && (
        <div className="rounded-2xl p-5 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: colors.textFaint }}>Reading Comparison</p>
          {readingRows.map((r) => (
            <div key={r.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{r.icon}</span>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>{r.label}</span>
              </div>
              <div className="flex items-center gap-2 text-[14px]">
                {r.reportVal != null && (
                  <>
                    <span className="line-through" style={{ color: `${colors.critical}70` }}>
                      {r.reportVal} {r.unit}
                    </span>
                    <ArrowRight className="size-3" style={{ color: colors.textFaint }} />
                  </>
                )}
                <span className="font-bold" style={{ color: r.severity?.color || colors.textPrimary }}>
                  {r.liveVal} {r.unit}
                </span>
                {r.severity && (
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                    style={{ color: r.severity.color, background: `${r.severity.color}12`, border: `1px solid ${r.severity.color}25` }}
                  >
                    {r.severity.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save & Sync */}
      {hasReadings && (
        <button
          onClick={handleSaveAndSync}
          disabled={saving || saved}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-bold active:scale-[0.97] transition-all disabled:opacity-60 cursor-pointer"
          style={{
            background: saved ? `${colors.success}12` : `linear-gradient(135deg, ${colors.primary}, #3b82f6)`,
            border: saved ? `1px solid ${colors.success}25` : "none",
            color: saved ? colors.success : "#fff",
          }}
        >
          {saving ? <><Loader2 className="size-4 animate-spin" />Saving & syncing...</>
            : saved ? <><Check className="size-4" />Saved & synced to myaquareport.com</>
            : <><Droplets className="size-4" />Save & Sync to Consumer</>}
        </button>
      )}
    </div>
  );
}
