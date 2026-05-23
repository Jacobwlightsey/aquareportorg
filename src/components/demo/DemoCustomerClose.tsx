import { Droplets, Shield, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { playCelebrationSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  report: any;
  company: any;
  finalScore: number;
  companyColor: string;
  onEndDemo: () => void;
}

const BENEFITS = [
  { icon: Shield, color: "#3b82f6", title: "Whole-Home Protection", desc: "Every tap, every faucet — filtered and softened" },
  { icon: Droplets, color: "#06b6d4", title: "Cleaner, Safer Water", desc: "Contaminants removed at the source" },
  { icon: Star, color: "#f59e0b", title: "Professional Installation", desc: "Expert setup at no additional cost" },
  { icon: Sparkles, color: "#10b981", title: "Warranty Coverage", desc: "Industry-leading protection for your investment" },
];

export function DemoCustomerClose({ report, company, finalScore, companyColor, onEndDemo }: Props) {
  const [celebrated, setCelebrated] = useState(false);
  const firstName = report.customerName?.split(" ")[0] || "there";
  const companyName = report.companyName || company?.name || "us";
  const headline = company?.demoConfig?.closeHeadline || `Thank You, ${firstName}!`;

  useEffect(() => {
    if (!celebrated) {
      const timer = setTimeout(() => {
        playCelebrationSound();
        setCelebrated(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [celebrated]);

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-400/20 mb-4">
          <Sparkles className="size-8 text-amber-400" />
        </div>
        <h2 className="text-3xl font-black leading-tight">{headline}</h2>
        <p className="text-sm text-white/50 mt-2 max-w-xs mx-auto leading-relaxed">
          We're excited to help you achieve cleaner, safer water for your family.
        </p>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={finalScore} size={160} animationDuration={2000} />
        <p className="text-sm text-white/40 mt-2">Your projected AquaScore</p>
      </div>

      {/* Benefits */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">What You're Getting</p>
        {BENEFITS.map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="size-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${b.color}15` }}>
              <b.icon className="size-4" style={{ color: b.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Company footer */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-sm text-white/50">
          Thank you for choosing <span className="font-semibold text-white">{companyName}</span>
        </p>
        <p className="text-xs text-white/30 mt-1">Your water quality partner</p>
      </div>

      {/* End demo / hand back */}
      <button
        onClick={onEndDemo}
        className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)`, boxShadow: `0 4px 24px ${companyColor}30` }}
      >
        Hand Back to Dealer →
      </button>
    </div>
  );
}
