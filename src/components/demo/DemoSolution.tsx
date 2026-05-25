/* ──── Solution Overview ────
   Before → After score, recommended product, how it works.
   Surface cards, designTokens.
   ──── */

import { ArrowRight, Check, Shield, Sparkles, Star } from "lucide-react";
import { colors, getScoreTier } from "@/lib/designTokens";

interface Props {
  score?: number;
  company: any;
  report: any;
  onNext: () => void;
  onBack: () => void;
}

const SYSTEMS = [
  {
    name: "Excalibur Chlor-A-Soft",
    projected: 94,
    tier: "Gold",
    tagline: "Premium whole-home system",
    features: [
      "Removes chlorine, chloramine & VOCs",
      "Softens water (scale prevention)",
      "Protects appliances & plumbing",
      "Improves taste & odor",
      "Low maintenance — salt-free option available",
    ],
  },
  {
    name: "Excalibur Premium",
    projected: 91,
    tier: "Gold",
    tagline: "Advanced multi-stage filtration",
    features: [
      "Multi-stage carbon block technology",
      "Removes heavy metals & sediment",
      "Whole-home coverage",
      "Professional installation included",
      "10-year warranty",
    ],
  },
];

const HOW_STEPS = [
  { step: "1", title: "Professional Installation", desc: "Installed at your home's main water line — every faucet, shower, and appliance gets filtered water" },
  { step: "2", title: "Immediate Results", desc: "Your AquaScore improves instantly — contaminants are removed before water reaches your taps" },
  { step: "3", title: "Ongoing Protection", desc: "Continuous filtration with periodic maintenance to keep your family's water safe" },
];

const STEP_COLORS = ["#3b82f6", colors.success, "#8b5cf6"];

export function DemoSolution({ score, company, report: _report, onNext: _onNext, onBack: _onBack }: Props) {
  const currentScore = score ?? 0;
  const tier = getScoreTier(currentScore);
  const hasCustomProduct = company?.solutionProductName;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full mb-3" style={{ background: "rgba(139,92,246,0.1)" }}>
          <Shield className="size-7" style={{ color: "#8b5cf6" }} />
        </div>
        <h2 className="text-[28px] font-bold tracking-tight">The Solution</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          How to bring your water to Gold standard
        </p>
      </div>

      {/* Before → After */}
      <div className="rounded-2xl p-5" style={{ background: colors.surface }}>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textFaint }}>Current</p>
            <div
              className="flex size-16 items-center justify-center rounded-full mx-auto"
              style={{ border: `3px solid ${tier.color}` }}
            >
              <span className="text-[24px] font-bold">{currentScore}</span>
            </div>
          </div>
          <ArrowRight className="size-6" style={{ color: colors.textFaint }} />
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: `${colors.success}b0` }}>With Filtration</p>
            <div className="flex size-16 items-center justify-center rounded-full mx-auto" style={{ border: `3px solid ${colors.warning}` }}>
              <span className="text-[24px] font-bold" style={{ color: colors.warning }}>{SYSTEMS[0].projected}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl p-2.5" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
          <Sparkles className="size-4" style={{ color: colors.success }} />
          <span className="text-[14px] font-bold" style={{ color: colors.success }}>
            +{SYSTEMS[0].projected - currentScore} point improvement
          </span>
        </div>
      </div>

      {/* Custom product */}
      {hasCustomProduct && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(139,92,246,0.04)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="p-4" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(168,85,247,0.08))" }}>
            <div className="flex items-center gap-2">
              <Star className="size-4" style={{ color: "#8b5cf6" }} />
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Recommended Solution</p>
            </div>
          </div>
          <div className="p-5">
            {company.solutionProductImage && (
              <img src={company.solutionProductImage} alt={company.solutionProductName} className="w-full max-h-48 object-contain rounded-xl mb-4 bg-white/5 p-4" />
            )}
            <h3 className="text-[20px] font-bold" style={{ color: colors.textPrimary }}>{company.solutionProductName}</h3>
            {company.solutionProductDescription && (
              <p className="text-[14px] mt-2 leading-relaxed" style={{ color: colors.textSecondary }}>{company.solutionProductDescription}</p>
            )}
            {company.solutionProductBullets?.length > 0 && (
              <div className="mt-4 space-y-2">
                {company.solutionProductBullets.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="size-4 mt-0.5 shrink-0" style={{ color: "#8b5cf6" }} />
                    <span className="text-[14px]" style={{ color: colors.textSecondary }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Default systems */}
      {!hasCustomProduct && SYSTEMS.map((sys) => (
        <div key={sys.name} className="rounded-2xl overflow-hidden" style={{ background: colors.surface }}>
          <div className="p-4 flex items-center justify-between" style={{ background: `${colors.primary}06` }}>
            <div>
              <h3 className="text-[16px] font-bold" style={{ color: colors.textPrimary }}>{sys.name}</h3>
              <p className="text-[12px]" style={{ color: colors.textMuted }}>{sys.tagline}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: `${colors.warning}12`, border: `1px solid ${colors.warning}20` }}>
              <Star className="size-3" style={{ color: colors.warning }} />
              <span className="text-[12px] font-bold" style={{ color: colors.warning }}>{sys.tier} {sys.projected}</span>
            </div>
          </div>
          <div className="p-5 space-y-2">
            {sys.features.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <Check className="size-4 mt-0.5 shrink-0" style={{ color: colors.success }} />
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* How it works */}
      <div className="rounded-2xl p-5" style={{ background: colors.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: colors.textFaint }}>How It Works</p>
        <div className="space-y-3">
          {HOW_STEPS.map((item, i) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold" style={{ background: `${STEP_COLORS[i]}12`, color: STEP_COLORS[i] }}>
                {item.step}
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{item.title}</p>
                <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
