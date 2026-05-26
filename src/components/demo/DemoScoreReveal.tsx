/* ──── Score Reveal — "Your Water Score Is Ready" ────
   Mockup-faithful: always side-by-side (headline left, gauge right).
   "OUT OF 100" label below score. Tier label left-aligned.
   Data source citation at bottom-left.
   ──── */

import { AlertTriangle, ArrowRight, Award, Shield, Sparkles, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playRevealSound, playProcessingSound, haptic } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { DemoScoreExplainer } from "./DemoScoreExplainer";
import { colors } from "@/lib/designTokens";

/** Per-reading severity color for verified score display */
function readingSeverityColor(key: string, value: number): string {
  switch (key) {
    case "chlorine":
      if (value < 0.2) return colors.success;
      if (value <= 1) return colors.warning;
      return colors.critical;
    case "ph":
      if (value >= 6.8 && value <= 7.4) return colors.success;
      if ((value >= 6.5 && value < 6.8) || (value > 7.4 && value <= 8.5)) return colors.warning;
      return colors.critical;
    case "hardness":
      if (value <= 3.5) return colors.success;
      if (value <= 7) return colors.warning;
      return colors.critical;
    case "tds":
      if (value <= 150) return colors.success;
      if (value <= 300) return colors.warning;
      return colors.critical;
    default:
      return colors.textSecondary;
  }
}

/** Severity label for live test readings */
function getSeverityLabel(key: string, value: number): string | null {
  switch (key) {
    case "chlorine":
      if (value < 0.2) return "Normal";
      if (value <= 1) return "Elevated";
      if (value <= 2) return "High";
      if (value <= 4) return "Severe";
      return "Extreme";
    case "ph":
      if (value >= 6.8 && value <= 7.4) return "Normal";
      if (value >= 6.5 && value < 6.8) return "Acidic";
      if (value < 6.5) return "Very Acidic";
      if (value > 7.4 && value <= 8.5) return "Slightly Alk";
      return "High Alk";
    case "hardness":
      if (value <= 1) return "Soft";
      if (value <= 3.5) return "Normal";
      if (value <= 7) return "Moderate";
      if (value <= 10.5) return "Hard";
      if (value <= 15) return "Very Hard";
      return "Extreme";
    case "tds":
      if (value <= 50) return "Excellent";
      if (value <= 150) return "Normal";
      if (value <= 300) return "Elevated";
      if (value <= 500) return "High";
      return "Severe";
    default:
      return null;
  }
}

interface Props {
  score?: number;
  contaminants: any[];
  report: any;
  onNext: () => void;
  onBack: () => void;
  skipScoreAnimation?: boolean;
  verifiedMode?: boolean;
  liveReadings?: Record<string, any>;
  /** Report-only score (before live test), used for before→after in verified mode */
  beforeScore?: number;
}

