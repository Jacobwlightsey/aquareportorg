/* ──── Score Reveal — "Your Water Score Is Ready" ────
   Left-aligned headline (matching mockup).
   Big gauge on right. Clean stats below.
   Cinematic 3-phase processing animation.
   ──── */

import { AlertTriangle, Award, Shield, Sparkles, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playRevealSound, playProcessingSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { ScoreGauge } from "./ScoreGauge";
import { DemoScoreExplainer } from "./DemoScoreExplainer";
import { colors, scoreColor } from "@/lib/designTokens";

interface Props {
  score?: number;
  contaminants: any[];
  report: any;
  onNext: () => void;
  onBack: () => void;
  skipScoreAnimation?: boolean;
  verifiedMode?: boolean;
  liveReadings?: Record<string, any>;
}

export function tierInfo(score: number) {
  if (score >= 80)
    return {
      tier: "Excellent", color: colors.warning, bg: `${colors.warning}12`,
      border: `${colors.warning}30`, icon: Award,
      desc: "Your water meets or exceeds all health guidelines. Outstanding quality.",
    };
  if (score >= 60)
    return {
      tier: "Good", color: colors.primary, bg: `${colors.primary}12`,
      border: `${colors.primary}30`, icon: Shield,
      desc: "Your water is mostly clean with a few areas worth monitoring.",
    };
  if (score >= 40)
    return {
      tier: "Needs Improvement", color: "#F59E0B", bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)", icon: AlertTriangle,
      desc: "Your water has some contaminants above recommended health levels.",
    };
  return {
    tier: "Needs Attention", color: colors.critical, bg: `${colors.critical}12`,
    border: `${colors.critical}30`, icon: TrendingDown,
    desc: "Your water has significant quality concerns that should be addressed.",
  };
}

type RevealPhase = 0 | 1 | 2 | 3;

const PHASE_DATA = [
  { label: "Analyzing your water data…", icon: "🔬" },
  { label: "Checking EPA & health guidelines…", icon: "✅" },
  { label: "Calculating your AquaScore…", icon: "🧮" },
  { label: "", icon: "" },
];

const PHASE_DURATION = 2000;

