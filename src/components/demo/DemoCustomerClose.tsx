/* ──── Customer Close — "Thank You" ────
   Calm, celebratory. Surface cards, designTokens.
   ──── */

import { Droplets, Shield, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { playCelebrationSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { DemoQRCode } from "./DemoQRCode";
import { colors } from "@/lib/designTokens";

interface Props {
  report: any;
  company: any;
  finalScore: number;
  companyColor: string;
  onEndDemo: () => void;
}

const BENEFITS = [
  { icon: Shield, color: "#3b82f6", title: "Whole-Home Protection", desc: "Every tap, every faucet — filtered and softened" },
  { icon: Droplets, color: colors.primary, title: "Cleaner, Safer Water", desc: "Contaminants removed at the source" },
  { icon: Star, color: colors.warning, title: "Professional Installation", desc: "Expert setup at no additional cost" },
  { icon: Sparkles, color: colors.success, title: "Warranty Coverage", desc: "Industry-leading protection for your investment" },
];

export function DemoCustomerClose({ report, company, finalScore, companyColor, onEndDemo }: Props) {
  const [celebrated, setCelebrated] = useState(false);
  const firstName = report.customerName?.split(" ")[0] || "there";
  const companyName = report.companyName || company?.name || "us";
  const headline = company?.demoConfig?.closeHeadline || `Thank You, ${firstName}!`;

  useEffect(() => {
    if (!celebrated) {
      const timer = setTimeout(() => { playCelebrationSound(); setCelebrated(true); }, 800);
      return () => clearTimeout(timer);
    }
  }, [celebrated]);

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center size-16 rounded-full mb-4" style={{ background: `${colors.warning}12` }}>
          <Sparkles className="size-8" style={{ color: colors.warning }} />
        </div>
        <h2 className="text-[28px] font-bold leading-tight tracking-tight">{headline}</h2>
        <p className="text-[15px] mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: colors.textMuted }}>
          We're excited to help you achieve cleaner, safer water for your family.
        </p>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={finalScore} size={160} animationDuration={2000} />
        <p className="text-[13px] mt-2" style={{ color: colors.textFaint }}>Your projected AquaScore</p>
      </div>

      {/* Benefits */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>What You're Getting</p>
        {BENEFITS.map((b, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="size-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: `${b.color}12` }}>
              <b.icon className="size-4" style={{ color: b.color }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>{b.title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: colors.textMuted }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* QR */}
      {report.shareToken && (
        <DemoQRCode url={`https://myaquareport.com/r/${report.shareToken}`} label="Scan to View Your Report" companyColor={companyColor} />
      )}

      {/* Company footer */}
      <div className="rounded-2xl p-5 text-center" style={{ background: colors.surface }}>
        <p className="text-[14px]" style={{ color: colors.textMuted }}>
          Thank you for choosing <span className="font-semibold" style={{ color: colors.textPrimary }}>{companyName}</span>
        </p>
        <p className="text-[12px] mt-1" style={{ color: colors.textFaint }}>Your water quality partner</p>
      </div>

      {/* Hand back */}
      <button
        onClick={onEndDemo}
        className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{ background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`, boxShadow: `0 4px 24px ${companyColor}20` }}
      >
        Hand Back to Dealer →
      </button>
    </div>
  );
}
