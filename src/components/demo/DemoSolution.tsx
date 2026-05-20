import { ArrowRight, Check, Droplets, Shield, Sparkles, Star } from "lucide-react";

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

export function DemoSolution({ score, company, report, onNext, onBack }: Props) {
  const currentScore = score ?? 0;

  // Use company's custom product if configured, otherwise show default systems
  const hasCustomProduct = company?.solutionProductName;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 mb-3">
          <Shield className="size-7 text-violet-400" />
        </div>
        <h2 className="text-2xl font-black">The Solution</h2>
        <p className="text-sm text-white/50 mt-1">
          How to bring your water to Gold standard
        </p>
      </div>

      {/* Before → After */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center justify-center gap-4">
          {/* Current Score */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
              Current
            </p>
            <div
              className="flex size-16 items-center justify-center rounded-full border-[3px] mx-auto"
              style={{
                borderColor:
                  currentScore >= 80
                    ? "#f59e0b"
                    : currentScore >= 60
                      ? "#94a3b8"
                      : currentScore >= 40
                        ? "#f97316"
                        : "#ef4444",
              }}
            >
              <span className="text-2xl font-black">{currentScore}</span>
            </div>
          </div>

          <ArrowRight className="size-6 text-white/30" />

          {/* Projected Score */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70 mb-1">
              With Filtration
            </p>
            <div className="flex size-16 items-center justify-center rounded-full border-[3px] border-amber-400 mx-auto">
              <span className="text-2xl font-black text-amber-400">
                {SYSTEMS[0].projected}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
          <Sparkles className="size-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">
            +{SYSTEMS[0].projected - currentScore} point improvement
          </span>
        </div>
      </div>

      {/* Custom company product */}
      {hasCustomProduct && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-500/[0.06] overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500/15 to-purple-500/15 p-4">
            <div className="flex items-center gap-2">
              <Star className="size-4 text-violet-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
                Recommended Solution
              </p>
            </div>
          </div>
          <div className="p-5">
            {company.solutionProductImage && (
              <img
                src={company.solutionProductImage}
                alt={company.solutionProductName}
                className="w-full max-h-48 object-contain rounded-xl mb-4 bg-white/5 p-4"
              />
            )}
            <h3 className="text-xl font-black">{company.solutionProductName}</h3>
            {company.solutionProductDescription && (
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                {company.solutionProductDescription}
              </p>
            )}
            {company.solutionProductBullets?.length > 0 && (
              <div className="mt-4 space-y-2">
                {company.solutionProductBullets.map((b: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="size-4 mt-0.5 shrink-0 text-violet-400" />
                    <span className="text-sm text-white/70">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Default systems */}
      {!hasCustomProduct &&
        SYSTEMS.map((sys) => (
          <div
            key={sys.name}
            className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">{sys.name}</h3>
                <p className="text-xs text-white/50">{sys.tagline}</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-2.5 py-1">
                <Star className="size-3 text-amber-400" />
                <span className="text-xs font-bold text-amber-400">
                  {sys.tier} {sys.projected}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-2">
              {sys.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="size-4 mt-0.5 shrink-0 text-emerald-400" />
                  <span className="text-sm text-white/70">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* How it works */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
          How It Works
        </p>
        <div className="space-y-3">
          {[
            {
              step: "1",
              title: "Professional Installation",
              desc: "Installed at your home's main water line — every faucet, shower, and appliance gets filtered water",
            },
            {
              step: "2",
              title: "Immediate Results",
              desc: "Your AquaScore improves instantly — contaminants are removed before water reaches your taps",
            },
            {
              step: "3",
              title: "Ongoing Protection",
              desc: "Continuous filtration with periodic maintenance to keep your family's water safe",
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-sm font-black text-violet-400">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
