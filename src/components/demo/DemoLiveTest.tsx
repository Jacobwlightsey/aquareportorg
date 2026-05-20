import { useAction } from "convex/react";
import { Check, Droplets, FlaskConical, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  computeAquaScore,
  readingPayload,
  type FieldWaterReadings,
} from "@/lib/waterScore";
import { api } from "../../../convex/_generated/api";

interface Props {
  report: any;
  contaminants: any[];
  liveReadings: FieldWaterReadings;
  onUpdateReadings: (readings: FieldWaterReadings) => void;
  onNext: () => void;
  onBack: () => void;
}

function ReadingInput({
  label,
  unit,
  value,
  placeholder,
  onChange,
  icon,
  color,
}: {
  label: string;
  unit: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  icon: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: `${color}aa` }}
        >
          {label}
        </span>
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

export function DemoLiveTest({
  report,
  contaminants,
  liveReadings,
  onUpdateReadings,
  onNext,
  onBack,
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

    // Update parent's live readings for real-time score calculation
    const parsed: FieldWaterReadings = {};
    if (next.chlorine) parsed.chlorine = parseFloat(next.chlorine);
    if (next.hardness) parsed.hardness = parseFloat(next.hardness);
    if (next.tds) parsed.tds = parseFloat(next.tds);
    if (next.ph) parsed.ph = parseFloat(next.ph);
    onUpdateReadings(parsed);
  };

  const hasReadings = Object.values(local).some((v) => v !== "");

  // Compute live score
  const currentScore = computeAquaScore(report.waterScore, contaminants, {
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

  const delta = liveScore - currentScore;

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
      toast.success("Test results saved & synced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-3">
          <FlaskConical className="size-7 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-black">Live Water Test</h2>
        <p className="text-sm text-white/50 mt-1">
          Enter readings from your test kit — score updates in real time
        </p>
      </div>

      {/* Live Score Display */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Live AquaScore
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black">{liveScore}</span>
              {hasReadings && delta !== 0 && (
                <span
                  className={`text-sm font-bold ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              Report Score
            </p>
            <p className="text-lg font-bold text-white/50 mt-1">{currentScore}</p>
          </div>
        </div>
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
        />
        <ReadingInput
          label="Hardness"
          unit="ppm"
          value={local.hardness}
          placeholder="120"
          onChange={(v) => handleFieldChange("hardness", v)}
          icon="💎"
          color="#8b5cf6"
        />
        <ReadingInput
          label="TDS"
          unit="ppm"
          value={local.tds}
          placeholder="350"
          onChange={(v) => handleFieldChange("tds", v)}
          icon="💧"
          color="#3b82f6"
        />
        <ReadingInput
          label="pH Level"
          unit=""
          value={local.ph}
          placeholder="7.2"
          onChange={(v) => handleFieldChange("ph", v)}
          icon="⚗️"
          color="#10b981"
        />
      </div>

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

      {/* What this tests */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
          What These Readings Tell Us
        </p>
        <div className="space-y-3 text-sm text-white/60">
          <div>
            <p className="font-semibold text-white/80">🧪 Chlorine</p>
            <p>Disinfection byproduct — safe at 0.2-2 ppm, concerning above 4 ppm</p>
          </div>
          <div>
            <p className="font-semibold text-white/80">💎 Hardness</p>
            <p>Mineral content — soft below 60, hard above 180 ppm. Affects appliances & skin</p>
          </div>
          <div>
            <p className="font-semibold text-white/80">💧 Total Dissolved Solids</p>
            <p>Overall mineral/contaminant load — ideal below 300, concerning above 500 ppm</p>
          </div>
          <div>
            <p className="font-semibold text-white/80">⚗️ pH Level</p>
            <p>Acidity/alkalinity — ideal 6.5-8.5. Outside this range can corrode pipes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
