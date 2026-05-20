import { AlertTriangle, ChevronLeft, ChevronRight, FlaskConical, Shield, Skull } from "lucide-react";
import { useState } from "react";
import { contaminantName } from "@/lib/supabase";

interface Props {
  contaminants: any[];
  onNext: () => void;
  onBack: () => void;
}

function SeverityBar({ ratio }: { ratio: number }) {
  const width = Math.min(100, Math.max(5, ratio * 100));
  const color =
    ratio >= 1
      ? "bg-gradient-to-r from-red-500 to-red-400"
      : ratio >= 0.5
        ? "bg-gradient-to-r from-amber-500 to-amber-400"
        : "bg-gradient-to-r from-emerald-500 to-emerald-400";
  return (
    <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function DemoContaminantWalkthrough({ contaminants, onNext, onBack }: Props) {
  // Prioritize: legal violations first, then health, then by times_above_ewg
  const sorted = [...contaminants].sort((a, b) => {
    if (a.over_legal !== b.over_legal) return a.over_legal ? -1 : 1;
    if (a.over_health !== b.over_health) return a.over_health ? -1 : 1;
    return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
  });

  const [idx, setIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const c = sorted[idx];

  if (!c) {
    return (
      <div className="mx-auto max-w-lg pt-8 text-center">
        <FlaskConical className="mx-auto size-12 text-white/20 mb-4" />
        <p className="text-white/60">No contaminant data available</p>
      </div>
    );
  }

  if (showAll) {
    return (
      <div className="mx-auto max-w-lg space-y-4 pt-2">
        <div className="text-center mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">
            Full Contaminant Profile
          </p>
          <p className="text-2xl font-black mt-1">
            {contaminants.length} <span className="text-white/50 text-lg">Detected</span>
          </p>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {sorted.map((ct, i) => (
            <button
              key={ct.contaminant_id || ct.contaminant}
              onClick={() => {
                setIdx(i);
                setShowAll(false);
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left active:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {ct.over_legal ? (
                    <Skull className="size-4 shrink-0 text-red-400" />
                  ) : ct.over_health ? (
                    <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                  ) : (
                    <FlaskConical className="size-4 shrink-0 text-white/30" />
                  )}
                  <span className="text-sm font-semibold truncate">
                    {contaminantName(ct)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1 ml-2">
                  {ct.over_legal && (
                    <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-400">
                      LEGAL
                    </span>
                  )}
                  {ct.over_health && !ct.over_legal && (
                    <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      HEALTH
                    </span>
                  )}
                  {ct.times_above_ewg != null && ct.times_above_ewg > 1 && (
                    <span className="text-[10px] font-bold text-white/40">
                      {ct.times_above_ewg}×
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAll(false)}
          className="w-full rounded-xl bg-white/5 py-3 text-sm font-semibold text-white/70 active:bg-white/10"
        >
          ← Back to Detail View
        </button>
      </div>
    );
  }

  const ratio = c.health_guideline && c.health_guideline > 0
    ? c.detected_level / c.health_guideline
    : c.detected_level > 0
      ? 1
      : 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Counter */}
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40">
          Contaminant {idx + 1} of {sorted.length}
        </p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {/* Severity header */}
        <div
          className="p-5 pb-4"
          style={{
            background: c.over_legal
              ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))"
              : c.over_health
                ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))"
                : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            {c.over_legal ? (
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/20 border border-red-500/30">
                <Skull className="size-6 text-red-400" />
              </div>
            ) : c.over_health ? (
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
                <AlertTriangle className="size-6 text-amber-400" />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 border border-white/20">
                <FlaskConical className="size-6 text-white/50" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-black">{contaminantName(c)}</h3>
              <div className="flex gap-2 mt-1">
                {c.over_legal && (
                  <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Above Legal Limit
                  </span>
                )}
                {c.over_health && !c.over_legal && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Above Health Guideline
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="p-5 space-y-4">
          {/* Detected level */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">
              Detected Level
            </p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">
                {c.detected_level}
              </span>
              <span className="text-sm text-white/50 pb-1">{c.unit}</span>
            </div>
            <div className="mt-2">
              <SeverityBar ratio={ratio} />
            </div>
          </div>

          {/* Guidelines grid */}
          <div className="grid grid-cols-2 gap-3">
            {c.health_guideline != null && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
                  Health Guideline
                </p>
                <p className="text-lg font-bold mt-1">
                  {c.health_guideline} <span className="text-xs text-white/40">{c.unit}</span>
                </p>
              </div>
            )}
            {c.legal_limit != null && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/70">
                  Legal Limit
                </p>
                <p className="text-lg font-bold mt-1">
                  {c.legal_limit} <span className="text-xs text-white/40">{c.unit}</span>
                </p>
              </div>
            )}
            {c.times_above_ewg != null && c.times_above_ewg > 1 && (
              <div className="rounded-xl bg-white/5 p-3 col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">
                  Times Above EWG Guideline
                </p>
                <p className="text-3xl font-black text-amber-400 mt-1">
                  {c.times_above_ewg}×
                </p>
              </div>
            )}
          </div>

          {/* Health effect */}
          {c.effect && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5">
                Health Effects
              </p>
              <p className="text-sm text-white/80 leading-relaxed">{c.effect}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation between contaminants */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIdx((i) => Math.max(i - 1, 0))}
          disabled={idx === 0}
          className="flex size-12 items-center justify-center rounded-xl bg-white/5 disabled:opacity-30 active:bg-white/10"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => setShowAll(true)}
          className="flex-1 rounded-xl bg-white/5 py-3 text-xs font-semibold text-white/60 active:bg-white/10"
        >
          View All ({sorted.length})
        </button>
        <button
          onClick={() => setIdx((i) => Math.min(i + 1, sorted.length - 1))}
          disabled={idx === sorted.length - 1}
          className="flex size-12 items-center justify-center rounded-xl bg-white/5 disabled:opacity-30 active:bg-white/10"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
