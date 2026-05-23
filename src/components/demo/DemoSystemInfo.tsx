import { ArrowRight, Check, Droplets, Info, Shield, Sparkles } from "lucide-react";
import { playTapSound } from "@/lib/demoSounds";

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

export function DemoSystemInfo({ company, report, onNext }: Props) {
  const color = company?.primaryColor || report.companyColor || "#2563eb";
  const cfg = company?.demoConfig;

  const productName = company?.solutionProductName || report.solutionProductName || null;
  const productDesc = company?.solutionProductDescription || report.solutionProductDescription || null;
  const productBullets = company?.solutionProductBullets?.length
    ? company.solutionProductBullets
    : report.solutionProductBullets?.length
      ? report.solutionProductBullets
      : [];
  const productImage = company?.solutionProductImage || report.solutionProductImage;

  const systemIncludes = cfg?.systemIncludes?.length ? cfg.systemIncludes : DEFAULT_SYSTEM_INCLUDES;
  const warrantyTitle = cfg?.warrantyTitle || "20 Year Unlimited Warranty";
  const warrantyBullets = cfg?.warrantyBullets?.length ? cfg.warrantyBullets : DEFAULT_WARRANTY_BULLETS;
  const howItWorks = cfg?.howItWorksSteps?.length ? cfg.howItWorksSteps : DEFAULT_HOW_IT_WORKS;
  const callouts = cfg?.systemCallouts?.length ? cfg.systemCallouts : DEFAULT_CALLOUTS;
  const additionalProducts = company?.additionalProducts || report.additionalProducts || [];

  const hasContent = productName || productBullets.length || productImage || systemIncludes.length;
  const stepColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#06b6d4"];

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
          YOUR SYSTEM
        </span>
        {productName ? (
          <>
            <h2 className="text-2xl font-black mt-3 leading-tight">{productName}</h2>
            {productDesc && <p className="text-sm text-white/50 mt-1">{productDesc}</p>}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black mt-3 leading-tight">Your Water Protection System</h2>
            <p className="text-sm text-white/50 mt-1">Custom designed for your water. Built for your home.</p>
          </>
        )}
      </div>

      {/* Product image */}
      {productImage ? (
        <div className="rounded-2xl border border-white/10 bg-white overflow-hidden shadow-2xl shadow-cyan-950/30">
          <img src={productImage} alt={productName || "System"} className="w-full h-64 object-contain p-4" />
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 h-48 flex flex-col items-center justify-center">
          <Shield className="size-16 text-cyan-500/30" />
          <p className="text-sm text-white/30 mt-3">Add a system image in settings</p>
        </div>
      )}

      {/* Key features */}
      {productBullets.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Key Features</p>
          </div>
          <div className="p-4 space-y-3">
            {productBullets.slice(0, 8).map((b: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
              >
                <div className="size-6 shrink-0 rounded-full flex items-center justify-center mt-0.5" style={{ background: `${color}15` }}>
                  <Check className="size-3.5" style={{ color }} />
                </div>
                <span className="text-sm text-white/80 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System includes */}
      {systemIncludes.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center gap-2">
            <Droplets className="size-4 text-blue-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">System Includes</p>
          </div>
          <div className="p-4 space-y-3">
            {systemIncludes.map((item: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 cursor-pointer"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                onClick={() => playTapSound()}
              >
                <div className="size-6 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                  <Check className="size-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">{item.title}</p>
                  {item.description && <p className="text-xs text-white/40 mt-0.5">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warranty */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}30`, background: `${color}08` }}>
        <div className="p-4 border-b flex items-center justify-center gap-3" style={{ borderColor: `${color}15` }}>
          <Shield className="size-5" style={{ color }} />
          <p className="text-base font-black" style={{ color }}>{warrantyTitle}</p>
        </div>
        {warrantyBullets.length > 0 && (
          <div className="p-4 space-y-2">
            {warrantyBullets.map((b: string, i: number) => (
              <div key={i} className="flex items-center gap-2.5">
                <Check className="size-3.5 shrink-0" style={{ color }} />
                <span className="text-sm text-white/70">{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      {howItWorks.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="size-4 text-violet-400" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">How It Works</p>
          </div>
          <div className="space-y-4">
            {howItWorks.map((step: any, i: number) => {
              const c = stepColors[i % stepColors.length];
              return (
                <div
                  key={i}
                  className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
                  style={{ animationDelay: `${200 + i * 120}ms`, animationFillMode: "both" }}
                  onClick={() => playTapSound()}
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                    style={{ background: `${c}25`, color: c }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional products */}
      {additionalProducts?.map((prod: any, i: number) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="p-5">
            {prod.image && (
              <div className="rounded-xl border border-white/10 bg-white overflow-hidden mb-3 flex items-center justify-center h-32">
                <img src={prod.image} alt={prod.name} className="h-full w-full object-contain p-2" />
              </div>
            )}
            <h4 className="font-bold text-base">{prod.name}</h4>
            <p className="text-xs text-white/50 mt-1">{prod.description}</p>
            {prod.bullets?.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {prod.bullets.map((b: string, j: number) => (
                  <div key={j} className="flex items-start gap-2">
                    <Check className="size-3.5 mt-0.5 shrink-0 text-emerald-400" />
                    <span className="text-xs text-white/60">{b}</span>
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
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <Sparkles className="size-4 mx-auto mb-1.5" style={{ color }} />
              <p className="text-[10px] font-bold text-white/60 leading-tight">{c}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasContent && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <Shield className="size-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/40 font-medium">No system info configured yet</p>
          <p className="text-xs text-white/25 mt-1">
            Add your system name, image, features, and warranty in Company Settings → Demo Customization
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl p-5 text-white text-left active:scale-[0.98] transition-transform cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${color}, #06b6d4)`, boxShadow: `0 4px 24px ${color}30` }}
      >
        <p className="font-bold text-lg">Protect your home. Protect your family.</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm opacity-80">See your investment</p>
          <ArrowRight className="size-4 opacity-80" />
        </div>
      </button>
    </div>
  );
}
