/* ──── System Info — "Clean Water From Every Tap" ────
   Product, warranty, how it works. Surface cards, designTokens.
   ──── */

import { Check, Droplets, Info, Shield, Sparkles } from "lucide-react";

import { colors } from "@/lib/designTokens";

interface Props {
  company: any;
  report: any;
  onNext: () => void;
}

const DEFAULT_SYSTEM_INCLUDES = [
  { title: "Carbon Filtration", description: "Reduces chlorine, chemicals, bad taste & odor" },
  { title: "Water Softening", description: "Reduces hardness, scale & protects plumbing" },
  { title: "Sediment Filtration", description: "Reduces dirt, rust, sand & fine particles" },
  { title: "Digital Control Valve", description: "High efficiency metered control valve" },
  { title: "Brine Tank with Safety Float", description: "Ensures reliable & efficient operation" },
  { title: "Bypass Valve", description: "Built-in bypass for easy maintenance" },
  { title: "Professional Installation", description: "Installed by certified water quality experts" },
];

const DEFAULT_WARRANTY_BULLETS = [
  "20 Year Warranty on Tanks",
  "20 Year Warranty on Control Valve",
  "10 Year Warranty on Components",
  "5 Year Warranty on Labor",
  "100% Parts & Labor Coverage",
  "No Prorating — Ever",
  "Lifetime Customer Support",
];

const DEFAULT_HOW_IT_WORKS = [
  { title: "Water Analysis", description: "We test your water and review your local utility data to identify concerns." },
  { title: "Custom Design", description: "Your system is configured specifically for the contaminants in your water." },
  { title: "Professional Installation", description: "Certified technicians install your system — free of charge." },
  { title: "Enjoy Better Water", description: "Cleaner, softer water from every tap in your home, starting day one." },
];

const DEFAULT_CALLOUTS = ["Free Professional Installation", "Free Annual Water Review", "Lifetime Support"];

const STEP_COLORS = ["#3b82f6", colors.success, "#8b5cf6", colors.warning, colors.primary];