export function tierInfo(score: number) {
  if (score >= 80)
    return {
      tier: "Gold", color: colors.success, bg: `${colors.success}12`,
      border: `${colors.success}30`, icon: Award,
      desc: "Your water meets or exceeds all health guidelines. Outstanding quality.",
    };
  if (score >= 60)
    return {
      tier: "Silver", color: colors.primary, bg: `${colors.primary}12`,
      border: `${colors.primary}30`, icon: Shield,
      desc: "Your water is mostly clean with a few areas worth monitoring.",
    };
  if (score >= 40)
    return {
      tier: "Bronze", color: colors.warning, bg: `${colors.warning}12`,
      border: `${colors.warning}30`, icon: AlertTriangle,
      desc: "Your water has some contaminants above recommended health levels.",
    };
  return {
    tier: "At Risk", color: colors.critical, bg: `${colors.critical}12`,
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
  skipScoreAnimation = false, verifiedMode = false, liveReadings, beforeScore,
}: Props) {
  const s = score ?? 0;
  const info = tierInfo(s);

  const [phase, setPhase] = useState<RevealPhase | null>(
    skipScoreAnimation || verifiedMode ? 3 : null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrambleNum, setScrambleNum] = useState(0);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <div className="mx-auto w-full max-w-5xl px-8 pt-8" onClick={skipToReveal}>
      {/* Pre-start */}
      {phase === null && (
        <div className="flex flex-col items-center text-center">
          <div className="space-y-3 mb-5">
            <Sparkles className="mx-auto size-8 animate-pulse" style={{ color: colors.warning }} />
            <h2 className="text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              Your AquaScore
            </h2>
            <p className="text-[15px] max-w-md mx-auto" style={{ color: colors.textMuted }}>
              Based on {contaminants.length} detected contaminants from {report.utilityName}
            </p>
          </div>

          {/* AquaScore Explainer — answers "what's an AquaScore?" before the reveal */}
          <div className="max-w-md mx-auto rounded-2xl p-5 text-left space-y-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
              WHAT IS AN AQUASCORE?
            </p>
            <p className="text-[14px] leading-relaxed" style={{ color: colors.textSecondary }}>
              Your AquaScore is a <strong style={{ color: colors.textPrimary }}>0–100 rating</strong> of your home's water quality. It's calculated by comparing contaminants found in your local water supply against EPA legal limits and EWG health guidelines.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[
                { range: "80–100", label: "Gold", color: colors.success },
                { range: "60–79", label: "Silver", color: colors.primary },
                { range: "40–59", label: "Bronze", color: colors.warning },
                { range: "0–39", label: "At Risk", color: colors.critical },
              ].map((t) => (
                <div key={t.label} className="flex flex-col items-center gap-1 py-2 rounded-xl" style={{ background: `${t.color}08`, border: `1px solid ${t.color}18` }}>
                  <div className="size-2 rounded-full" style={{ background: t.color }} />
                  <span className="text-[11px] font-bold" style={{ color: t.color }}>{t.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: colors.textFaint }}>{t.range}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleStart(); }}
            className="flex items-center gap-2 rounded-2xl px-10 py-5 text-[18px] font-bold active:scale-[0.97] transition-transform cursor-pointer mt-6"
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
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center space-y-10">
          <div className="text-5xl animate-bounce">{PHASE_DATA[phase].icon}</div>
          <div>
            <p className="text-[20px] font-semibold animate-pulse" style={{ color: colors.textPrimary }}>
              {PHASE_DATA[phase].label}
            </p>
            <p className="text-[13px] mt-3 sr-only" style={{ color: colors.textFaint }}>Tap anywhere to skip</p>
          </div>
          {phase === 2 && (
            <div className="text-[72px] font-black tabular-nums" style={{ color: colors.textFaint }}>
              {scrambleNum}
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
                    background: colors.primary,
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
          {/* ── Main layout: centered gauge with content below ── */}
          {!verifiedMode && (
            <div className="text-center mb-8">
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight" style={{ color: colors.textPrimary }}>
                Your Water Score Is Ready
              </h2>
              <p className="text-[15px] mt-3 max-w-md mx-auto" style={{ color: colors.textMuted, lineHeight: 1.6 }}>
                Your AquaScore is a 0–100 rating of your water quality based on contaminants found in your local utility data, compared against EPA legal limits and EWG health guidelines.
              </p>
            </div>
          )}

          {verifiedMode && (
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: `${colors.success}b0` }}>
                Verified Results
              </p>
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3 text-center" style={{ color: colors.textPrimary }}>
                Your Verified Water Score
              </h2>
              <p className="text-[15px] mt-2 text-center" style={{ color: colors.textMuted }}>
                Local data confirmed with today's live test.
              </p>
            </div>
          )}

          {/* Centered gauge */}
          <div className="flex flex-col items-center mb-8">
            <ScoreGauge score={s} size={220} animationDuration={2800} />
            <p className="text-[12px] font-medium uppercase tracking-wide mt-3" style={{ color: colors.textMuted }}>
              OUT OF 100
            </p>
            {/* Tier badge */}
            <div
              className="mt-4 rounded-full px-5 py-2 flex items-center gap-2"
              style={{ background: info.bg, border: `1px solid ${info.border}` }}
            >
              <info.icon className="size-4" style={{ color: info.color }} />
              <span className="text-[14px] font-bold" style={{ color: info.color }}>
                {info.tier} — {info.desc}
              </span>
            </div>
          </div>

          {/* Verified mode: live readings + before→after comparison */}
          {verifiedMode && liveReadings && Object.keys(liveReadings).length > 0 && (
            <div className="max-w-lg mx-auto rounded-2xl p-5 space-y-3 mb-6" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
                Live Test Results
              </p>
              {[
                { key: "chlorine", label: "Chlorine", unit: "ppm" },
                { key: "ph", label: "pH Level", unit: "" },
                { key: "hardness", label: "Hardness", unit: "gpg" },
                { key: "tds", label: "TDS", unit: "ppm" },
              ]
                .filter((r) => liveReadings[r.key] != null)
                .map((r) => {
                  const val = parseFloat(String(liveReadings[r.key]));
                  const sevColor = Number.isFinite(val) ? readingSeverityColor(r.key, val) : colors.textSecondary;
                  const sevLabel = Number.isFinite(val) ? getSeverityLabel(r.key, val) : null;
                  return (
                    <div key={r.key} className="flex items-center justify-between">
                      <span className="text-[14px]" style={{ color: colors.textSecondary }}>{r.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: sevColor }}>
                          {liveReadings[r.key]} {r.unit}
                        </span>
                        {sevLabel && (
                          <span
                            className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md"
                            style={{ color: sevColor, background: `${sevColor}12`, border: `1px solid ${sevColor}25` }}
                          >
                            {sevLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Before → After comparison (verified mode only) */}
          {verifiedMode && beforeScore != null && s !== beforeScore && (
            <div className="max-w-lg mx-auto rounded-2xl p-5 mb-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: colors.textFaint }}>
                SCORE COMPARISON
              </p>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>Report Only</p>
                  <p className="text-[36px] font-black tabular-nums mt-1" style={{ color: tierInfo(beforeScore).color }}>{beforeScore}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="size-6" style={{ color: colors.textFaint }} />
                  <span className="text-[12px] font-bold" style={{ color: s < beforeScore ? colors.critical : colors.success }}>
                    {s < beforeScore ? "" : "+"}{s - beforeScore}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>With Live Test</p>
                  <p className="text-[36px] font-black tabular-nums mt-1" style={{ color: info.color }}>{s}</p>
                </div>
              </div>
              <p className="text-[13px] text-center mt-4" style={{ color: colors.textMuted }}>
                {s < beforeScore
                  ? "Your live test confirmed additional concerns not captured in the utility report alone."
                  : s > beforeScore
                    ? "Your live readings improved the overall score slightly."
                    : "Live test confirmed the report data."}
              </p>
            </div>
          )}

          {/* Data source */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="size-1.5 rounded-full" style={{ background: colors.textFaint }} />
            <p className="text-[13px]" style={{ color: colors.textFaint }}>
              Data from {report.utilityName}
            </p>
          </div>

          {/* Score Explainer — tier breakdown with explanations */}
          <div className="max-w-lg mx-auto mb-6">
            <DemoScoreExplainer currentScore={s} />
          </div>
        </>
      )}
    </div>
  );
}
