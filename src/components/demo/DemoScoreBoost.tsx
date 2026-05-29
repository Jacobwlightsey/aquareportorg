/* ──── Score Boost — Optional RO Upgrade ────
   Calm, non-pushy. "Cherry on top" feeling.
   Surface cards, designTokens, clean modal.
   ──── */

import { createPortal } from "react-dom";
import { Droplets, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { playTapSound, playBoostSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { colors } from "@/lib/designTokens";
import type { CompanyForDemo } from "@/lib/types";

interface Props {
  projectedScore: number;
  boostedScore: number;
  company: CompanyForDemo;
  report: any;
  onBoostApplied: (applied: boolean) => void;
  onNext: () => void;
}

export function DemoScoreBoost({ projectedScore, boostedScore, company, report, onBoostApplied, onNext }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const color = company?.primaryColor || report.companyColor || "#2563eb";

  const roName = company?.demoConfig?.roSystemName || "Reverse Osmosis System";
  const roDesc = company?.demoConfig?.roSystemDescription ||
    "A premium under-sink reverse osmosis system that removes 99.9% of all remaining contaminants, giving you the purest water possible — included free with your whole-home system.";
  const roImage = company?.demoConfig?.roSystemImage || null;

  const displayScore = boosted ? boostedScore : projectedScore;

  const openModal = () => { playTapSound(); setShowModal(true); };
  const applyBoost = () => { setShowModal(false); setBoosted(true); onBoostApplied(true); playBoostSound(); };
  const closeModal = () => setShowModal(false);

  const modal = showModal
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500" style={{ background: colors.elevated }}>
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 size-8 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-70"
              style={{ background: `${colors.textFaint}15` }}
            >
              <X className="size-4" style={{ color: colors.textMuted }} />
            </button>

            {/* Hero */}
            <div className="p-6 text-center relative" style={{ background: `${colors.warning}08` }}>
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-md px-3 py-1" style={{ background: `${colors.success}12` }}>
                <span className="text-[11px] font-bold" style={{ color: colors.success }}>FREE</span>
              </div>
              {roImage ? (
                <img src={roImage} alt={roName} className="mx-auto h-48 object-contain" loading="lazy" />
              ) : (
                <div className="mx-auto size-48 rounded-full flex items-center justify-center" style={{ background: `${colors.warning}08` }}>
                  <Droplets className="size-20" style={{ color: `${colors.warning}40` }} />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>{roName}</h3>
                <p className="text-[14px] mt-2 leading-relaxed" style={{ color: colors.textMuted }}>{roDesc}</p>
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-4 rounded-xl p-4" style={{ background: `${colors.warning}08` }}>
                <div className="text-center">
                  <p className="text-[12px]" style={{ color: colors.textFaint }}>Current</p>
                  <p className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>{projectedScore}</p>
                </div>
                <div className="text-[20px] font-bold" style={{ color: colors.warning }}>→</div>
                <div className="text-center">
                  <p className="text-[12px]" style={{ color: colors.warning }}>With RO</p>
                  <p className="text-[24px] font-bold" style={{ color: colors.warning }}>{boostedScore}</p>
                </div>
              </div>

              <button
                onClick={applyBoost}
                className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${colors.warning}, #f97316)`, boxShadow: `0 4px 24px ${colors.warning}30` }}
              >
                <Sparkles className="inline size-5 mr-2 -mt-0.5" />
                Add RO System — Free
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-6 pt-4">
      {modal}

      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.warning}b0` }}>
          OPTIONAL UPGRADE
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">
          {boosted ? "Upgrade Applied" : "Go Even Further"}
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          {boosted ? "Premium drinking water protection added" : "Add premium drinking water protection — included free"}
        </p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={displayScore} size={200} animationDuration={boosted ? 2500 : 1200} />
        {boosted && (
          <div
            className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
            style={{ background: `${colors.warning}10` }}
          >
            <Sparkles className="size-4" style={{ color: colors.warning }} />
            <span className="text-[14px] font-semibold" style={{ color: colors.warning }}>+{boostedScore - projectedScore} bonus points</span>
          </div>
        )}
      </div>

      {/* Action */}
      {!boosted ? (
        <button
          onClick={openModal}
          className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${colors.warning}, #f97316)`, boxShadow: `0 4px 24px ${colors.warning}30` }}
        >
          <Sparkles className="inline size-5 mr-2 -mt-0.5" />
          See the Upgrade →
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${color}, ${colors.primary})`, boxShadow: `0 4px 24px ${color}20` }}
        >
          Continue →
        </button>
      )}

      {/* Skip */}
      {!boosted && (
        <button
          onClick={onNext}
          className="w-full text-center text-[14px] transition-colors cursor-pointer py-2"
          style={{ color: colors.textFaint }}
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
