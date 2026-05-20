import { AlertTriangle, Award, Shield, Sparkles, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";

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

export function DemoScoreReveal({ score, contaminants, report, onNext, onBack }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const s = score ?? 0;
  const info = tierInfo(s);

  // Animate score counter after reveal
  useEffect(() => {
    if (!revealed) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * s));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [revealed, s]);

  const circumference = 2 * Math.PI * 70;
  const offset = revealed
    ? circumference - (animatedScore / 100) * circumference
    : circumference;

  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health && !c.over_legal).length;

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
          <div className="relative">
            <div className="flex justify-center blur-xl opacity-50">
              <svg width="200" height="200">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  strokeWidth="12"
                  className="stroke-white/10"
                />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-black blur-lg opacity-40">
                {s}
              </span>
            </div>
          </div>

          <button
            onClick={() => setRevealed(true)}
            className="mx-auto flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold active:scale-[0.97] transition-transform"
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
          {/* Score Gauge */}
          <div className="text-center">
            <div className="relative inline-flex">
              <svg width="200" height="200" className="-rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  strokeWidth="12"
                  stroke="rgba(255,255,255,0.08)"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  strokeWidth="12"
                  stroke={info.color}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.33,1,0.68,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black">{animatedScore}</span>
                <span
                  className="text-sm font-bold mt-0.5"
                  style={{ color: info.color }}
                >
                  {info.emoji} {info.tier}
                </span>
              </div>
            </div>
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
                  {info.tier} Tier
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
