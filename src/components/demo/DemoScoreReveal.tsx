/* ──── Score Reveal — "Your Water Score Is Ready" ────
   Mockup-faithful: always side-by-side (headline left, gauge right).
   "OUT OF 100" label below score. Tier label left-aligned.
   Data source citation at bottom-left.
   ──── */

import { AlertTriangle, Award, Shield, Sparkles, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playRevealSound, playProcessingSound, haptic } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { DemoScoreExplainer } from "./DemoScoreExplainer";
import { colors } from "@/lib/designTokens";

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
      tier: "Excellent", color: colors.success, bg: `${colors.success}12`,
      border: `${colors.success}30`, icon: Award,
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
      tier: "Needs Improvement", color: colors.warning, bg: `${colors.warning}12`,
      border: `${colors.warning}30`, icon: AlertTriangle,
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
          <div className="space-y-3">
            <Sparkles className="mx-auto size-8 animate-pulse" style={{ color: colors.warning }} />
            <h2 className="text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              Your AquaScore
            </h2>
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
            className="flex items-center gap-2 rounded-2xl px-10 py-5 text-[18px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-10">
          <div className="text-5xl animate-bounce">{PHASE_DATA[phase].icon}</div>
          <div>
            <p className="text-[20px] font-semibold animate-pulse" style={{ color: colors.textPrimary }}>
              {PHASE_DATA[phase].label}
            </p>
            <p className="text-[13px] mt-3" style={{ color: colors.textFaint }}>Tap anywhere to skip</p>
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
            <div className="mb-10">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
                Verified Results
              </p>
              <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3" style={{ color: colors.textPrimary }}>
                Your Verified Water Score
              </h2>
              <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
                Local data confirmed with today's live test.
              </p>
            </div>
          )}

          {/* ── Main layout: always side-by-side (headline left, gauge right) ── */}
          <div className="flex flex-row items-start gap-10 mb-8" style={{ minHeight: "280px" }}>
            {/* Left: headline */}
            <div className="flex-1 pt-2">
              {!verifiedMode && (
                <>
                  <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight" style={{ color: colors.textPrimary }}>
                    Your Water<br />Score Is Ready
                  </h2>
                  <p className="text-[15px] mt-4 max-w-sm" style={{ color: colors.textMuted, lineHeight: 1.6 }}>
                    We analyzed your water quality and compared it to healthy water standards.
                  </p>
                  {/* Tier label — left-aligned */}
                  <p className="text-[16px] font-semibold mt-6" style={{ color: info.color }}>
                    {info.tier}
                  </p>
                </>
              )}

              {verifiedMode && (
                <>
                  {/* Live readings in success-colored card */}
                  {liveReadings && Object.keys(liveReadings).length > 0 && (
                    <div className="rounded-2xl p-5 space-y-3 mb-6" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
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
                            <span className="text-[14px]" style={{ color: colors.textSecondary }}>{r.label}</span>
                            <span className="text-[14px] font-semibold" style={{ color: colors.success }}>
                              {liveReadings[r.key]} {r.unit}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                  {/* Tier label */}
                  <p className="text-[16px] font-semibold" style={{ color: info.color }}>
                    {info.tier}
                  </p>
                </>
              )}
            </div>

            {/* Right: gauge */}
            <div className="shrink-0 flex flex-col items-center">
              <ScoreGauge score={s} size={200} animationDuration={2800} />
              <p className="text-[12px] font-medium uppercase tracking-wide mt-2" style={{ color: colors.textMuted }}>
                OUT OF 100
              </p>
            </div>
          </div>

          {/* Data source — bottom-left */}
          <div className="flex items-center gap-2 mb-6">
            <div className="size-1.5 rounded-full" style={{ background: colors.textFaint }} />
            <p className="text-[13px]" style={{ color: colors.textFaint }}>
              Data from {report.utilityName}
            </p>
          </div>

          {/* Score Explainer — below the fold, optional */}
          <div className="max-w-2xl mb-6">
            <DemoScoreExplainer currentScore={s} />
          </div>
        </>
      )}
    </div>
  );
}
