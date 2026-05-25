import { createPortal } from "react-dom";
import { Droplets, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { playTapSound, playBoostSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  projectedScore: number;
  boostedScore: number;
  company: any;
  report: any;
  onBoostApplied: (applied: boolean) => void;
  onNext: () => void;
}

export function DemoScoreBoost({ projectedScore, boostedScore, company, report, onBoostApplied, onNext }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [boosted, setBoosted] = useState(false);
  const color = company?.primaryColor || report.companyColor || "#2563eb";

  const roName = company?.demoConfig?.roSystemName || "Reverse Osmosis System";
  const roDesc =
    company?.demoConfig?.roSystemDescription ||
    "A premium under-sink reverse osmosis system that removes 99.9% of all remaining contaminants, giving you the purest water possible — included free with your whole-home system.";
  const roImage = company?.demoConfig?.roSystemImage || null;

  const displayScore = boosted ? boostedScore : projectedScore;

  const openModal = () => { playTapSound(); setShowModal(true); };
  const applyBoost = () => { setShowModal(false); setBoosted(true); onBoostApplied(true); playBoostSound(); };
  const closeModal = () => setShowModal(false);

  const modal = showModal
    ? createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/20 bg-[#111827] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="size-4 text-white/60" />
            </button>

            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6 text-center relative">
              <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1">
                <span className="text-[10px] font-bold text-emerald-400">FREE</span>
              </div>
              {roImage ? (
                <img src={roImage} alt={roName} className="mx-auto h-48 object-contain" />
              ) : (
                <div className="mx-auto size-48 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center">
                  <Droplets className="size-20 text-amber-500/40" />
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-black">{roName}</h3>
                <p className="text-sm text-white/50 mt-2 leading-relaxed">{roDesc}</p>
              </div>

              {/* Score comparison */}
              <div className="flex items-center justify-center gap-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="text-center">
                  <p className="text-xs text-white/40">Current</p>
                  <p className="text-2xl font-black">{projectedScore}</p>
                </div>
                <div className="text-amber-400 font-black text-xl">→</div>
                <div className="text-center">
                  <p className="text-xs text-amber-400">With RO</p>
                  <p className="text-2xl font-black text-amber-400">{boostedScore}</p>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={applyBoost}
                className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
                style={{ background: `linear-gradient(135deg, #f59e0b, #f97316)`, boxShadow: "0 4px 24px rgba(245,158,11,0.3)" }}
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
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {modal}

      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
          OPTIONAL UPGRADE
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          {boosted ? "Upgrade Applied" : "Go Even Further"}
        </h2>
        <p className="text-sm text-white/40 mt-1.5">
          {boosted
            ? "Premium drinking water protection added"
            : "Add premium drinking water protection — included free"}
        </p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={displayScore} size={200} animationDuration={boosted ? 2500 : 1200} />
        {boosted && (
          <div className="mt-3 flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">+{boostedScore - projectedScore} bonus points</span>
          </div>
        )}
      </div>

      {/* Action */}
      {!boosted ? (
        <button
          onClick={openModal}
          className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{ background: `linear-gradient(135deg, #f59e0b, #f97316)`, boxShadow: "0 4px 24px rgba(245,158,11,0.3)" }}
        >
          <Sparkles className="inline size-5 mr-2 -mt-0.5" />
          See the Upgrade →
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${color}, #06b6d4)`, boxShadow: `0 4px 24px ${color}30` }}
        >
          Continue →
        </button>
      )}

      {/* Skip */}
      {!boosted && (
        <button
          onClick={onNext}
          className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer py-2"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
