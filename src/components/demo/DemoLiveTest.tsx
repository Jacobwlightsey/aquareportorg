import { useAction } from "convex/react";
import { ArrowRight, Check, Droplets, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { playTapSound, playRevealSound } from "@/lib/demoSounds";
import {
  computeAquaScore,
  readingPayload,
  type FieldWaterReadings,
} from "@/lib/waterScore";
import { api } from "../../../convex/_generated/api";
import { ScoreGauge } from "./ScoreGauge";

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
      if (v < 0.2) return { label: "Good", color: "#10b981" };
      if (v <= 1) return { label: "Elevated", color: "#f59e0b" };
      if (v <= 2) return { label: "High", color: "#f97316" };
      if (v <= 4) return { label: "Severe", color: "#ef4444" };
      return { label: "Extreme", color: "#dc2626" };
    case "ph":
      if (v >= 6.8 && v <= 7.4) return { label: "Normal", color: "#10b981" };
      if (v >= 6.5 && v < 6.8) return { label: "Acidic", color: "#f59e0b" };
      if (v < 6.5) return { label: "Very Acidic", color: "#ef4444" };
      if (v > 7.4 && v <= 8.5) return { label: "Slightly Alk", color: "#f59e0b" };
      return { label: "High Alk", color: "#ef4444" };
    case "hardness":
      if (v <= 1) return { label: "Soft", color: "#10b981" };
      if (v <= 3.5) return { label: "Slightly Hard", color: "#22c55e" };
      if (v <= 7) return { label: "Moderate", color: "#f59e0b" };
      if (v <= 10.5) return { label: "Hard", color: "#f97316" };
      if (v <= 15) return { label: "Very Hard", color: "#ef4444" };
      return { label: "Severe", color: "#dc2626" };
    case "tds":
      if (v <= 50) return { label: "Excellent", color: "#10b981" };
      if (v <= 150) return { label: "Good", color: "#22c55e" };
      if (v <= 300) return { label: "Elevated", color: "#f59e0b" };
      if (v <= 500) return { label: "Acceptable", color: "#f97316" };
      if (v <= 1000) return { label: "High", color: "#ef4444" };
      return { label: "Severe", color: "#dc2626" };
    default:
      return null;
  }
}

