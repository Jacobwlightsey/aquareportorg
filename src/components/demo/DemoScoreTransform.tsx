import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { playRevealSound, playCelebrationSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  score: number;
  report: any;
  company: any;
  contaminants: any[];
  liveReadings: Record<string, any>;
  projectedScore: number;
  onNext: () => void;
}

const IDEAL_READINGS: Record<string, number> = { chlorine: 0.02, ph: 7, hardness: 0.3, tds: 25 };

function readingRows(readings: Record<string, any>, report: any) {
  const current = {
    chlorine: readings.chlorine ?? report.chlorine,
    hardness: readings.hardness ?? report.hardness,
    tds: readings.tds ?? report.tds,
    ph: readings.ph ?? report.ph,
  };
  const labels: Record<string, { label: string; unit: string; icon: string }> = {
    chlorine: { label: "Chlorine", unit: "ppm", icon: "🧪" },
    ph: { label: "pH Level", unit: "", icon: "⚗️" },
    hardness: { label: "Hardness", unit: "gpg", icon: "💎" },
    tds: { label: "TDS", unit: "ppm", icon: "💧" },
  };
  return Object.entries(current)
    .filter(([, v]) => v != null)
    .map(([key, val]) => ({
      key,
      label: labels[key]?.label ?? key,
      icon: labels[key]?.icon ?? "💧",
      unit: labels[key]?.unit ?? "",
      before: Number(val),
      after: IDEAL_READINGS[key] ?? Number(val),
    }));
}

export function DemoScoreTransform({ score, report, company, contaminants, liveReadings, projectedScore, onNext }: Props) {
  const [transformed, setTransformed] = useState(false);
  const companyColor = company?.primaryColor || report.companyColor || "#2563eb";
  const displayScore = transformed ? projectedScore : score;
  const rows = readingRows(liveReadings, report);

  const handleTransform = () => {
    setTransformed(true);
    playRevealSound();
    setTimeout(() => playCelebrationSound(), 2000); // celebration when animation finishes
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 border border-violet-500/30 rounded-full px-3 py-1">
          YOUR TRANSFORMATION
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          {transformed ? "Your New Water Score" : "Ready to See the Difference?"}
        </h2>
        <p className="text-sm text-white/50 mt-1">
          {transformed
            ? "This is what whole-home filtration does for your water"
            : "See how we can transform your water quality"}
        </p>
      </div>

      {/* Score gauge */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={displayScore} size={200} animationDuration={transformed ? 2500 : 1200} />
        {transformed && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <TrendingUp className="size-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">+{projectedScore - score} point improvement</span>
          </div>
        )}
      </div>

      {/* Before/After readings (shown after transform) */}
      {transformed && rows.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Reading Comparison</p>
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between">
              <span className="text-sm text-white/70">
                {r.icon} {r.label}
              </span>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-red-400/70 line-through">
                  {r.before} {r.unit}
                </span>
                <ArrowRight className="size-3 text-white/30" />
                <span className="text-emerald-400 font-bold">
                  {r.after} {r.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transform button OR continue */}
      {!transformed ? (
        <button
          onClick={handleTransform}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-all cursor-pointer relative overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, ${companyColor}, #8b5cf6)`,
            boxShadow: `0 4px 24px ${companyColor}40`,
          }}
        >
          <Sparkles className="size-5" />
          Transform Your Water →
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${companyColor}, #06b6d4)`,
            boxShadow: `0 4px 24px ${companyColor}30`,
          }}
        >
          See Your System →
        </button>
      )}
    </div>
  );
}