export function DemoSystemInfo({ company, report, onNext }: Props) {
  const color = company?.primaryColor || report.companyColor || "#2563eb";
  const cfg = company?.demoConfig;

  const productName = company?.solutionProductName || report.solutionProductName || null;
  const productBullets = company?.solutionProductBullets?.length ? company.solutionProductBullets : report.solutionProductBullets?.length ? report.solutionProductBullets : [];
  const productImage = company?.solutionProductImage || report.solutionProductImage;

  const systemIncludes = cfg?.systemIncludes?.length ? cfg.systemIncludes : DEFAULT_SYSTEM_INCLUDES;
  const warrantyTitle = cfg?.warrantyTitle || "20 Year Unlimited Warranty";
  const warrantyBullets = cfg?.warrantyBullets?.length ? cfg.warrantyBullets : DEFAULT_WARRANTY_BULLETS;
  const howItWorks = cfg?.howItWorksSteps?.length ? cfg.howItWorksSteps : DEFAULT_HOW_IT_WORKS;
  const callouts = cfg?.systemCallouts?.length ? cfg.systemCallouts : DEFAULT_CALLOUTS;
  const additionalProducts = company?.additionalProducts || report.additionalProducts || [];

  const hasContent = productName || productBullets.length || productImage || systemIncludes.length;

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
          THE SOLUTION
        </p>
        <h2 className="text-[28px] font-bold mt-3 leading-tight tracking-tight">
          Clean Water From Every Tap
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          {productName || "Designed specifically for your home's water"}
        </p>
      </div>

      {/* Product image */}
      {productImage ? (
        <div className="rounded-2xl bg-white overflow-hidden shadow-2xl" style={{ boxShadow: `0 8px 32px ${colors.primary}10` }}>
          <img src={productImage} alt={productName || "System"} className="w-full h-64 object-contain p-4" />
        </div>
      ) : (
        <div className="rounded-2xl h-48 flex flex-col items-center justify-center" style={{ background: `${colors.primary}06` }}>
          <Shield className="size-16" style={{ color: `${colors.primary}30` }} />
          <p className="text-[13px] mt-3" style={{ color: colors.textFaint }}>Add a system image in settings</p>
        </div>
      )}

      {/* Key features */}
      {productBullets.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <Sparkles className="size-4" style={{ color: colors.warning }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>Key Features</p>
          </div>
          <div className="p-4 space-y-3">
            {productBullets.slice(0, 8).map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                <div className="size-6 shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ background: `${color}12` }}>
                  <Check className="size-3.5" style={{ color }} />
                </div>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System includes */}
      {systemIncludes.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <Droplets className="size-4" style={{ color: colors.primary }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>System Includes</p>
          </div>
          <div className="p-4 space-y-3">
            {systemIncludes.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-6 shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ background: `${colors.primary}10` }}>
                  <Check className="size-3.5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{item.title}</p>
                  {item.description && <p className="text-[12px] mt-0.5" style={{ color: colors.textFaint }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warranty */}
      <div className="rounded-2xl overflow-hidden" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
        <div className="p-4 flex items-center justify-center gap-3" style={{ borderBottom: `1px solid ${color}12` }}>
          <Shield className="size-5" style={{ color }} />
          <p className="text-[16px] font-bold" style={{ color }}>{warrantyTitle}</p>
        </div>
        {warrantyBullets.length > 0 && (
          <div className="p-4 space-y-2">
            {warrantyBullets.map((b: string, i: number) => (
              <div key={i} className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0" style={{ color }} />
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      {howItWorks.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <Info className="size-4" style={{ color: "#8b5cf6" }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>How It Works</p>
          </div>
          <div className="space-y-4">
            {howItWorks.map((step: any, i: number) => {
              const c = STEP_COLORS[i % STEP_COLORS.length];
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl text-[14px] font-bold" style={{ background: `${c}12`, color: c }}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{step.title}</p>
                    <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: colors.textMuted }}>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional products */}
      {additionalProducts?.map((prod: any, i: number) => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="p-5">
            {prod.image && (
              <div className="rounded-xl bg-white overflow-hidden mb-3 flex items-center justify-center h-32">
                <img src={prod.image} alt={prod.name} className="h-full w-full object-contain p-2" />
              </div>
            )}
            <h4 className="font-bold text-[16px]" style={{ color: colors.textPrimary }}>{prod.name}</h4>
            <p className="text-[12px] mt-1" style={{ color: colors.textMuted }}>{prod.description}</p>
            {prod.bullets?.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {prod.bullets.map((b: string, j: number) => (
                  <div key={j} className="flex items-start gap-2">
                    <Check className="size-3.5 mt-0.5 shrink-0" style={{ color: colors.success }} />
                    <span className="text-[12px]" style={{ color: colors.textSecondary }}>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Callouts */}
      {callouts.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {callouts.slice(0, 3).map((c: string, i: number) => (
            <div key={i} className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <Sparkles className="size-4 mx-auto mb-1.5" style={{ color }} />
              <p className="text-[10px] font-bold leading-tight" style={{ color: colors.textSecondary }}>{c}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="rounded-2xl border border-dashed p-8 text-center" style={{ borderColor: colors.border }}>
          <Shield className="size-10 mx-auto mb-3" style={{ color: colors.textFaint }} />
          <p className="text-[14px] font-medium" style={{ color: colors.textMuted }}>No system info configured yet</p>
          <p className="text-[12px] mt-1" style={{ color: colors.textFaint }}>Add your system name, image, features, and warranty in Company Settings → Demo Customization</p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl py-4 text-[16px] font-bold text-center active:scale-[0.97] transition-transform cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${color}, ${colors.primary})`, boxShadow: `0 4px 24px ${color}20` }}
      >
        Continue →
      </button>
    </div>
  );
}
