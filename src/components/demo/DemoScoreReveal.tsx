import { AlertTriangle, Award, Shield, Sparkles, TrendingDown } from "lucide-react";
import { useState } from "react";
import { playRevealSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  score?: number;
  contaminants: any[];
  report: any;
  onNext: () => void;
  onBack: () => void;
}

function tierInfo(score: number) {
  if (score >= 80)
    return {
      tier: "Gold",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
      icon: Award,
      desc: "Your water meets most health guidelines with minimal concern.",
      emoji: "🏆",
    };
  if (score >= 60)
    return {
      tier: "Silver",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.12)",
      border: "rgba(148,163,184,0.3)",
      icon: Shield,
      desc: "Your water has some areas of concern worth addressing.",
      emoji: "🥈",
    };
  if (score >= 40)
    return {
      tier: "Bronze",
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      border: "rgba(249,115,22,0.3)",
      icon: AlertTriangle,
      desc: "Your water has several contaminants above recommended levels.",
      emoji: "⚠️",
    };
  return {
    tier: "At Risk",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    icon: TrendingDown,
    desc: "Your water has significant quality concerns that should be addressed.",
    emoji: "🚨",
  };
}

export function DemoScoreReveal({ score, contaminants, report, onNext: _onNext, onBack: _onBack }: Props) {
  const [revealed, setRevealed] = useState(false);
  const s = score ?? 0;
  const info = tierInfo(s);

  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health && !c.over_legal).length;

  const handleReveal = () => {
    setRevealed(true);
    playRevealSound();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      {/* Pre-reveal or post-reveal */}
      {!revealed ? (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <Sparkles className="mx-auto size-8 text-amber-400 animate-pulse" />
            <h2 className="text-2xl font-black">Your AquaScore</h2>
            <p className="text-sm text-white/50">
              Based on {contaminants.length} detected contaminants from{" "}
              {report.utilityName}
            </p>
          </div>

          {/* Blurred preview */}
          <div className="relative flex justify-center">
            <div className="blur-xl opacity-40">
              <ScoreGauge score={s} size={200} animate={false} />
            </div>
          </div>

          <button
            onClick={handleReveal}
            className="mx-auto flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
              boxShadow: `0 4px 24px ${info.color}40`,
            }}
          >
            <Sparkles className="size-5" />
            Reveal Your Score
          </button>
        </div>
      ) : (
        <>
          {/* Animated Score Gauge */}
          <div className="flex flex-col items-center pt-2">
            <ScoreGauge score={s} size={220} animate={true} animationDuration={2000} />
          </div>

          {/* Tier Explanation */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: info.bg,
              border: `1px solid ${info.border}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <info.icon className="size-6" style={{ color: info.color }} />
              <div>
                <p className="font-bold" style={{ color: info.color }}>
                  {info.emoji} {info.tier} Tier
                </p>
                <p className="text-xs text-white/50">AquaScore {s}/100</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{info.desc}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-2xl font-black">{contaminants.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Detected
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{overHealth}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/60">
                Health
              </p>
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
              <p className="text-2xl font-black text-red-400">{overLegal}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60">
                Legal
              </p>
            </div>
          </div>

          {/* What this means */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              What This Means for Your Family
            </p>
            <div className="space-y-2.5 text-sm text-white/70">
              {overLegal > 0 && (
                <p>
                  🚨 <strong className="text-red-400">{overLegal} contaminant{overLegal > 1 ? "s" : ""}</strong>{" "}
                  exceed{overLegal === 1 ? "s" : ""} federal legal limits — this is above what the EPA considers safe.
                </p>
              )}
              {overHealth > 0 && (
                <p>
                  ⚠️ <strong className="text-amber-400">{overHealth} contaminant{overHealth > 1 ? "s" : ""}</strong>{" "}
                  exceed{overHealth === 1 ? "s" : ""} health guidelines — linked to long-term health effects.
                </p>
              )}
              <p>
                💧 Your water is being consumed by everyone in your household — every glass, every shower, every meal.
              </p>
              <p>
                ✅ The good news: <strong className="text-emerald-400">this is fixable</strong> with the right filtration system.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
