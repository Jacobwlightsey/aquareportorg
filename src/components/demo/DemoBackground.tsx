/**
 * DemoBackground — atmospheric background images for each demo step.
 * Dual-layer crossfade: old image stays visible while new one fades in on top.
 * Preloads the next step's image for instant transitions.
 */
import { useState, useEffect, useRef } from "react";
import { colors } from "@/lib/designTokens";

/* ── Step → Asset mapping ── */
const STEP_ASSETS: Record<string, { file: string; opacity: number }> = {
  intake:           { file: "01_intake.webp",           opacity: 0.25 },
  welcome:          { file: "02_welcome.webp",          opacity: 0.35 },
  homeProfile:      { file: "03_homeProfile.webp",      opacity: 0.25 },
  customerConcerns: { file: "04_customerConcerns.webp", opacity: 0.20 },
  contaminants:     { file: "05_contaminants.webp",     opacity: 0.30 },
  topConcerns:      { file: "06_topConcerns.webp",      opacity: 0.25 },
  score:            { file: "07_scoreReveal.webp",       opacity: 0.35 },
  test:             { file: "08_liveTest.webp",          opacity: 0.30 },
  verifiedScore:    { file: "09_verifiedScore.webp",     opacity: 0.30 },
  impact:           { file: "10_impact.webp",            opacity: 0.20 },
  rooms:            { file: "11_rooms.webp",             opacity: 0.25 },
  scoreImprovement: { file: "13_scoreTransform.webp",    opacity: 0.30 },
  system:           { file: "12_system.webp",            opacity: 0.40 },
  transform:        { file: "13_scoreTransform.webp",    opacity: 0.35 },
  trust:            { file: "14_trustProof.webp",        opacity: 0.25 },
  beforeAfter:      { file: "13_scoreTransform.webp",    opacity: 0.25 },
  comparison:       { file: "15_comparison.webp",        opacity: 0.25 },
  pricing:          { file: "16_pricing.webp",           opacity: 0.25 },
  investmentBreakdown: { file: "16_pricing.webp",      opacity: 0.20 },
  boost:            { file: "17_scoreBoost.webp",        opacity: 0.30 },
  summary:          { file: "18_summary.webp",           opacity: 0.20 },
  decision:         { file: "19_decision.webp",          opacity: 0.30 },
  customerClose:    { file: "20_customerClose.webp",     opacity: 0.35 },
  dealerClose:      { file: "21_dealerClose.webp",       opacity: 0.20 },
};

const STEP_ORDER = Object.keys(STEP_ASSETS);

interface Layer {
  src: string;
  opacity: number;
  loaded: boolean;
}

interface Props {
  stepKey: string;
}

export function DemoBackground({ stepKey }: Props) {
  const asset = STEP_ASSETS[stepKey];
  const [layers, setLayers] = useState<Layer[]>(() => {
    if (!asset) return [];
    return [{ src: `/assets/demo/${asset.file}`, opacity: asset.opacity, loaded: false }];
  });
  const prevStepRef = useRef(stepKey);

  // On step change, add new layer on top (keep old visible underneath)
  useEffect(() => {
    if (stepKey === prevStepRef.current) return;
    prevStepRef.current = stepKey;
    const newAsset = STEP_ASSETS[stepKey];
    if (!newAsset) {
      setLayers([]);
      return;
    }
    const newSrc = `/assets/demo/${newAsset.file}`;
    setLayers(prev => {
      // Keep only the most recent loaded layer as base
      const base = prev.length > 0 ? [prev[prev.length - 1]] : [];
      return [...base, { src: newSrc, opacity: newAsset.opacity, loaded: false }];
    });
  }, [stepKey]);

  // When top layer loads, remove layers below it after transition completes
  const handleLoad = (idx: number) => {
    setLayers(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx], loaded: true };
      return next;
    });
    // After crossfade duration, prune old layers
    setTimeout(() => {
      setLayers(prev => prev.length > 1 ? [prev[prev.length - 1]] : prev);
    }, 1200);
  };

  // Preload next step's image
  useEffect(() => {
    const idx = STEP_ORDER.indexOf(stepKey);
    const nextKey = STEP_ORDER[idx + 1];
    if (nextKey && STEP_ASSETS[nextKey]) {
      const img = new Image();
      img.src = `/assets/demo/${STEP_ASSETS[nextKey].file}`;
    }
  }, [stepKey]);

  if (!asset && layers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {layers.map((layer, i) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          aria-hidden
          onLoad={() => handleLoad(i)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
          style={{ opacity: layer.loaded ? layer.opacity : 0 }}
        />
      ))}
      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, ${colors.bg}cc 0%, ${colors.bg}99 40%, ${colors.bg}d9 100%)`,
        }}
      />
    </div>
  );
}