function ReadingInput({
  label,
  unit,
  value,
  placeholder,
  onChange,
  icon,
  color,
  fieldKey,
}: {
  label: string;
  unit: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  icon: string;
  color: string;
  fieldKey: string;
}) {
  const severity = getSeverity(fieldKey, value);
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: `${color}08`,
        border: `1px solid ${severity ? severity.color + "40" : color + "25"}`,
        transition: "border-color 0.3s ease",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: `${color}aa` }}
          >
            {label}
          </span>
        </div>
        {severity && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-in fade-in slide-in-from-right-2 duration-300"
            style={{
              color: severity.color,
              background: `${severity.color}15`,
              border: `1px solid ${severity.color}30`,
            }}
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
          className="w-full h-12 rounded-lg bg-white/[0.06] border border-white/10 px-4 text-xl font-bold text-white outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-white/30">
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

export function DemoLiveTest({
  report,
  contaminants,
  liveReadings,
  onUpdateReadings,
  onNext: _onNext,
  onBack: _onBack,
}: Props) {
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

  // Compute live score — updates in real-time as readings change
  const baseScore = computeAquaScore(report.waterScore, contaminants, {
    chlorine: report.chlorine,
    hardness: report.hardness,
    tds: report.tds,
    ph: report.ph,
  });

  const liveScore = computeAquaScore(report.waterScore, contaminants, {
    chlorine: local.chlorine ? parseFloat(local.chlorine) : report.chlorine,
    hardness: local.hardness ? parseFloat(local.hardness) : report.hardness,
    tds: local.tds ? parseFloat(local.tds) : report.tds,
    ph: local.ph ? parseFloat(local.ph) : report.ph,
  });

  const delta = liveScore - baseScore;

  const handleSaveAndSync = async () => {
    setSaving(true);
    try {
      const payload = readingPayload(local);
      await saveInHomeTest({
        reportId: report._id,
        readings: payload,
        waterScore: liveScore,
      });
      setSaved(true);
      playRevealSound();
      toast.success("Test results saved & synced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  // Build reading comparison rows (same style as DemoScoreTransform)
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
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
          LIVE TESTING
        </span>
        <h2 className="text-2xl font-black mt-3">Live Water Test</h2>
        <p className="text-sm text-white/50 mt-1">
          Enter readings — watch your score update in real time
        </p>
      </div>

      {/* Live AquaScore Gauge */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge
          score={liveScore}
          size={180}
          animate={true}
          animationDuration={800}
        />
        {hasReadings && delta !== 0 && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-full px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500 ${
              delta < 0
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-emerald-500/10 border border-emerald-500/20"
            }`}
          >
            {delta < 0 ? (
              <TrendingDown className="size-4 text-red-400" />
            ) : (
              <TrendingUp className="size-4 text-emerald-400" />
            )}
            <span
              className={`text-sm font-bold ${delta < 0 ? "text-red-400" : "text-emerald-400"}`}
            >
              {delta > 0 ? "+" : ""}
              {delta} from report score ({baseScore})
            </span>
          </div>
        )}
      </div>

      {/* Reading Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <ReadingInput
          label="Chlorine"
          unit="ppm"
          value={local.chlorine}
          placeholder="0.5"
          onChange={(v) => handleFieldChange("chlorine", v)}
          icon="🧪"
          color="#06b6d4"
          fieldKey="chlorine"
        />
        <ReadingInput
          label="Hardness"
          unit="gpg"
          value={local.hardness}
          placeholder="7"
          onChange={(v) => handleFieldChange("hardness", v)}
          icon="💎"
          color="#8b5cf6"
          fieldKey="hardness"
        />
        <ReadingInput
          label="TDS"
          unit="ppm"
          value={local.tds}
          placeholder="350"
          onChange={(v) => handleFieldChange("tds", v)}
          icon="💧"
          color="#3b82f6"
          fieldKey="tds"
        />
        <ReadingInput
          label="pH Level"
          unit=""
          value={local.ph}
          placeholder="7.2"
          onChange={(v) => handleFieldChange("ph", v)}
          icon="⚗️"
          color="#10b981"
          fieldKey="ph"
        />
      </div>

      {/* Reading Comparison — appears as readings are entered (same style as DemoScoreTransform) */}
      {readingRows.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Reading Comparison</p>
          {readingRows.map((r) => (
            <div key={r.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{r.icon}</span>
                <span className="text-sm text-white/70">{r.label}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {r.reportVal != null && (
                  <>
                    <span className="text-red-400/70 line-through">
                      {r.reportVal} {r.unit}
                    </span>
                    <ArrowRight className="size-3 text-white/30" />
                  </>
                )}
                <span className="font-bold" style={{ color: r.severity?.color || "#fff" }}>
                  {r.liveVal} {r.unit}
                </span>
                {r.severity && (
                  <span
                    className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                    style={{
                      color: r.severity.color,
                      background: `${r.severity.color}15`,
                      border: `1px solid ${r.severity.color}30`,
                    }}
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
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold active:scale-[0.97] transition-all disabled:opacity-60"
          style={{
            background: saved
              ? "rgba(16,185,129,0.15)"
              : "linear-gradient(135deg, #06b6d4, #3b82f6)",
            border: saved ? "1px solid rgba(16,185,129,0.3)" : "none",
            color: saved ? "#10b981" : "#fff",
          }}
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving & syncing...
            </>
          ) : saved ? (
            <>
              <Check className="size-4" />
              Saved & synced to myaquareport.com
            </>
          ) : (
            <>
              <Droplets className="size-4" />
              Save & Sync to Consumer
            </>
          )}
        </button>
      )}
    </div>
  );
}
