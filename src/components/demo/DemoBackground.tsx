/**
 * DemoBackground — atmospheric background images for each demo step.
 * Renders an absolutely-positioned image behind step content with a gradient overlay.
 * Uses CSS transitions for smooth crossfade between steps.
 */
import { useState, useEffect, useRef } from "react";

/* ── Step → Asset mapping ── */
const STEP_ASSETS: Record<string, { file: string; opacity: number }> = {
  intake:           { file: "01_intake.png",           opacity: 0.25 },
  welcome:          { file: "02_welcome.png",          opacity: 0.35 },
  homeProfile:      { file: "03_homeProfile.png",      opacity: 0.25 },
  customerConcerns: { file: "04_customerConcerns.png", opacity: 0.20 },
  contaminants:     { file: "05_contaminants.png",     opacity: 0.30 },
  topConcerns:      { file: "06_topConcerns.png",      opacity: 0.25 },
  score:            { file: "07_scoreReveal.png",       opacity: 0.35 },
  test:             { file: "08_liveTest.png",          opacity: 0.30 },
  verifiedScore:    { file: "09_verifiedScore.png",     opacity: 0.30 },
  impact:           { file: "10_impact.png",            opacity: 0.20 },
  rooms:            { file: "11_rooms.png",             opacity: 0.25 },
  system:           { file: "12_system.png",            opacity: 0.40 },
  transform:        { file: "13_scoreTransform.png",    opacity: 0.35 },
  trust:            { file: "14_trustProof.png",        opacity: 0.25 },
  comparison:       { file: "15_comparison.png",        opacity: 0.25 },
  pricing:          { file: "16_pricing.png",           opacity: 0.25 },
  boost:            { file: "17_scoreBoost.png",        opacity: 0.30 },
  summary:          { file: "18_summary.png",           opacity: 0.20 },
  decision:         { file: "19_decision.png",          opacity: 0.30 },
  customerClose:    { file: "20_customerClose.png",     opacity: 0.35 },
  dealerClose:      { file: "21_dealerClose.png",       opacity: 0.20 },
};

interface Props {
  stepKey: string;
}

export function DemoBackground({ stepKey }: Props) {
  const asset = STEP_ASSETS[stepKey];
  const [loaded, setLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(asset?.file || "");
  const prevStepRef = useRef(stepKey);

  // On step change, trigger crossfade
  useEffect(() => {
    if (stepKey !== prevStepRef.current) {
      setLoaded(false);
      prevStepRef.current = stepKey;
      const newAsset = STEP_ASSETS[stepKey];
      if (newAsset) {
        setCurrentSrc(newAsset.file);
      } else {
        setCurrentSrc("");
      }
    }
  }, [stepKey]);

  if (!asset || !currentSrc) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Background image */}
      <img
        key={currentSrc}
        src={`/assets/demo/${currentSrc}`}
        alt=""
        aria-hidden
        onLoad={() => setLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
        style={{ opacity: loaded ? asset.opacity : 0 }}
      />
      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,11,20,0.80) 0%, rgba(7,11,20,0.60) 40%, rgba(7,11,20,0.85) 100%)",
        }}
      />
    </div>
  );
}