export function DemoScoreReveal({
  score, contaminants, report, onNext: _onNext, onBack: _onBack,
  skipScoreAnimation = false, verifiedMode = false, liveReadings,
}: Props) {
  const s = score ?? 0;
  const info = tierInfo(s);
  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health && !c.over_legal).length;

  const [phase, setPhase] = useState<RevealPhase | null>(
    skipScoreAnimation || verifiedMode ? 3 : null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrambleNum, setScrambleNum] = useState(0);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const detected = useCountUp(contaminants.length, 1000, 300, phase === 3);
  const healthCount = useCountUp(overHealth, 1000, 500, phase === 3);
  const legalCount = useCountUp(overLegal, 1000, 700, phase === 3);

  useEffect(() => {
    if (phase === null || phase >= 3) return;
    playProcessingSound();
    if (phase === 2) {
      scrambleRef.current = setInterval(() => {
        setScrambleNum(Math.floor(Math.random() * 100));
      }, 60);
    }
    timerRef.current = setTimeout(() => {
      const next = (phase + 1) as RevealPhase;
      setPhase(next);
      if (next === 3) {
        if (scrambleRef.current) clearInterval(scrambleRef.current);
        playRevealSound();
        haptic("medium");
      }
    }, PHASE_DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  useEffect(() => {
    return () => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const skipToReveal = useCallback(() => {
    if (phase !== null && phase < 3) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (scrambleRef.current) clearInterval(scrambleRef.current);
      setPhase(3);
      playRevealSound();
      haptic("medium");
    }
  }, [phase]);

  const handleStart = () => {
    if (skipScoreAnimation) {
      setPhase(3); playRevealSound(); haptic("medium");
    } else {
      setPhase(0);
    }
  };

  return (
    <div className="mx-auto max-w-lg pt-6" onClick={skipToReveal}>
      {/* Pre-start */}
      {phase === null && (
        <div className="text-center space-y-10">
          <div className="space-y-3">
            <Sparkles className="mx-auto size-8 animate-pulse" style={{ color: colors.warning }} />
            <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight">Your AquaScore</h2>
            <p className="text-[15px]" style={{ color: colors.textMuted }}>
              Based on {contaminants.length} detected contaminants from {report.utilityName}
            </p>
          </div>
          <div className="relative flex justify-center">
            <div className="blur-xl opacity-40">
              <ScoreGauge score={s} size={200} animate={false} />
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            className="mx-auto flex items-center gap-2 rounded-2xl px-8 py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
              boxShadow: `0 4px 24px ${info.color}30`,
            }}
          >
            <Sparkles className="size-5" />
            Reveal Your Score
          </button>
        </div>
      )}

      {/* Phases 0-2: processing */}
      {phase !== null && phase < 3 && (
        <div className="text-center space-y-10 py-12">
          <div className="text-5xl animate-bounce">{PHASE_DATA[phase].icon}</div>
          <div>
            <p className="text-[18px] font-semibold animate-pulse" style={{ color: colors.textPrimary }}>
              {PHASE_DATA[phase].label}
            </p>
            <p className="text-[13px] mt-3" style={{ color: colors.textFaint }}>Tap anywhere to skip</p>
          </div>
          {phase === 2 && (
            <div className="flex justify-center">
              <div className="text-[64px] font-black tabular-nums" style={{ color: colors.textFaint }}>
                {scrambleNum}
              </div>
            </div>
          )}
          {phase < 2 && (
            <div className="flex justify-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full"
                  style={{
                    height: `${20 + Math.random() * 40}px`,
                    background: `linear-gradient(to top, ${colors.primary}, #3b82f6)`,
                    animation: `pulse 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    opacity: 0.3 + Math.random() * 0.5,
                  }}
                />
              ))}
            </div>
          )}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((p) => (
              <div
                key={p}
                className="size-2 rounded-full transition-all duration-300"
                style={{
                  background: p === phase ? colors.primary : p < phase ? `${colors.primary}60` : "rgba(255,255,255,0.1)",
                  transform: p === phase ? "scale(1.25)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: revealed */}
      {phase === 3 && (
        <>
          {/* Verified mode header */}
          {verifiedMode && (
            <div className="text-center mb-8">
              <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.success}90` }}>
                Verified Results
              </p>
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3">
                Your Verified Water Score
              </h2>
              <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
                Local data confirmed with today's live test.
              </p>
            </div>
          )}

          {/* Score headline + Gauge — side by side on tablet, stacked on mobile */}
          {!verifiedMode && (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-10">
              {/* Left: headline */}
              <div className="sm:flex-1 text-center sm:text-left sm:pt-8">
                <h2 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-tight">
                  Your Water Score<br />Is Ready
                </h2>
                <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
                  We analyzed your water quality and compared it to healthy water standards.
                </p>
                <p className="text-[13px] mt-4 flex items-center sm:justify-start justify-center gap-1.5" style={{ color: colors.textFaint }}>
                  <span className="size-1.5 rounded-full" style={{ background: colors.textFaint }} />
                  Data from {report.utilityName}
                </p>
              </div>
              {/* Right: gauge */}
              <div className="shrink-0">
                <ScoreGauge score={s} size={200} animationDuration={2800} />
              </div>
            </div>
          )}

          {verifiedMode && (
            <div className="flex flex-col items-center mb-10">
              <ScoreGauge score={s} size={220} animate={!verifiedMode} animationDuration={2000} />
            </div>
          )}

          {/* Tier label */}
          <div className="text-center mb-8">
            <span
              className="text-[16px] font-semibold"
              style={{ color: info.color }}
            >
              {info.tier}
            </span>
          </div>

          {/* Verified mode: live readings */}
          {verifiedMode && liveReadings && Object.keys(liveReadings).length > 0 && (
            <div className="rounded-2xl p-5 space-y-3 mb-8" style={{ background: `${colors.success}08` }}>
              <p className="text-[12px] font-medium tracking-wide uppercase" style={{ color: `${colors.success}90` }}>
                Live Test Confirmed
              </p>
              {[
                { key: "chlorine", label: "Chlorine", unit: "ppm" },
                { key: "ph", label: "pH Level", unit: "" },
                { key: "hardness", label: "Hardness", unit: "gpg" },
                { key: "tds", label: "TDS", unit: "ppm" },
              ]
                .filter((r) => liveReadings[r.key] != null)
                .map((r) => (
                  <div key={r.key} className="flex items-center justify-between">
                    <span className="text-[15px]" style={{ color: colors.textSecondary }}>{r.label}</span>
                    <span className="text-[15px] font-semibold" style={{ color: colors.success }}>
                      {liveReadings[r.key]} {r.unit}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {/* Score Explainer */}
          <div className="mb-8">
            <DemoScoreExplainer currentScore={s} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="rounded-xl p-4 text-center" style={{ background: colors.surface }}>
              <p className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>{detected}</p>
              <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: colors.textFaint }}>
                Detected
              </p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: `${colors.warning}10` }}>
              <p className="text-[24px] font-bold" style={{ color: colors.warning }}>{healthCount}</p>
              <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: `${colors.warning}80` }}>
                Health
              </p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: `${colors.critical}10` }}>
              <p className="text-[24px] font-bold" style={{ color: colors.critical }}>{legalCount}</p>
              <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: `${colors.critical}80` }}>
                Legal
              </p>
            </div>
          </div>

          {/* What this means */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: colors.surface }}>
            <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
              What This Means
            </p>
            <div className="space-y-3">
              {overLegal > 0 && (
                <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  <strong style={{ color: colors.critical }}>
                    {overLegal} contaminant{overLegal > 1 ? "s" : ""}
                  </strong>{" "}
                  exceed{overLegal === 1 ? "s" : ""} federal legal limits.
                </p>
              )}
              {overHealth > 0 && (
                <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  <strong style={{ color: colors.warning }}>
                    {overHealth} contaminant{overHealth > 1 ? "s" : ""}
                  </strong>{" "}
                  exceed{overHealth === 1 ? "s" : ""} health guidelines.
                </p>
              )}
              <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
                The good news: <strong style={{ color: colors.success }}>this is fixable</strong> with the right filtration system.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
